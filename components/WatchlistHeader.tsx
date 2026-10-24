"use client";

import { useEffect, useState } from "react";

import {
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  signIn,
  useSession,
} from "next-auth/react";

import Sparkline from "./Sparkline";


type WatchlistStock = {
  symbol: string;
  name: string;
  instrumentKey: string;
};


type MarketData = {
  instrumentKey: string;

  price: number | null;
  change: number | null;
  changePercent: number | null;

  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;

  volume: number | null;
  averagePrice: number | null;

  chart: number[];
};


type WatchlistResponse = {
  success: boolean;

  watchlist: WatchlistStock[];

  marketData: MarketData[];

  source?: string;

  marketOpen?: boolean;

  cachedAt?: string | Date | null;

  expiresAt?: string | Date | null;

  error?: string;
};


const LOCAL_STORAGE_KEY =
  "quantify_watchlist";


/*
|--------------------------------------------------------------------------
| FORMAT PRICE
|--------------------------------------------------------------------------
*/

function formatPrice(
  price: number | null | undefined
) {
  if (
    price === null ||
    price === undefined ||
    !Number.isFinite(price)
  ) {
    return "—";
  }

  return `₹${price.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}


/*
|--------------------------------------------------------------------------
| FORMAT CHANGE
|--------------------------------------------------------------------------
*/

function formatChange(
  change: number | null | undefined
) {
  if (
    change === null ||
    change === undefined ||
    !Number.isFinite(change)
  ) {
    return "—";
  }

  return `${
    change >= 0 ? "+" : ""
  }${change.toFixed(2)}%`;
}


/*
|--------------------------------------------------------------------------
| WATCHLIST HEADER
|--------------------------------------------------------------------------
*/

export default function WatchlistHeader() {

  const router = useRouter();

  const {
    data: session,
    status,
  } = useSession();


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    watchlist,
    setWatchlist,
  ] = useState<WatchlistStock[]>([]);


  const [
    marketData,
    setMarketData,
  ] = useState<MarketData[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    removingStock,
    setRemovingStock,
  ] = useState<string | null>(null);


  /*
  |--------------------------------------------------------------------------
  | LOAD WATCHLIST
  |--------------------------------------------------------------------------
  |
  | MongoDB is the source of truth.
  |
  */

  async function loadWatchlist(
    showLoading = false
  ) {

    try {

      if (showLoading) {
        setLoading(true);
      }


      const response =
        await fetch(
          "/api/watchlist",
          {
            method: "GET",

            cache: "no-store",
          }
        );


      const data: WatchlistResponse =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.error ||
            "Failed to load watchlist."
        );

      }


      /*
      |--------------------------------------------------------------------------
      | NORMALIZE SERVER WATCHLIST
      |--------------------------------------------------------------------------
      */

      const serverWatchlist =
        Array.isArray(
          data.watchlist
        )
          ? data.watchlist.filter(
              (
                item
              ): item is WatchlistStock =>
                Boolean(
                  item &&
                  typeof item.symbol ===
                    "string" &&
                  typeof item.name ===
                    "string" &&
                  typeof item.instrumentKey ===
                    "string"
                )
            )
          : [];


      /*
      |--------------------------------------------------------------------------
      | MARKET DATA
      |--------------------------------------------------------------------------
      */

      const serverMarketData =
        Array.isArray(
          data.marketData
        )
          ? data.marketData
          : [];


      /*
      |--------------------------------------------------------------------------
      | UPDATE UI
      |--------------------------------------------------------------------------
      */

      setWatchlist(
        serverWatchlist
      );

      setMarketData(
        serverMarketData
      );


      /*
      |--------------------------------------------------------------------------
      | UPDATE LOCAL STORAGE
      |--------------------------------------------------------------------------
      |
      | Store the same object structure that
      | MongoDB uses.
      |
      */

      try {

        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(
            serverWatchlist
          )
        );

      } catch (error) {

        console.error(
          "Failed to update watchlist localStorage:",
          error
        );

      }

    } catch (error) {

      console.error(
        "Failed to load watchlist:",
        error
      );

    } finally {

      if (showLoading) {
        setLoading(false);
      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      status !==
      "authenticated"
    ) {

      setLoading(false);

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | LOAD LOCAL STORAGE FIRST
    |--------------------------------------------------------------------------
    |
    | This is only used for quick initial rendering.
    | Backend is loaded immediately afterwards.
    |
    */

    try {

      const stored =
        localStorage.getItem(
          LOCAL_STORAGE_KEY
        );


      if (stored) {

        const parsed =
          JSON.parse(stored);


        /*
        |--------------------------------------------------------------------------
        | SUPPORT BOTH OLD FORMATS
        |--------------------------------------------------------------------------
        */

        if (
          Array.isArray(
            parsed
          )
        ) {

          /*
           * New format:
           *
           * [
           *   {
           *     symbol,
           *     name,
           *     instrumentKey
           *   }
           * ]
           */

          const objects =
            parsed.filter(
              (
                item
              ): item is WatchlistStock =>
                Boolean(
                  item &&
                  typeof item ===
                    "object" &&
                  typeof item.symbol ===
                    "string" &&
                  typeof item.name ===
                    "string" &&
                  typeof item.instrumentKey ===
                    "string"
                )
            );


          if (
            objects.length > 0
          ) {

            setWatchlist(
              objects
            );

          }

        }

      }

    } catch (error) {

      console.error(
        "Failed to read watchlist from localStorage:",
        error
      );

    }


    /*
    |--------------------------------------------------------------------------
    | ALWAYS GET LATEST SERVER DATA
    |--------------------------------------------------------------------------
    */

    loadWatchlist(
      true
    );

  }, [status]);


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | LISTEN FOR STOCKTABLE ADD / REMOVE
  |--------------------------------------------------------------------------
  |
  | DO NOT directly setWatchlist(event.detail)
  |
  | StockTable may send string[].
  |
  | Instead, reload the real objects from
  | MongoDB through /api/watchlist.
  |
  */

  useEffect(() => {

    if (
      status !==
      "authenticated"
    ) {
      return;
    }


    const handleWatchlistUpdated =
      () => {

        /*
        * Small delay gives the POST/DELETE request
        * time to finish updating MongoDB.
        */

        setTimeout(
          () => {

            loadWatchlist(
              false
            );

          },
          100
        );

      };


    /*
    |--------------------------------------------------------------------------
    | SUPPORT BOTH EVENTS
    |--------------------------------------------------------------------------
    */

    window.addEventListener(
      "watchlist-updated",
      handleWatchlistUpdated
    );


    window.addEventListener(
      "watchlist-changed",
      handleWatchlistUpdated
    );


    return () => {

      window.removeEventListener(
        "watchlist-updated",
        handleWatchlistUpdated
      );


      window.removeEventListener(
        "watchlist-changed",
        handleWatchlistUpdated
      );

    };

  }, [status]);


  /*
  |--------------------------------------------------------------------------
  | AUTO REFRESH WATCHLIST
  |--------------------------------------------------------------------------
  |
  | Backend already controls the 4-minute market cache.
  |
  | We can safely ask the backend periodically.
  |
  */

  useEffect(() => {

    if (
      status !==
      "authenticated"
    ) {
      return;
    }


    const interval =
      setInterval(
        () => {

          loadWatchlist(
            false
          );

        },
        30_000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [status]);


  /*
  |--------------------------------------------------------------------------
  | REMOVE STOCK
  |--------------------------------------------------------------------------
  */

  async function removeFromWatchlist(
    stock: WatchlistStock
  ) {

    if (
      removingStock ===
      stock.instrumentKey
    ) {
      return;
    }


    try {

      setRemovingStock(
        stock.instrumentKey
      );


      const response =
        await fetch(
          "/api/watchlist",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                instrumentKey:
                  stock.instrumentKey,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data?.error ||
            "Failed to remove stock."
        );

      }


      /*
      |--------------------------------------------------------------------------
      | REMOVE IMMEDIATELY FROM UI
      |--------------------------------------------------------------------------
      */

      setWatchlist(
        current =>
          current.filter(
            item =>
              item.instrumentKey !==
              stock.instrumentKey
          )
      );


      /*
      |--------------------------------------------------------------------------
      | REMOVE MARKET DATA
      |--------------------------------------------------------------------------
      */

      setMarketData(
        current =>
          current.filter(
            item =>
              item.instrumentKey !==
              stock.instrumentKey
          )
      );


      /*
      |--------------------------------------------------------------------------
      | UPDATE LOCAL STORAGE
      |--------------------------------------------------------------------------
      */

      const updatedWatchlist =
        watchlist.filter(
          item =>
            item.instrumentKey !==
            stock.instrumentKey
        );


      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(
          updatedWatchlist
        )
      );


      /*
      |--------------------------------------------------------------------------
      | NOTIFY STOCK TABLE
      |--------------------------------------------------------------------------
      */

      window.dispatchEvent(
        new Event(
          "watchlist-updated"
        )
      );


    } catch (error) {

      console.error(
        "Remove watchlist error:",
        error
      );

    } finally {

      setRemovingStock(
        null
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | OPEN STOCK
  |--------------------------------------------------------------------------
  */

  // function openStock(
  //   symbol: string
  // ) {

  //   if (!session) {

  //     signIn(
  //       "google",
  //       {
  //         callbackUrl:
  //           `/stock/${encodeURIComponent(
  //             symbol
  //           )}`,
  //       }
  //     );

  //     return;

  //   }
  // const newChatId = crypto.randomUUID();

  //   router.push(
  //     `/stock/${encodeURIComponent(symbol)}/${newChatId}`
  //   );

  // }



function openStock(symbol: string) {
  const newChatId = crypto.randomUUID();

  if (!session) {
    signIn("google", {
      callbackUrl: `/stock/${encodeURIComponent(
        symbol
      )}/${newChatId}`,
    });

    return;
  }

  router.push(
    `/stock/${encodeURIComponent(
      symbol
    )}/${newChatId}`
  );
}




  /*
  |--------------------------------------------------------------------------
  | GET MARKET DATA
  |--------------------------------------------------------------------------
  */

  function getMarketData(
    instrumentKey: string
  ) {

    return marketData.find(
      item =>
        item.instrumentKey ===
        instrumentKey
    );

  }


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <section className="mb-[30px] googlesans quantify-content changed bg-[#15151b] mx-[auto] mt-[40px] watchlist-card py-[40px] px-[30px]">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">


        {/* LEFT */}

        <div>

          <div className="flex items-center gap-3">

            <h1 className="text-[30px] font-semibold tracking-[-1px] text-white">

              Your Watchlist

            </h1>


            <span className="border border-[#282b30] bg-[#15171a] px-2 py-1 text-[9px] tracking-[1px] text-[#a5a7ac]">

              <span className="text-[#00e0a5]">
                ■
              </span>{" "}

              LIVE

            </span>

          </div>


          <p className="text-[15px] text-[white]/40 mt-1">

            Curated portfolio tracking powered by
            real-time quantitative algorithms and
            statistical models.

          </p>

        </div>


        {/* RIGHT */}

        <div className="flex items-center gap-4">


          <div className="py-[6px] border border-[#24242b] bg-[#0d0d10] px-4 flex items-center rounded-[3px] gap-3 text-[13px] text-[#777]">

            <span>

              POSITIONS{" "}

              <b className="text-white">

                {watchlist.length}

              </b>{" "}

              Open

            </span>


            <span className="h-3 border-l border-[#333]" />


            <span>

              TOTAL P&L{" "}

              <b className="text-white">
                ₹0.00
              </b>{" "}

              (0.0%)

            </span>

          </div>


          <button
            onClick={() =>
              document
                .getElementById(
                  "watchlist-stocks"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth",
                })
            }
            className="h-[31px] bg-white text-black px-4 rounded-[3px] text-[12px] font-medium hover:bg-[#e8e8e8] transition"
          >

            <span className="text-[16px] mr-2">
              +
            </span>

            Add Stock

          </button>

        </div>

      </div>


      {/* =====================================================
          STOCK LIST
      ===================================================== */}

      <div
        id="watchlist-stocks"
        className="mt-[30px]"
      >


        {watchlist.length !== 0 && (

          <div className="rounded-[8px] border border-[#25252b] bg-[#101014] overflow-hidden">


            {/* TABLE HEADER */}

            <div className="firacode grid grid-cols-[55px_minmax(240px,1.7fr)_180px_150px_280px_155px] h-[38px] items-center px-5 border-b border-[#25252b] bg-[#ffffff0a] text-[10px] tracking-[1.5px] text-[white]/80">

              <span>
                #
              </span>

              <span>
                STOCK
              </span>

              <span>
                PRICE
              </span>

              <span>
                CHANGE (TODAY)
              </span>

              <span>
                CHART (TODAY)
              </span>

              <span>
                ACTION
              </span>

            </div>


            {/* LOADING */}

            {loading && (

              <div className="h-[80px] flex items-center justify-center text-[12px] text-[#666]">

                <Loader2
                  size={14}
                  className="animate-spin mr-2"
                />

                Loading watchlist...

              </div>

            )}


            {/* STOCKS */}

            {!loading &&
              watchlist.map(
                (
                  stock,
                  index
                ) => {

                  /*
                  |--------------------------------------------------------------------------
                  | MARKET DATA
                  |--------------------------------------------------------------------------
                  */

                  const market =
                    getMarketData(
                      stock.instrumentKey
                    );


                  const change =
                    market?.changePercent ??
                    market?.change ??
                    null;


                  const isPositive =
                    change === null ||
                    change >= 0;


                  const isRemoving =
                    removingStock ===
                    stock.instrumentKey;


                  return (

                    <div
                      key={
                        stock.instrumentKey ||
                        stock.symbol
                      }
                      onClick={() =>
                        openStock(
                          stock.symbol
                        )
                      }
                      className="stock-table-row grid grid-cols-[55px_minmax(240px,1.7fr)_180px_150px_280px_155px] items-center px-5 py-[10px] border-b border-[#202027] last:border-b-0 hover:bg-[#151519] transition cursor-pointer group"
                    >


                      {/* NUMBER */}

                      <span className="firacode text-[12px] text-[#77777f]">

                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}

                      </span>


                      {/* STOCK */}

                      <div className="flex items-center gap-3">


                        {/* AVATAR */}

                        <div className="rounded-[2px] w-[30px] h-[30px] border bg-[white]/3 border-[#303038] flex items-center justify-center text-[10px] text-[white]/90 shrink-0">

                          {(
                            stock.symbol ??
                            ""
                          )
                            .slice(
                              0,
                              2
                            )
                            .toUpperCase()}

                        </div>


                        <div className="min-w-0">

                          <div className="text-[14px] text-white font-medium">

                            {
                              stock.symbol
                            }

                          </div>


                          <div className="text-[13px] text-[#717179] truncate max-w-[300px]">

                            {
                              stock.name
                            }

                          </div>

                        </div>

                      </div>


                      {/* PRICE */}

                      <span className="firacode text-[14px] text-[white]">

                        {formatPrice(
                          market?.price
                        )}

                      </span>


                      {/* CHANGE */}

                      <span
                        className={`firacode inline-flex w-fit font-[600] px-2 py-[1px] text-[11px] ${
                          isPositive
                            ? "bg-white text-black"
                            : "border border-[#303038] text-[#a0a0a7]"
                        }`}
                      >

                        {formatChange(
                          change
                        )}

                      </span>


                      {/* CHART */}

                      <div className="flex items-center">

                        <Sparkline
                          points={
                            market?.chart ??
                            []
                          }
                          negative={
                            !isPositive
                          }
                        />

                      </div>


                      {/* ACTIONS */}

                      <div
                        className="flex items-center gap-2"
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >


                        {/* CHAT */}

                        <button
                          onClick={() =>
                            openStock(
                              stock.symbol
                            )
                          }
                          className="
                            h-[27px]
                            px-3
                            flex
                            items-center
                            justify-center
                            gap-1.5
                            bg-gradient-to-r
                            from-[#8b3dff]
                            to-[#713cff]
                            border
                            border-[#a968ff]
                            rounded-[3px]
                            text-white
                            text-[11px]
                            font-medium
                            shadow-[0_0_10px_rgba(132,60,255,0.45)]
                            hover:brightness-110
                            hover:shadow-[0_0_14px_rgba(132,60,255,0.65)]
                            transition-all
                            duration-150
                          "
                        >

                          <Sparkles
                            size={11}
                            strokeWidth={2}
                            className="text-[#e2c9ff]"
                          />

                          <span>
                            Chat
                          </span>

                        </button>


                        {/* REMOVE */}

                        <button
                          onClick={() =>
                            removeFromWatchlist(
                              stock
                            )
                          }
                          disabled={
                            isRemoving
                          }
                          className="
                            w-[80px]
                            h-[27px]
                            px-2
                            overflow-hidden
                            border
                            border-[#2c2c34]
                            bg-[white]/4
                            text-[#c0c0c6]
                            text-[11px]
                            hover:bg-[white]/8
                            hover:text-white
                            transition
                            disabled:opacity-70
                            disabled:cursor-default
                          "
                        >

                          {isRemoving ? (

                            <>

                              <Loader2
                                size={11}
                                className="inline mr-1 animate-spin"
                              />

                              {/* Removing */}

                            </>

                          ) : (

                            "Remove"

                          )}

                        </button>


                        {/* ARROW */}

                        <ChevronRight
                          size={14}
                          className="text-[#62626a] group-hover:text-white transition"
                        />

                      </div>

                    </div>

                  );

                }
              )}

          </div>

        )}


        {/* EMPTY STATE */}

        {/* {!loading &&
          watchlist.length === 0 && (

            <div className="h-[120px] flex items-center justify-center text-[12px] text-[#666]">

              Your watchlist is empty.

            </div>

          )} */}

      </div>

    </section>

  );

}