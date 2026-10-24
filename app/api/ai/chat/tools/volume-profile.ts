import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type ProfileCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

export async function runVolumeProfileAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as ProfileCandle[]
    ).filter(
      (c) =>
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        Number.isFinite(c.volume) &&
        c.high >= c.low &&
        c.volume >= 0 &&
        c.time !== undefined
    );

    if (candles.length < 5) {
      throw new Error(
        "Volume Profile requires at least 5 valid candles."
      );
    }

    const binCount = 24;
    const lowestPrice = Math.min(...candles.map((c) => c.low));
    const highestPrice = Math.max(...candles.map((c) => c.high));
    const priceRange = highestPrice - lowestPrice;

    if (priceRange <= 0) {
      throw new Error(
        "Cannot calculate Volume Profile because the price range is zero."
      );
    }

    const binSize = priceRange / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      lowerPrice: lowestPrice + i * binSize,
      upperPrice: lowestPrice + (i + 1) * binSize,
      volume: 0,
    }));

    for (const candle of candles) {
      const candleRange = candle.high - candle.low;

      if (candleRange === 0) {
        const index = Math.min(
          binCount - 1,
          Math.max(
            0,
            Math.floor((candle.close - lowestPrice) / binSize)
          )
        );

        bins[index].volume += candle.volume;
        continue;
      }

      for (const bin of bins) {
        const overlap = Math.max(
          0,
          Math.min(candle.high, bin.upperPrice) -
            Math.max(candle.low, bin.lowerPrice)
        );

        if (overlap > 0) {
          bins[bins.indexOf(bin)].volume +=
            candle.volume * (overlap / candleRange);
        }
      }
    }

    const totalProfileVolume = bins.reduce(
      (sum, bin) => sum + bin.volume,
      0
    );

    const maxVolume = Math.max(...bins.map((b) => b.volume));
    const pocIndex = bins.findIndex((b) => b.volume === maxVolume);
    const poc = bins[pocIndex];

    // Value Area: contiguous price bins containing approximately
    // 70% of profile volume, expanding outward from the POC.
    const targetVolume = totalProfileVolume * 0.7;
    let valueAreaLowIndex = pocIndex;
    let valueAreaHighIndex = pocIndex;
    let valueAreaVolume = bins[pocIndex].volume;

    while (
      valueAreaVolume < targetVolume &&
      (valueAreaLowIndex > 0 ||
        valueAreaHighIndex < binCount - 1)
    ) {
      const lowerVolume =
        valueAreaLowIndex > 0
          ? bins[valueAreaLowIndex - 1].volume
          : -1;

      const upperVolume =
        valueAreaHighIndex < binCount - 1
          ? bins[valueAreaHighIndex + 1].volume
          : -1;

      if (
        upperVolume > lowerVolume &&
        valueAreaHighIndex < binCount - 1
      ) {
        valueAreaHighIndex++;
        valueAreaVolume += bins[valueAreaHighIndex].volume;
      } else if (valueAreaLowIndex > 0) {
        valueAreaLowIndex--;
        valueAreaVolume += bins[valueAreaLowIndex].volume;
      } else {
        break;
      }
    }

    const valueAreaLow = bins[valueAreaLowIndex].lowerPrice;
    const valueAreaHigh = bins[valueAreaHighIndex].upperPrice;
    const currentPrice = candles[candles.length - 1].close;

    const nearestHighVolumeNodes = bins
      .map((bin, index) => ({
        index,
        price: (bin.lowerPrice + bin.upperPrice) / 2,
        volume: bin.volume,
      }))
      .filter(
        (bin) =>
          bin.volume >= maxVolume * 0.7 &&
          bin.index !== pocIndex
      )
      .sort(
        (a, b) =>
          Math.abs(a.price - currentPrice) -
          Math.abs(b.price - currentPrice)
      )
      .slice(0, 5);

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Volume Profile",
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      currentPrice,
      priceRange: {
        low: lowestPrice,
        high: highestPrice,
      },
      pointOfControl: {
        price: (poc.lowerPrice + poc.upperPrice) / 2,
        volume: poc.volume,
        description:
          "Price bin with the highest estimated traded volume",
      },
      valueArea: {
        low: valueAreaLow,
        high: valueAreaHigh,
        targetPercentage: 70,
      },
      highVolumeNodes: nearestHighVolumeNodes,
      profile: bins.map((bin) => ({
        price: (bin.lowerPrice + bin.upperPrice) / 2,
        lowerPrice: bin.lowerPrice,
        upperPrice: bin.upperPrice,
        volume: bin.volume,
        relativeVolume:
          maxVolume > 0 ? bin.volume / maxVolume : 0,
      })),
      fetchedAt: new Date().toISOString(),
      limitations: [
        "Volume is estimated from candle high-low ranges, not actual trades at each price.",
        "This profile covers the candles returned by the market-data provider, not necessarily a full exchange session.",
        "High-volume areas can indicate price acceptance; low-volume areas may indicate faster movement, but neither guarantees support or resistance.",
      ],
    };

    // Plot relative volume against price. This is profile data,
    // not a conventional time-series indicator.
    const chartLine: ToolChartLine = {
      id: "volume-profile",
      label: "Volume Profile (relative)",
      color: "#A78BFA",
      points: bins.map((bin) => ({
        time: (bin.lowerPrice + bin.upperPrice) / 2,
        value: maxVolume > 0 ? bin.volume / maxVolume : 0,
      })),
    };

    return {
      tool: "volumeProfileAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: [chartLine],
      },
    };
  } catch (error) {
    return {
      tool: "volumeProfileAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Volume Profile analysis failed.",
    };
  }
}