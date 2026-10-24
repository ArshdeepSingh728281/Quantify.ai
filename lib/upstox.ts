const UPSTOX_BASE_URL = "https://api.upstox.com";

export async function getMarketQuotes(instrumentKeys: string[]) {
  const token = process.env.UPSTOX_ACCESS_TOKEN;

  if (!token) {
    throw new Error("UPSTOX_ACCESS_TOKEN is not configured");
  }

  const query = instrumentKeys.join(",");

  const response = await fetch(
    `${UPSTOX_BASE_URL}/v3/market-quote/quotes?instrument_key=${encodeURIComponent(
      query
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Upstox API error ${response.status}: ${error}`
    );
  }

  return response.json();
}