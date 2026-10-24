

"use client";

import {
  ChevronRight,
  Sparkles,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  signIn,
  useSession,
} from "next-auth/react";

import Sparkline from "./Sparkline";

type Stock = {
  rank: number;
  symbol: string;
  shortName: string;
  name: string;
  instrumentKey: string;

  price: number | null;
  change: number | null;
  changePercent: number | null;

  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;

  volume: number | null;
  averagePrice?: number | null;

  chart: number[];
};

type WatchlistItem = {
  symbol: string;
  name?: string;
  instrumentKey?: string;
};

const WATCHLIST_STORAGE_KEY =
  "quantify_watchlist";

/*
|--------------------------------------------------------------------------
| NORMALIZE WATCHLIST
|--------------------------------------------------------------------------
*/

const normalizeWatchlist = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => {
          if (
            typeof item === "string"
          ) {
            return item;
          }

          if (
            item &&
            typeof item === "object" &&
            "symbol" in item &&
            typeof (
              item as WatchlistItem
            ).symbol === "string"
          ) {
            return (
              item as WatchlistItem
            ).symbol;
          }

          return null;
        })
        .filter(
          (
            symbol
          ): symbol is string =>
            typeof symbol === "string" &&
            symbol.length > 0
        )
    )
  );
};

/*
|--------------------------------------------------------------------------
| NOTIFY OTHER COMPONENTS
|--------------------------------------------------------------------------
*/

const notifyWatchlistChanged = (
  symbols: string[]
) => {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  const normalized =
    normalizeWatchlist(symbols);

  window.dispatchEvent(
    new CustomEvent(
      "watchlist-changed",
      {
        detail: normalized,
      }
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      "watchlist-updated",
      {
        detail: normalized,
      }
    )
  );
};

/*
|--------------------------------------------------------------------------
| SAVE LOCAL WATCHLIST
|--------------------------------------------------------------------------
*/

