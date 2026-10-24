import { NextResponse } from "next/server";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

import { ObjectId } from "mongodb";

type WatchlistItem = {
  symbol: string;
  name: string;
  instrumentKey: string;
};

type UpstoxQuote = {
  last_price?: number;

  net_change?: number;

  volume?: number;

  average_price?: number;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
};

function cleanSymbol(
  symbol: string
) {
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
      typeof item.instrumentKey ===
        "string"
  );
}

async function getStock(
  symbol: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const client =
    await clientPromise;

  const db = client.db();

  const users =
    db.collection("users");

  let user = null;

  if (
    ObjectId.isValid(
      session.user.id
    )
  ) {
    user =
      await users.findOne({
        _id: new ObjectId(
          session.user.id
        ),
      });
  }

  if (!user) {
    user =
      await users.findOne({
        _id: session.user.id as any,
      });
  }

  if (!user) {
    return null;
  }

  const watchlist =
    normalizeWatchlist(
      user.watchlist
    );

  const clean =
    cleanSymbol(symbol);

  return watchlist.find(
    (item) =>
      item.symbol
        .replace(/^NSE:/i, "")
        .toUpperCase() === clean
  );
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const symbol =
      searchParams.get("symbol");

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

    const stock =
      await getStock(symbol);

    if (!stock) {
      return NextResponse.json(
        {
          error:
            "Stock not found in watchlist.",
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

    const url =
      `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
        stock.instrumentKey
      )}`;

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

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Unable to get latest Upstox quote.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const quote =
      data?.data?.[
        stock.instrumentKey
      ] as UpstoxQuote | undefined;

    if (!quote) {
      return NextResponse.json(
        {
          error:
            "Upstox returned no quote for this instrument.",
        },
        {
          status: 404,
        }
      );
    }

    const price =
      Number(
        quote.last_price
      );

    const change =
      Number(
        quote.net_change
      );

    const previousClose =
      Number(
        quote.ohlc?.close
      );

    let changePercent =
      null;

    if (
      Number.isFinite(
        price
      ) &&
      Number.isFinite(
        change
      )
    ) {
      const previous =
        price - change;

      if (
        previous !== 0
      ) {
        changePercent =
          (change /
            previous) *
          100;
      }
    }

    return NextResponse.json(
      {
        symbol:
          stock.symbol,

        instrumentKey:
          stock.instrumentKey,

        price:
          Number.isFinite(
            price
          )
            ? price
            : null,

        change:
          Number.isFinite(
            change
          )
            ? change
            : null,

        changePercent,

        open:
          Number(
            quote.ohlc?.open
          ),

        high:
          Number(
            quote.ohlc?.high
          ),

        low:
          Number(
            quote.ohlc?.low
          ),

        close:
          Number(
            quote.ohlc?.close
          ),

        volume:
          Number(
            quote.volume
          ),

        averagePrice:
          Number(
            quote.average_price
          ),

        timestamp:
          Date.now(),
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
      "GET /api/tradingview/quote error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load realtime quote.",
      },
      {
        status: 500,
      }
    );
  }
}