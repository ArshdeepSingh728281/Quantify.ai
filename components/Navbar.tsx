"use client";

import {
  Search,
  ChevronDown,
  BarChart3,
  Check,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  useSession,
  signIn,
  signOut,
} from "next-auth/react";

type TradingType =
  | "Day"
  | "Swing"
  | "Long-term";

type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

type SearchStock = {
  symbol: string;
  shortName: string;
  name: string;
  instrumentKey: string;
  price: number | null;
  exchange?: string;
  segment?: string;
  instrumentType?: string;
  quoteKey?: string;
  previousClose?: number | null;
  buyPrice?: number | null;
  sellPrice?: number | null;
  volume?: number | null;
  quoteFound?: boolean;
};

const TRADING_STORAGE_KEY =
  "quantify_trading_type";

const RISK_STORAGE_KEY =
  "quantify_risk_level";

const DEFAULT_TRADING_TYPE: TradingType =
  "Long-term";

const DEFAULT_RISK_LEVEL: RiskLevel =
  "Low";

const isValidTradingType = (
  value: unknown
): value is TradingType => {
  return (
    value === "Day" ||
    value === "Swing" ||
    value === "Long-term"
  );
};

const isValidRiskLevel = (
  value: unknown
): value is RiskLevel => {
  return (
    value === "Low" ||
    value === "Medium" ||
    value === "High"
  );
};