const saveLocalWatchlist = (
  symbols: string[]
) => {
  const normalized =
    normalizeWatchlist(symbols);

  try {
    localStorage.setItem(
      WATCHLIST_STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch (error) {
    console.error(
      "Failed to save local watchlist:",
      error
    );
  }
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function StockTable() {
  const router = useRouter();

  const {
    data: session,
    status,
  } = useSession();

  const [stocks, setStocks] =
    useState<Stock[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [watchlist, setWatchlist] =
    useState<string[]>([]);

  const [addingStock, setAddingStock] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | WATCHLIST VERSION
  |--------------------------------------------------------------------------
  |
  | Every add/remove operation changes this.
  | Older API responses cannot overwrite newer
  | user actions.
  |
  |--------------------------------------------------------------------------
  */

  const watchlistVersion =
    useRef(0);

  /*
  |--------------------------------------------------------------------------
  | LOAD LOCAL WATCHLIST
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          WATCHLIST_STORAGE_KEY
        );

      if (!stored) {
        setWatchlist([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      const normalized =
        normalizeWatchlist(parsed);

      setWatchlist(normalized);

      /*
      * Clean localStorage.
      */

      localStorage.setItem(
        WATCHLIST_STORAGE_KEY,
        JSON.stringify(normalized)
      );
    } catch (error) {
      console.error(
        "Failed to load watchlist:",
        error
      );

      setWatchlist([]);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SYNC WITH MONGODB
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      status !== "authenticated"
    ) {
      return;
    }

    const syncWatchlist =
      async () => {
        const requestVersion =
          watchlistVersion.current;

        try {
          const response =
            await fetch(
              "/api/watchlist",
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (!response.ok) {
            console.error(
              "Failed to sync watchlist:",
              response.status
            );

            return;
          }

          const data =
            await response.json();

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | If the user has already clicked Add,
          | this old GET response must NOT overwrite
          | the new local state.
          |
          |--------------------------------------------------------------------------
          */

          if (
            requestVersion !==
            watchlistVersion.current
          ) {
            return;
          }

          const serverWatchlist =
            normalizeWatchlist(
              data?.watchlist
            );

          setWatchlist(
            serverWatchlist
          );

          saveLocalWatchlist(
            serverWatchlist
          );

          notifyWatchlistChanged(
            serverWatchlist
          );
        } catch (error) {
          console.error(
            "Failed to sync watchlist:",
            error
          );
        }
      };

    syncWatchlist();
  }, [status]);

  /*
  |--------------------------------------------------------------------------
  | LISTEN FOR WATCHLIST CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleWatchlistChanged =
      (event: Event) => {
        const customEvent =
          event as CustomEvent;

        if (
          Array.isArray(
            customEvent.detail
          )
        ) {
          const normalized =
            normalizeWatchlist(
              customEvent.detail
            );

          /*
          * Do not increment version here.
          * This event can come from our own add.
          */

          setWatchlist(
            normalized
          );

          return;
        }

        /*
        * Fallback to localStorage.
        */

        try {
          const stored =
            localStorage.getItem(
              WATCHLIST_STORAGE_KEY
            );

          const parsed =
            stored
              ? JSON.parse(stored)
              : [];

          const normalized =
            normalizeWatchlist(
              parsed
            );

          setWatchlist(
            normalized
          );
        } catch {
          setWatchlist([]);
        }
      };

    window.addEventListener(
      "watchlist-changed",
      handleWatchlistChanged
    );

    window.addEventListener(
      "watchlist-updated",
      handleWatchlistChanged
    );

    /*
    |--------------------------------------------------------------------------
    | STORAGE EVENT
    |--------------------------------------------------------------------------
    */

    const handleStorage =
      (event: StorageEvent) => {
        if (
          event.key !==
          WATCHLIST_STORAGE_KEY
        ) {
          return;
        }

        try {
          const parsed =
            event.newValue
              ? JSON.parse(
                  event.newValue
                )
              : [];

          const normalized =
            normalizeWatchlist(
              parsed
            );

          setWatchlist(
            normalized
          );
        } catch {
          setWatchlist([]);
        }
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "watchlist-changed",
        handleWatchlistChanged
      );

      window.removeEventListener(
        "watchlist-updated",
        handleWatchlistChanged
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | OPEN STOCK
  |--------------------------------------------------------------------------
  */

  // const openStock = (
  //   symbol: string
  // ) => {
  //   if (!session) {
  //     signIn("google", {
  //       callbackUrl:
  //         `/stock/${encodeURIComponent(
  //           symbol
  //         )}`,
  //     });

  //     return;
  //   }

  //   router.push(
  //     `/stock/${encodeURIComponent(
  //       symbol
  //     )}`
  //   );
  // };


  const openStock = (symbol: string) => {
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
  | ADD TO WATCHLIST
  |--------------------------------------------------------------------------
  */

  const addToWatchlist = async (
    stock: Stock
  ) => {
    if (!session) {
      signIn("google", {
        callbackUrl:
          window.location.pathname,
      });

      return;
    }

    /*
    * Prevent double click while request
    * for this stock is running.
    */

    if (
      addingStock ===
      stock.symbol
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | READ THE ABSOLUTE LATEST LOCAL STATE
    |--------------------------------------------------------------------------
    */

    let currentWatchlist: string[] =
      [];

    try {
      const stored =
        localStorage.getItem(
          WATCHLIST_STORAGE_KEY
        );

      currentWatchlist =
        stored
          ? normalizeWatchlist(
              JSON.parse(stored)
            )
          : normalizeWatchlist(
              watchlist
            );
    } catch {
      currentWatchlist =
        normalizeWatchlist(
          watchlist
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ALREADY ADDED
    |--------------------------------------------------------------------------
    */

    if (
      currentWatchlist.includes(
        stock.symbol
      )
    ) {
      setWatchlist(
        currentWatchlist
      );

      notifyWatchlistChanged(
        currentWatchlist
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE NEW VERSION
    |--------------------------------------------------------------------------
    */

    const operationVersion =
      ++watchlistVersion.current;

    /*
    |--------------------------------------------------------------------------
    | SAVE PREVIOUS STATE
    |--------------------------------------------------------------------------
    */

    const previousWatchlist =
      [...currentWatchlist];

    /*
    |--------------------------------------------------------------------------
    | CREATE NEW WATCHLIST
    |--------------------------------------------------------------------------
    */

    const updatedWatchlist =
      Array.from(
        new Set([
          ...currentWatchlist,
          stock.symbol,
        ])
      );

    /*
    |--------------------------------------------------------------------------
    | OPTIMISTIC UI UPDATE
    |--------------------------------------------------------------------------
    |
    | THIS HAPPENS BEFORE FETCH.
    |
    | Therefore the button immediately becomes:
    |
    | Added
    |
    |--------------------------------------------------------------------------
    */

    setAddingStock(
      stock.symbol
    );

    setWatchlist(
      updatedWatchlist
    );

    saveLocalWatchlist(
      updatedWatchlist
    );

    notifyWatchlistChanged(
      updatedWatchlist
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE TO MONGODB
    |--------------------------------------------------------------------------
    */

    try {
      const response =
        await fetch(
          "/api/watchlist",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              stock: {
                symbol:
                  stock.symbol,

                name:
                  stock.name,

                instrumentKey:
                  stock.instrumentKey,
              },
            }),
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      /*
      |--------------------------------------------------------------------------
      | FAILED
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        /*
        * Only rollback if no newer
        * operation happened.
        */

        if (
          operationVersion ===
          watchlistVersion.current
        ) {
          setWatchlist(
            previousWatchlist
          );

          saveLocalWatchlist(
            previousWatchlist
          );

          notifyWatchlistChanged(
            previousWatchlist
          );
        }

        throw new Error(
          data?.error ||
            "Failed to save stock to watchlist."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      if (
        operationVersion ===
        watchlistVersion.current
      ) {
        /*
        * Read localStorage again.
        *
        * This prevents an old React render
        * from replacing the newly added stock.
        */

        let latest =
          updatedWatchlist;

        try {
          const stored =
            localStorage.getItem(
              WATCHLIST_STORAGE_KEY
            );

          if (stored) {
            latest =
              normalizeWatchlist(
                JSON.parse(stored)
              );
          }
        } catch {
          latest =
            updatedWatchlist;
        }

        /*
        * Make absolutely sure the
        * newly added stock exists.
        */

        if (
          !latest.includes(
            stock.symbol
          )
        ) {
          latest =
            Array.from(
              new Set([
                ...latest,
                stock.symbol,
              ])
            );

          saveLocalWatchlist(
            latest
          );
        }

        /*
        * React state remains Added.
        */

        setWatchlist(
          latest
        );

        /*
        * Sync WatchlistHeader.
        */

        notifyWatchlistChanged(
          latest
        );
      }

      console.log(
        "Stock added to watchlist:",
        data
      );
    } catch (error) {
      console.error(
        "Watchlist error:",
        error
      );
    } finally {
      /*
      * Stop loader.
      *
      * Do NOT remove the stock from
      * watchlist here.
      */

      setAddingStock(
        (current) =>
          current ===
          stock.symbol
            ? null
            : current
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH TOP 10 STOCKS
  |--------------------------------------------------------------------------
  */

  const fetchStocks = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await fetch(
          "/api/upstox/top-stocks",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to fetch market data."
        );
      }

      setStocks(
        data?.stocks || []
      );
    } catch (err) {
      console.error(
        "StockTable fetch error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch market data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchStocks();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REFRESH MARKET DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval =
      setInterval(
        () => {
          fetchStocks(true);
        },
        30_000
      );

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FORMAT PRICE
  |--------------------------------------------------------------------------
  */

  const formatPrice = (
    price: number | null
  ) => {
    if (
      price === null ||
      Number.isNaN(price)
    ) {
      return "—";
    }

    return `₹${price.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )}`;
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT CHANGE
  |--------------------------------------------------------------------------
  */

  const formatChange = (
    change: number | null
  ) => {
    if (
      change === null ||
      Number.isNaN(change)
    ) {
      return "—";
    }

    return `${
      change >= 0
        ? "+"
        : ""
    }${change.toFixed(2)}%`;
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section className="googlesans quantify-content stock-section pb-[30px]">

        <div className="flex items-end justify-between mb-3">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="googlesans text-[25px] font-semibold text-white">
                Top 10 Stocks
              </h2>

              <span className="text-[8px] bg-[white]/10 text-[white]/80 px-1">
                NSE / BSE
              </span>

            </div>

            <p className="text-[13px] text-[white]/60">
              Popular stocks to get you started.
              Click on a stock to analyze or add it
              to your watchlist.
            </p>

          </div>

        </div>

        <div className="rounded-[8px] border border-[#25252b] bg-[#101014] h-[420px] flex items-center justify-center">

          <div className="flex items-center gap-2 text-[#77777f] text-[11px]">

            <Loader2
              size={15}
              className="animate-spin text-[#a968ff]"
            />

            <span>
              Loading live market data...
            </span>

          </div>

        </div>

      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <section className="googlesans quantify-content stock-section pb-[30px]">

        <div className="flex items-end justify-between mb-3">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="googlesans text-[25px] font-semibold text-white">
                Top 10 Stocks
              </h2>

              <span className="text-[8px] bg-[white]/10 text-[white]/80 px-1">
                NSE / BSE
              </span>

            </div>

            <p className="text-[13px] text-[white]/60">
              Popular stocks to get you started.
              Click on a stock to analyze or add it
              to your watchlist.
            </p>

          </div>

        </div>

        <div className="rounded-[8px] border border-[#3a252b] bg-[#120e10] min-h-[180px] flex flex-col items-center justify-center">

          <div className="text-[12px] text-[#ff6974]">
            Unable to load market data
          </div>

          <div className="text-[10px] text-[#777] mt-2">
            {error}
          </div>

          <button
            onClick={() =>
              fetchStocks()
            }
            className="mt-4 h-[28px] px-4 border border-[#6335a2] text-[#b985ff] text-[10px] hover:bg-[#1a1124] transition"
          >
            Retry
          </button>

        </div>

      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN TABLE
  |--------------------------------------------------------------------------
  */

  return (
    <section className="googlesans quantify-content stock-section pb-[30px]">

      {/* TITLE */}

      <div className="flex items-end justify-between mb-3">

        <div>

          <div className="flex items-center gap-2">

            <h2 className="googlesans text-[25px] font-semibold text-white">
              Top 10 Stocks
            </h2>

            <span className="text-[8px] bg-[white]/10 text-[white]/80 px-1">
              NSE / BSE
            </span>

          </div>

          <p className="text-[13px] text-[white]/60">
            Popular stocks to get you started.
            Click on a stock to analyze or add it
            to your watchlist.
          </p>

        </div>

        {/* REFRESH */}

        <button
          onClick={() =>
            fetchStocks(true)
          }
          disabled={refreshing}
          className="w-[28px] h-[28px] flex items-center justify-center border border-[#29292f] text-[#777] hover:text-white hover:border-[#444] transition"
          title="Refresh market data"
        >

          <RefreshCw
            size={12}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

        </button>

      </div>

      {/* TABLE */}

      <div className="rounded-[8px] border border-[#25252b] bg-[#101014] overflow-hidden">

        {/* HEADER */}

        <div className="firacode grid grid-cols-[55px_minmax(240px,1.7fr)_180px_150px_280px_155px] h-[38px] items-center px-5 border-b border-[#25252b] rounded-[5px_5px_0px_0px] bg-[#ffffff0a] text-[10px] tracking-[1.5px] text-[white]/80">

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

        {/* ROWS */}

        {stocks.map(
          (stock) => {

            const change =
              stock.changePercent ??
              stock.change ??
              0;

            const isPositive =
              change >= 0;

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | This is now based ONLY on the
            | current React watchlist state.
            |
            |--------------------------------------------------------------------------
            */

            const isAdded =
              watchlist.includes(
                stock.symbol
              );

            const isAdding =
              addingStock ===
              stock.symbol;

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
                    stock.rank
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>

                {/* STOCK */}

                <div className="flex items-center gap-3">

                  <div className="rounded-[2px] w-[30px] h-[30px] border bg-[white]/3 border-[#303038] flex items-center justify-center text-[10px] text-[white]/90 shrink-0">

                    {(
                      stock.shortName ??
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
                    stock.price
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
                      stock.chart ||
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

                  {/* ADD */}

                  <button
                    onClick={() =>
                      addToWatchlist(
                        stock
                      )
                    }
                    disabled={
                      isAdding ||
                      isAdded
                    }
                    className="w-[74px] bg-[white]/4 h-[27px] px-3 overflow-hidden border border-[#2c2c34] text-[#c0c0c6] text-[11px] hover:bg-[white]/8 hover:text-white transition disabled:opacity-70 disabled:cursor-default"
                  >

                    {isAdding ? (
                      <Loader2
                        size={11}
                        className="inline mr-1 animate-spin"
                      />
                    ) : isAdded ? (
                      <></>
                    ) : (
                      <Plus
                        size={11}
                        className="inline mr-1"
                      />
                    )}

                    {isAdded
                      ? (
                        isAdding
                          ? ""
                          : "Added"
                      )
                      : "Add"}

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

    </section>
  );
}``