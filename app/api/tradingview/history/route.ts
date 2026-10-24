import { NextResponse } from "next/server";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

import { ObjectId } from "mongodb";

type WatchlistItem = {
  symbol: string;
  name: string;
  instrumentKey: string;
};

type UpstoxCandle = [
  string,
  number,
  number,
  number,
  number,
  number,
  number
];

type UpstoxResponse = {
  status?: string;

  data?: {
    candles?: UpstoxCandle[];
  };
};

function cleanSymbol(symbol: string) {
  return decodeURIComponent(symbol)
    .replace(/^NSE:/i, "")
    .trim()
    .toUpperCase();
}

function normalizeWatchlist(
  value: unknown
): WatchlistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is WatchlistItem =>
      item &&
      typeof item.symbol === "string" &&
      typeof item.name === "string" &&
      typeof item.instrumentKey === "string"
  );
}

async function getInstrumentKey(
  symbol: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const client = await clientPromise;

  const db = client.db();

  const users = db.collection("users");

  let user = null;

  if (ObjectId.isValid(session.user.id)) {
    user = await users.findOne({
      _id: new ObjectId(session.user.id),
    });
  }

  if (!user) {
    user = await users.findOne({
      _id: session.user.id as any,
    });
  }

  if (!user) {
    return null;
  }

  const watchlist =
    normalizeWatchlist(user.watchlist);

  const clean = cleanSymbol(symbol);

  const item = watchlist.find(
    (stock) =>
      stock.symbol
        .replace(/^NSE:/i, "")
        .toUpperCase() === clean
  );

  return item?.instrumentKey || null;
}

function resolutionToUpstox(
  resolution: string
) {
  switch (resolution) {
    case "1":
      return {
        unit: "minutes",
        interval: "1",
      };

    case "3":
      return {
        unit: "minutes",
        interval: "3",
      };

    case "5":
      return {
        unit: "minutes",
        interval: "5",
      };

    case "10":
      return {
        unit: "minutes",
        interval: "10",
      };

    case "15":
      return {
        unit: "minutes",
        interval: "15",
      };

    case "30":
      return {
        unit: "minutes",
        interval: "30",
      };

    case "60":
      return {
        unit: "minutes",
        interval: "60",
      };

    case "120":
      return {
        unit: "minutes",
        interval: "120",
      };

    case "240":
      return {
        unit: "minutes",
        interval: "240",
      };

    case "D":
      return {
        unit: "days",
        interval: "1",
      };

    case "W":
      return {
        unit: "weeks",
        interval: "1",
      };

    case "M":
      return {
        unit: "months",
        interval: "1",
      };

    default:
      return {
        unit: "days",
        interval: "1",
      };
  }
}

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function getFromDate(
  resolution: string,
  toDate: Date
) {
  const from = new Date(
    toDate.getTime()
  );

  switch (resolution) {
    case "1":
    case "3":
    case "5":
    case "10":
    case "15":
      from.setDate(
        from.getDate() - 30
      );
      break;

    case "30":
    case "60":
    case "120":
    case "240":
      from.setMonth(
        from.getMonth() - 3
      );
      break;

    case "D":
      from.setFullYear(
        from.getFullYear() - 10
      );
      break;

    case "W":
      from.setFullYear(
        from.getFullYear() - 15
      );
      break;

    case "M":
      from.setFullYear(
        from.getFullYear() - 20
      );
      break;

    default:
      from.setFullYear(
        from.getFullYear() - 10
      );
  }

  return from;
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const symbol =
      searchParams.get("symbol");

    const resolution =
      searchParams.get("resolution") ||
      "D";

    if (!symbol) {
      return NextResponse.json(
        {
          error:
            "symbol is required",
        },
        {
          status: 400,
        }
      );
    }

    const instrumentKey =
      await getInstrumentKey(symbol);

    if (!instrumentKey) {
      return NextResponse.json(
        {
          error:
            `No Upstox instrument key found for ${symbol}. Add this stock to your watchlist first.`,
        },
        {
          status: 404,
        }
      );
    }

    const accessToken =
      process.env.UPSTOX_ACCESS_TOKEN
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "UPSTOX_ACCESS_TOKEN is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      unit,
      interval,
    } =
      resolutionToUpstox(
        resolution
      );

    const today = new Date();

    const toDate =
      formatDate(today);

    const fromDate =
      formatDate(
        getFromDate(
          resolution,
          today
        )
      );

    const url =
      `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(
        instrumentKey
      )}/${unit}/${interval}/${toDate}/${fromDate}`;

    const response =
      await fetch(url, {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      });

    const text =
      await response.text();

    let data: UpstoxResponse;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid response from Upstox.",
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      console.error(
        "Upstox history error:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Upstox historical data request failed.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const candles =
      data.data?.candles || [];

    /*
     * Upstox:
     *
     * [
     *   timestamp,
     *   open,
     *   high,
     *   low,
     *   close,
     *   volume,
     *   openInterest
     * ]
     *
     * TradingView:
     *
     * {
     *   time,
     *   open,
     *   high,
     *   low,
     *   close,
     *   volume
     * }
     */

    const bars = candles
      .map(
        (candle) => {
          const timestamp =
            new Date(
              candle[0]
            ).getTime();

          return {
            time: timestamp,

            open: Number(
              candle[1]
            ),

            high: Number(
              candle[2]
            ),

            low: Number(
              candle[3]
            ),

            close: Number(
              candle[4]
            ),

            volume: Number(
              candle[5]
            ),
          };
        }
      )
      .filter(
        (bar) =>
          Number.isFinite(
            bar.time
          ) &&
          Number.isFinite(
            bar.open
          ) &&
          Number.isFinite(
            bar.high
          ) &&
          Number.isFinite(
            bar.low
          ) &&
          Number.isFinite(
            bar.close
          )
      )
      .sort(
        (a, b) =>
          a.time - b.time
      );

    return NextResponse.json(
      {
        symbol:
          cleanSymbol(symbol),

        instrumentKey,

        bars,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/tradingview/history error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load historical market data.",
      },
      {
        status: 500,
      }
    );
  }
}