export default function Navbar() {
  const router = useRouter();

  const {
    data: session,
  } = useSession();

  /* =========================================================
     SEARCH
  ========================================================= */

  const [search, setSearch] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchResults, setSearchResults] =
    useState<SearchStock[]>([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const searchRef =
    useRef<HTMLDivElement>(null);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  /* =========================================================
     TRADING
  ========================================================= */

  const [tradingType, setTradingType] =
    useState<TradingType>(
      DEFAULT_TRADING_TYPE
    );

  const [tradingOpen, setTradingOpen] =
    useState(false);

  const tradingRef =
    useRef<HTMLDivElement>(null);

  /* =========================================================
     RISK
  ========================================================= */

  const [riskLevel, setRiskLevel] =
    useState<RiskLevel>(
      DEFAULT_RISK_LEVEL
    );

  const [riskOpen, setRiskOpen] =
    useState(false);

  const riskRef =
    useRef<HTMLDivElement>(null);

  /* =========================================================
     PROFILE
  ========================================================= */

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef =
    useRef<HTMLDivElement>(null);

  const settingsLoaded =
    useRef(false);

  /* =========================================================
     LOAD LOCAL SETTINGS
  ========================================================= */

  useEffect(() => {
    try {
      const storedTrading =
        localStorage.getItem(
          TRADING_STORAGE_KEY
        );

      const storedRisk =
        localStorage.getItem(
          RISK_STORAGE_KEY
        );

      if (
        isValidTradingType(
          storedTrading
        )
      ) {
        setTradingType(
          storedTrading
        );
      } else {
        localStorage.setItem(
          TRADING_STORAGE_KEY,
          DEFAULT_TRADING_TYPE
        );

        setTradingType(
          DEFAULT_TRADING_TYPE
        );
      }

      if (
        isValidRiskLevel(
          storedRisk
        )
      ) {
        setRiskLevel(
          storedRisk
        );
      } else {
        localStorage.setItem(
          RISK_STORAGE_KEY,
          DEFAULT_RISK_LEVEL
        );

        setRiskLevel(
          DEFAULT_RISK_LEVEL
        );
      }
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );

      setTradingType(
        DEFAULT_TRADING_TYPE
      );

      setRiskLevel(
        DEFAULT_RISK_LEVEL
      );
    }
  }, []);

  /* =========================================================
     DATABASE SETTINGS SYNC
  ========================================================= */

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    const syncSettings =
      async () => {
        try {
          const response =
            await fetch(
              "/api/preferences",
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (
            cancelled ||
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          if (cancelled) {
            return;
          }

          const databaseTrading =
            isValidTradingType(
              data?.tradingType
            )
              ? data.tradingType
              : null;

          const databaseRisk =
            isValidRiskLevel(
              data?.riskLevel
            )
              ? data.riskLevel
              : null;

          if (
            !databaseTrading ||
            !databaseRisk
          ) {
            let localTrading =
              DEFAULT_TRADING_TYPE;

            let localRisk =
              DEFAULT_RISK_LEVEL;

            try {
              const storedTrading =
                localStorage.getItem(
                  TRADING_STORAGE_KEY
                );

              const storedRisk =
                localStorage.getItem(
                  RISK_STORAGE_KEY
                );

              if (
                isValidTradingType(
                  storedTrading
                )
              ) {
                localTrading =
                  storedTrading;
              }

              if (
                isValidRiskLevel(
                  storedRisk
                )
              ) {
                localRisk =
                  storedRisk;
              }
            } catch {}

            setTradingType(
              localTrading
            );

            setRiskLevel(
              localRisk
            );

            localStorage.setItem(
              TRADING_STORAGE_KEY,
              localTrading
            );

            localStorage.setItem(
              RISK_STORAGE_KEY,
              localRisk
            );

            await fetch(
              "/api/preferences",
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  tradingType:
                    localTrading,
                  riskLevel:
                    localRisk,
                }),
              }
            );

            return;
          }

          setTradingType(
            databaseTrading
          );

          setRiskLevel(
            databaseRisk
          );

          localStorage.setItem(
            TRADING_STORAGE_KEY,
            databaseTrading
          );

          localStorage.setItem(
            RISK_STORAGE_KEY,
            databaseRisk
          );

          settingsLoaded.current =
            true;
        } catch (error) {
          if (!cancelled) {
            console.error(
              "Failed to sync preferences:",
              error
            );
          }
        }
      };

    syncSettings();

    return () => {
      cancelled = true;
    };
  }, [session]);

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveSettings = async (
    newTradingType: TradingType,
    newRiskLevel: RiskLevel
  ) => {
    try {
      localStorage.setItem(
        TRADING_STORAGE_KEY,
        newTradingType
      );

      localStorage.setItem(
        RISK_STORAGE_KEY,
        newRiskLevel
      );
    } catch {}

    if (!session) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/preferences",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              tradingType:
                newTradingType,
              riskLevel:
                newRiskLevel,
            }),
          }
        );

      if (!response.ok) {
        console.error(
          "Failed to save preferences."
        );
      }
    } catch (error) {
      console.error(
        "Preferences save error:",
        error
      );
    }
  };

  /* =========================================================
     SEARCH API
  ========================================================= */

  useEffect(() => {
    const query =
      search.trim();

    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer =
      setTimeout(
        async () => {
          try {
            setSearchLoading(true);

            const response =
              await fetch(
                `/api/upstox/search?q=${encodeURIComponent(
                  query
                )}`,
                {
                  method: "GET",
                  cache: "no-store",
                }
              );

            const data =
              await response.json();

            if (cancelled) {
              return;
            }

            if (!response.ok) {
              throw new Error(
                data?.error ||
                  "Search failed."
              );
            }

            setSearchResults(
              Array.isArray(
                data?.stocks
              )
                ? data.stocks
                : []
            );
          } catch (error) {
            if (!cancelled) {
              console.error(
                "Navbar search error:",
                error
              );

              setSearchResults([]);
            }
          } finally {
            if (!cancelled) {
              setSearchLoading(false);
            }
          }
        },
        250
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  /* =========================================================
     CLOSE DROPDOWNS
  ========================================================= */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        searchRef.current &&
        !searchRef.current.contains(
          target
        )
      ) {
        setSearchOpen(false);
      }

      if (
        tradingRef.current &&
        !tradingRef.current.contains(
          target
        )
      ) {
        setTradingOpen(false);
      }

      if (
        riskRef.current &&
        !riskRef.current.contains(
          target
        )
      ) {
        setRiskOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          target
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================================================
     KEYBOARD SEARCH
  ========================================================= */

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent
    ) {
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        searchInputRef.current?.focus();

        setSearchOpen(true);
      }

      if (
        event.key === "Escape"
      ) {
        setSearchOpen(false);

        searchInputRef.current?.blur();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, []);

  /* =========================================================
     OPEN STOCK

     IMPORTANT:
     We now pass BOTH:
       symbol
       instrumentKey

     This is the actual fix.
  ========================================================= */

  // function openStock(
  //   stock: SearchStock
  // ) {
  //   setSearchOpen(false);
  //   setSearch("");
  //   setSearchResults([]);

  //   const symbol =
  //     stock.symbol?.trim();

  //   const instrumentKey =
  //     stock.instrumentKey?.trim();

  //   if (!symbol) {
  //     return;
  //   }

  //   /*
  //    * Keep the exact instrument selected
  //    * from search.
  //    */

  //   const query =
  //     instrumentKey
  //       ? `?instrumentKey=${encodeURIComponent(
  //           instrumentKey
  //         )}`
  //       : "";

  //   const destination =
  //     `/stock/${encodeURIComponent(
  //       symbol
  //     )}${query}`;

  //   if (!session) {
  //     signIn("google", {
  //       callbackUrl:
  //         destination,
  //     });

  //     return;
  //   }

  //   router.push(
  //     destination
  //   );
  // }


  function openStock(stock: SearchStock) {
  const symbol = stock.symbol?.trim();
  const instrumentKey = stock.instrumentKey?.trim();

  if (!symbol) return;

  // Match the route structure used by WatchlistHeader.
  const chatId = crypto.randomUUID();

  const params = new URLSearchParams();

  if (instrumentKey) {
    params.set("instrumentKey", instrumentKey);
  }

  const query = params.toString();
  const destination = `/stock/${encodeURIComponent(symbol)}/${chatId}${
    query ? `?${query}` : ""
  }`;

  setSearchOpen(false);
  setSearch("");
  setSearchResults([]);

  if (!session) {
    signIn("google", {
      callbackUrl: destination,
    });
    return;
  }

  router.push(destination);
}

  /* =========================================================
     ENTER SEARCH
  ========================================================= */

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      searchResults.length === 0
    ) {
      return;
    }

    openStock(
      searchResults[0]
    );
  }

  /* =========================================================
     OPTIONS
  ========================================================= */

  const tradingOptions:
    TradingType[] = [
      "Day",
      "Swing",
      "Long-term",
    ];

  const riskOptions:
    RiskLevel[] = [
      "Low",
      "Medium",
      "High",
    ];

  const riskStyles = {
    Low: {
      text: "#35d49a",
      border: "#17684e",
      background: "#0d1b17",
      dot: "#35d49a",
    },

    Medium: {
      text: "#d7a800",
      border: "#715500",
      background: "#171309",
      dot: "#d9a800",
    },

    High: {
      text: "#ff5c67",
      border: "#762b31",
      background: "#1b0e10",
      dot: "#ff4d5a",
    },
  };

  const currentRisk =
    riskStyles[riskLevel];

  return (
    <header className="quantify-navbar">

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="flex items-center gap-3 shrink-0">

        <div className="w-[32px] h-[32px] rounded-[3px] bg-white flex items-center justify-center">

          <BarChart3
            className="text-black"
            size={20}
          />

        </div>

        <div>

          <div className="text-white font-semibold text-[22px] leading-none mt-[4px]">

            Quantify

            <span className="text-[#aaa]">
              .ai
            </span>

          </div>

          <div className="firacode text-[10px] tracking-[1.5px] text-[#7d7d85] mt-[3px]">
            SIMPLIFIES QUANT FOR EVERYBODY
          </div>

        </div>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        ref={searchRef}
        className="flex-1 flex justify-center relative"
      >

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="w-[70%]"
        >

          <div
            className={`
              h-[40px]
              bg-[#101014]
              border
              rounded-[4px]
              flex
              items-center
              px-3
              transition
              ${
                searchOpen
                  ? "border-[#7134c8]"
                  : "border-[#25252c]"
              }
            `}
          >

            <Search
              size={20}
              className="text-[#777] shrink-0"
            />

            <input
              ref={
                searchInputRef
              }
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

                setSearchOpen(true);
              }}
              onFocus={() => {
                setSearchOpen(true);
              }}
              placeholder="Search for a stock or index..."
              className="
                flex-1
                bg-transparent
                outline-none
                border-none
                text-[15px]
                text-white
                placeholder:text-[#5f6068]
                ml-3
              "
            />

            <button
              type="button"
              onClick={() => {
                searchInputRef.current?.focus();
                setSearchOpen(true);
              }}
              className="ml-auto text-[10px] text-[#777] border border-[#2a2a31] rounded px-1.5 py-0.5"
            >
              ⌘K
            </button>

          </div>

        </form>

        {/* ===================================================
            SEARCH RESULTS
        =================================================== */}

        {searchOpen &&
          search.trim() && (

          <div className="absolute top-[35px] w-[500px] bg-[#111115] border border-[#29292f] rounded-[4px] shadow-[0_15px_40px_rgba(0,0,0,0.65)] overflow-hidden z-[200]">

            {searchLoading ? (

              <div className="px-4 py-6 text-center">
                <div className="text-[11px] text-[#aaa]">
                  Searching...
                </div>
              </div>

            ) : searchResults.length > 0 ? (

              <>

                <div className="px-3 py-2 border-b border-[#24242a] text-[9px] uppercase tracking-[1.2px] text-[#66666e]">
                  Stocks & Indices
                </div>

                {searchResults.map(
                  (stock) => (

                  <button
                    key={
                      stock.instrumentKey ||
                      `${stock.symbol}-${stock.name}`
                    }
                    type="button"
                    onClick={() =>
                      openStock(
                        stock
                      )
                    }
                    className="
                      w-full
                      h-[50px]
                      px-4
                      flex
                      items-center
                      gap-3
                      text-left
                      hover:bg-[#1a1a20]
                      transition
                    "
                  >

                    <div className="rounded-[2px] bg-white/4 w-[28px] h-[28px] border border-[#303038] flex items-center justify-center text-[8px] text-[#aaa] shrink-0">

                      {stock.shortName
                        ?.slice(
                          0,
                          2
                        )
                        .toUpperCase()}

                    </div>

                    <div className="min-w-0">

                      <div className="text-[13px] text-white font-medium">

                        {stock.symbol}

                      </div>

                      <div className="text-[10px] text-[#717179] truncate">

                        {stock.name}

                      </div>

                    </div>

                    <div className="firscode ml-auto text-[12px] text-[#aaa] font-mono">

                      {stock.price !==
                      null
                        ? `₹${stock.price.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits:
                                2,
                              maximumFractionDigits:
                                2,
                            }
                          )}`
                        : "--"}

                    </div>

                  </button>

                ))}

              </>

            ) : (

              <div className="px-4 py-6 text-center">

                <div className="text-[11px] text-[#aaa]">
                  No stocks found
                </div>

                <div className="text-[9px] text-[#555] mt-1">
                  Try a symbol or company name
                </div>

              </div>

            )}

          </div>

        )}

      </div>

      {/* =====================================================
          RIGHT CONTROLS
      ===================================================== */}

      <div className="flex items-center gap-3 shrink-0">

        {/* TRADING */}

        <div
          ref={tradingRef}
          className="relative"
        >

          <button
            onClick={() => {
              setTradingOpen(
                previous =>
                  !previous
              );

              setRiskOpen(false);
              setProfileOpen(false);
            }}
            className="
              px-3
              border
              border-[#7134c8]/40
              rounded-[4px]
              text-[14px]
              text-white/65
              bg-[#120b1d]
              flex
              items-center
              gap-2
              py-[4px]
              hover:bg-[#191020]
              transition
            "
          >

            <span>
              Trading:
            </span>

            <span className="text-white">
              {tradingType}
            </span>

            <ChevronDown
              size={12}
              className={`transition-transform ${
                tradingOpen
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>

          {tradingOpen && (

            <div className="absolute right-0 top-[36px] z-[100] w-[145px] bg-[#111115] border border-[#30233d] rounded-[4px] shadow-[0_12px_30px_rgba(0,0,0,0.55)] overflow-hidden">

              <div className="px-3 py-2 text-[9px] uppercase tracking-[1.2px] text-[#66666e] border-b border-[#24242a]">
                Trading Type
              </div>

              {tradingOptions.map(
                option => (

                <button
                  key={option}
                  onClick={() => {
                    setTradingType(
                      option
                    );

                    setTradingOpen(
                      false
                    );

                    saveSettings(
                      option,
                      riskLevel
                    );
                  }}
                  className="w-full h-[34px] px-3 flex items-center justify-between text-left text-[13px] text-[#c7c7cd] hover:bg-[#1b1521] transition"
                >

                  <span>
                    {option}
                  </span>

                  {tradingType ===
                    option && (
                    <Check
                      size={13}
                      className="text-[#a967ff]"
                    />
                  )}

                </button>

              ))}

            </div>

          )}

        </div>

        {/* RISK */}

        <div
          ref={riskRef}
          className="relative"
        >

          <button
            onClick={() => {
              setRiskOpen(
                previous =>
                  !previous
              );

              setTradingOpen(false);
              setProfileOpen(false);
            }}
            style={{
              color:
                currentRisk.text,
              borderColor:
                currentRisk.border,
              backgroundColor:
                currentRisk.background,
            }}
            className="px-3 py-[6px] rounded-[4px] text-[11px] flex items-center gap-2 transition"
          >

            <span
              style={{
                color:
                  currentRisk.dot,
              }}
              className="text-[10px]"
            >
              ●
            </span>

            <span className="text-[14px] px-[3px]">
              Risk: {riskLevel}
            </span>

            <ChevronDown
              size={12}
              className={`transition-transform ${
                riskOpen
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>

          {riskOpen && (

            <div className="absolute right-0 top-[36px] z-[100] w-[150px] bg-[#111115] border border-[#29292f] rounded-[4px] shadow-[0_12px_30px_rgba(0,0,0,0.55)] overflow-hidden">

              <div className="px-3 py-2 text-[9px] uppercase tracking-[1.2px] text-[#66666e] border-b border-[#24242a]">
                Risk Level
              </div>

              {riskOptions.map(
                option => {

                  const style =
                    riskStyles[
                      option
                    ];

                  return (
                    <button
                      key={option}
                      onClick={() => {
                        setRiskLevel(
                          option
                        );

                        setRiskOpen(
                          false
                        );

                        saveSettings(
                          tradingType,
                          option
                        );
                      }}
                      className="w-full h-[34px] px-3 flex items-center justify-between hover:bg-[#1a1a1f] transition"
                    >

                      <span className="flex items-center gap-2">

                        <span
                          style={{
                            color:
                              style.dot,
                          }}
                          className="text-[9px]"
                        >
                          ●
                        </span>

                        <span
                          style={{
                            color:
                              style.text,
                          }}
                          className="text-[13px]"
                        >
                          {option}
                        </span>

                      </span>

                      {riskLevel ===
                        option && (
                        <Check
                          size={13}
                          style={{
                            color:
                              style.text,
                          }}
                        />
                      )}

                    </button>
                  );
                }
              )}

            </div>

          )}

        </div>

        <div className="h-[20px] w-[1px] bg-white/10 ml-[5px] mr-[5px]" />

        {/* PROFILE */}

        {session ? (

          <div
            ref={profileRef}
            className="relative"
          >

            <button
              onClick={() => {
                setProfileOpen(
                  previous =>
                    !previous
                );

                setTradingOpen(false);
                setRiskOpen(false);
              }}
              className="px-2 bg-white/5 py-[5px] border border-[#29292f] rounded-[4px] flex items-center gap-2 text-[13px] text-[#bbb] hover:bg-[#111115] transition"
            >

              <span className="w-6 h-6 bg-white text-black rounded-[3px] flex items-center justify-center font-semibold">
                {session.user?.name?.charAt(
                  0
                ) || "A"}
              </span>

              {session.user?.name?.split(
                " "
              )[0] || "USER"}

              <ChevronDown
                size={12}
                className={`transition-transform ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {profileOpen && (

              <div className="absolute right-0 top-[36px] z-[100] w-[180px] bg-[#111115] border border-[#29292f] rounded-[4px] shadow-[0_12px_30px_rgba(0,0,0,0.55)] overflow-hidden">

                <div className="px-3 py-3 border-b border-[#24242a]">

                  <div className="text-[13px] text-white">
                    {session.user?.name}
                  </div>

                  <div className="text-[10px] text-[#66666e] mt-1 truncate">
                    {session.user?.email}
                  </div>

                </div>

                <button
                  onClick={() =>
                    signOut()
                  }
                  className="w-full h-[36px] px-3 text-left text-[11px] text-[#aaa] hover:bg-[#1a1a1f] hover:text-white transition"
                >
                  Sign out
                </button>

              </div>

            )}

          </div>

        ) : (

          <button
            onClick={() =>
              signIn("google")
            }
            className="py-[6px] px-4 border border-[#29292f] rounded-[4px] text-[13px] text-[#bbb] hover:bg-[#111115] transition"
          >
            SIGN IN
          </button>

        )}

      </div>

    </header>
  );
}