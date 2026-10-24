import { NextResponse } from "next/server";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

import { ObjectId } from "mongodb";

type WatchlistItem = {
  symbol: string;
  name: string;
  instrumentKey: string;
};

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Range =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "All";

function cleanSymbol(
  symbol: string
) {
  return symbol
    .replace(/^NSE:/i, "")
    .trim()
    .toUpperCase();
}

function getDate(
  daysAgo = 0
) {
  const date =
    new Date();

  date.setDate(
    date.getDate() - daysAgo
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getRangeDates(
  range: Range
) {
  const today =
    getDate(0);

  switch (range) {
    case "1D":
      return {
        from: today,
        to: today,
        unit: "minutes",
        interval: "1",
      };

    case "5D":
      return {
        from: getDate(7),
        to: today,
        unit: "minutes",
        interval: "5",
      };

    case "1M":
      return {
        from: getDate(35),
        to: today,
        unit: "minutes",
        interval: "15",
      };

    case "3M":
      return {
        from: getDate(100),
        to: today,
        unit: "minutes",
        interval: "30",
      };

    case "6M":
      return {
        from: getDate(190),
        to: today,
        unit: "days",
        interval: "1",
      };

    case "YTD": {
      const year =
        new Date().getFullYear();

      return {
        from: `${year}-01-01`,
        to: today,
        unit: "days",
        interval: "1",
      };
    }

    case "1Y":
      return {
        from: getDate(370),
        to: today,
        unit: "days",
        interval: "1",
      };

    case "5Y":
      return {
        from: getDate(5 * 365 + 10),
        to: today,
        unit: "weeks",
        interval: "1",
      };

    case "All":
      return {
        from: "2000-01-01",
        to: today,
        unit: "months",
        interval: "1",
      };

    default:
      return {
        from: today,
        to: today,
        unit: "minutes",
        interval: "1",
      };
  }
}

async function findUser(
  userId: string
) {
  const client =
    await clientPromise;

  const db =
    client.db();

  const users =
    db.collection("users");

  let user = null;

  if (
    ObjectId.isValid(userId)
  ) {
    user =
      await users.findOne({
        _id: new ObjectId(
          userId
        ),
      });
  }

  if (!user) {
    user =
      await users.findOne({
        _id: userId as any,
      });
  }

  return {
    client,
    db,
    user,
  };
}

function normalizeWatchlist(
  value: unknown
): WatchlistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    item =>
      item &&
      typeof item.symbol ===
        "string" &&
      typeof item.name ===
        "string" &&
      typeof item.instrumentKey ===
        "string"
  );
}

function number(
  value: unknown
) {
  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
}

export async function GET(
  request: Request
) {
  try {
    /*
     * ----------------------------------------------------------
     * AUTH
     * ----------------------------------------------------------
     */

    const session =
      await auth();

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * QUERY
     * ----------------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    const symbol =
      cleanSymbol(
        searchParams.get(
          "symbol"
        ) || ""
      );

    const range =
      (searchParams.get(
        "range"
      ) || "1D") as Range;

    if (!symbol) {
      return NextResponse.json(
        {
          error:
            "symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * FIND INSTRUMENT KEY
     * ----------------------------------------------------------
     *
     * This is important.
     *
     * TradingView uses:
     *
     * NSE:HDFCAMC
     *
     * Upstox uses:
     *
     * NSE_EQ|INE...
     *
     * We use the user's MongoDB watchlist
     * to translate symbol -> Upstox instrumentKey.
     */

    const { user } =
      await findUser(
        session.user.id
      );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "User account not found.",
        },
        {
          status: 404,
        }
      );
    }

    const watchlist =
      normalizeWatchlist(
        user.watchlist
      );

    const stock =
      watchlist.find(
        item =>
          cleanSymbol(
            item.symbol
          ) === symbol
      );

    if (!stock) {
      return NextResponse.json(
        {
          error:
            `${symbol} is not in your watchlist. Add it first so we can resolve its Upstox instrument key.`,
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * UPSTOX TOKEN
     * ----------------------------------------------------------
     */

    const token =
      process.env.UPSTOX_ACCESS_TOKEN
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    if (!token) {
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

    /*
     * ----------------------------------------------------------
     * RANGE
     * ----------------------------------------------------------
     */

    const {
      from,
      to,
      unit,
      interval,
    } =
      getRangeDates(range);

    /*
     * ----------------------------------------------------------
     * UPSTOX V3
     * ----------------------------------------------------------
     *
     * /historical-candle/
     *
     * instrument
     * unit
     * interval
     * to
     * from
     */

    const encodedInstrument =
      encodeURIComponent(
        stock.instrumentKey
      );

    const url =
      `https://api.upstox.com/v3/historical-candle/${encodedInstrument}/${unit}/${interval}/${to}/${from}`;

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

    const text =
      await response.text();

    let result: any;

    try {
      result =
        JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error:
            "Upstox returned an invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      console.error(
        "Upstox chart error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.errors?.[0]
              ?.message ||
            "Upstox failed to return chart data.",
        },
        {
          status: response.status,
        }
      );
    }

    /*
     * ----------------------------------------------------------
     * CONVERT UPSTOX CANDLES
     * ----------------------------------------------------------
     *
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
     */

    const rawCandles =
      result?.data?.candles ||
      [];

    const candles: Candle[] =
      rawCandles
        .map(
          (item: any[]) => ({
            time:
              item[0],

            open:
              number(item[1]),

            high:
              number(item[2]),

            low:
              number(item[3]),

            close:
              number(item[4]),

            volume:
              number(item[5]),
          })
        )
        .filter(
          (candle: Candle) =>
            candle.open > 0 &&
            candle.high > 0 &&
            candle.low > 0 &&
            candle.close > 0
        )
        .reverse();

    /*
     * ----------------------------------------------------------
     * CURRENT PRICE
     * ----------------------------------------------------------
     *
     * Use Upstox Full Market Quote for the
     * current price rather than waiting for
     * the candle endpoint.
     */

    let price:
      | number
      | null = null;

    let changePercent:
      | number
      | null = null;

    try {
      const quoteUrl =
        `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
          stock.instrumentKey
        )}`;

      const quoteResponse =
        await fetch(
          quoteUrl,
          {
            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

      if (
        quoteResponse.ok
      ) {
        const quote =
          await quoteResponse.json();

        const quoteData =
          quote?.data || {};

        const quoteValue =
          quoteData[
            stock.instrumentKey
          ] ||
          Object.values(
            quoteData
          ).find(
            (item: any) =>
              item?.symbol ===
              stock.symbol
          ) as any;

        if (quoteValue) {
          price =
            number(
              quoteValue.last_price
            );

          const netChange =
            number(
              quoteValue.net_change
            );

          if (
            price > 0
          ) {
            const previousClose =
              price -
              netChange;

            if (
              previousClose !==
                0
            ) {
              changePercent =
                (netChange /
                  previousClose) *
                100;
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "Quote request failed:",
        error
      );
    }

    /*
     * If quote API did not return
     * current price, use latest candle.
     */

    if (
      price === null &&
      candles.length
    ) {
      price =
        candles[
          candles.length - 1
        ].close;
    }

    return NextResponse.json(
      {
        success: true,

        symbol,

        instrumentKey:
          stock.instrumentKey,

        range,

        candles,

        price,

        changePercent,

        source:
          "upstox",

        updatedAt:
          new Date().toISOString(),
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
      "GET /api/stock-chart error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load stock chart.",
      },
      {
        status: 500,
      }
    );
  }
}