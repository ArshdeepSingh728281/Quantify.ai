import { NextRequest, NextResponse } from "next/server";
import { getMarketQuotes } from "@/lib/upstox";

export async function GET(request: NextRequest) {
  try {
    const instruments =
      request.nextUrl.searchParams.get("instruments");

    if (!instruments) {
      return NextResponse.json(
        {
          error: "Missing instruments",
        },
        {
          status: 400,
        }
      );
    }

    const instrumentKeys = instruments
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!instrumentKeys.length) {
      return NextResponse.json(
        {
          error: "No valid instruments",
        },
        {
          status: 400,
        }
      );
    }

    const data = await getMarketQuotes(instrumentKeys);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch market data",
      },
      {
        status: 500,
      }
    );
  }
}