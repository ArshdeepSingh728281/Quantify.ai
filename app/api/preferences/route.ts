import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

type TradingType =
  | "Day"
  | "Swing"
  | "Long-term";

type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

const DEFAULT_PREFERENCES = {
  tradingType: "Long-term" as TradingType,
  riskLevel: "Low" as RiskLevel,
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const client = await clientPromise;

    const db = client.db();

    const preferences =
      await db
        .collection("preferences")
        .findOne({
          userId: session.user.id,
        });

    /*
    |--------------------------------------------------------------------------
    | FIRST TIME USER
    |--------------------------------------------------------------------------
    */

    if (!preferences) {
      const newPreferences = {
        userId: session.user.id,

        tradingType:
          DEFAULT_PREFERENCES.tradingType,

        riskLevel:
          DEFAULT_PREFERENCES.riskLevel,

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection("preferences")
        .insertOne(
          newPreferences
        );

      return NextResponse.json({
        tradingType:
          newPreferences.tradingType,

        riskLevel:
          newPreferences.riskLevel,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTING USER
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      tradingType:
        preferences.tradingType ??
        DEFAULT_PREFERENCES.tradingType,

      riskLevel:
        preferences.riskLevel ??
        DEFAULT_PREFERENCES.riskLevel,
    });
  } catch (error) {
    console.error(
      "GET /api/preferences error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch user preferences.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
|--------------------------------------------------------------------------
| UPDATE PREFERENCES
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const tradingType =
      body?.tradingType;

    const riskLevel =
      body?.riskLevel;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    const validTradingTypes:
      TradingType[] = [
        "Day",
        "Swing",
        "Long-term",
      ];

    const validRiskLevels:
      RiskLevel[] = [
        "Low",
        "Medium",
        "High",
      ];

    if (
      !validTradingTypes.includes(
        tradingType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid trading type.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !validRiskLevels.includes(
        riskLevel
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid risk level.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE TO MONGODB
    |--------------------------------------------------------------------------
    */

    const client =
      await clientPromise;

    const db = client.db();

    await db
      .collection("preferences")
      .updateOne(
        {
          userId:
            session.user.id,
        },
        {
          $set: {
            tradingType,
            riskLevel,
            updatedAt:
              new Date(),
          },

          $setOnInsert: {
            userId:
              session.user.id,

            createdAt:
              new Date(),
          },
        },
        {
          upsert: true,
        }
      );

    return NextResponse.json({
      success: true,

      tradingType,

      riskLevel,
    });
  } catch (error) {
    console.error(
      "PUT /api/preferences error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update user preferences.",
      },
      {
        status: 500,
      }
    );
  }
}