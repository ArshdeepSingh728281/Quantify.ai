"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Chat = {
  chatId: string;
  title: string;
  symbol: string;
  stockName: string;
  tradingMode: string;
  risk: string;
  createdAt?: string;
  updatedAt?: string;
};

type ChatSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;

  symbol: string;
  currentChatId: string;
};

function createChatId() {
  return crypto.randomUUID();
}

function formatChatTime(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const sameDay =
    date.toDateString() ===
    now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export default function ChatSidebar({
  collapsed,
  onToggle,
  symbol,
  currentChatId,
}: ChatSidebarProps) {
  const [
    chats,
    setChats,
  ] = useState<Chat[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const loadChats =
    useCallback(
      async () => {
        try {
            setLoading(true);

          const response =
            await fetch(
              "/api/chats",
              {
                method: "GET",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          const nextChats =
            Array.isArray(
              data?.chats
            )
              ? data.chats
              : [];

          setChats(
            nextChats
          );
        } catch (error) {
          console.error(
            "Load chats error:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /*
   * Refresh sidebar when AIAnalyst
   * successfully creates/updates a chat.
   */
  useEffect(() => {
    function handleChatUpdated() {
      loadChats();
    }

    window.addEventListener(
      "chat-updated",
      handleChatUpdated
    );

    return () => {
      window.removeEventListener(
        "chat-updated",
        handleChatUpdated
      );
    };
  }, [loadChats]);

  function createNewChat() {
    const newChatId =
      createChatId();

    window.location.href =
      `/stock/${encodeURIComponent(
        symbol
      )}/${newChatId}`;
  }

function openChat(
  chatId: string,
  chatSymbol: string
) {
  window.location.href =
    `/stock/${encodeURIComponent(
      chatSymbol
    )}/${chatId}`;
}

  return (
    <aside
      className={`
        relative
        hidden
        shrink-0
        border-r
        border-[#202027]
        bg-[#0e0e13]
        transition-[width]
        duration-200
        md:block
        ${
          collapsed
            ? "w-[58px]"
            : "w-[280px]"
        }
      `}
    >
      {/* COLLAPSE */}

      <button
        onClick={onToggle}
        aria-label={
          collapsed
            ? "Expand chat history"
            : "Collapse chat history"
        }
        className="
          absolute
          -right-[12px]
          top-[18px]
          z-30
          flex
          h-[26px]
          w-[26px]
          items-center
          justify-center
          rounded-[4px]
          border
          border-[#292932]
          bg-[#15151b]
          text-[#858894]
          shadow-[0_4px_15px_rgba(0,0,0,0.35)]
          transition
          hover:bg-[#1c1c24]
          hover:text-white
        "
      >
        {collapsed ? (
          <ChevronRight
            size={14}
          />
        ) : (
          <ChevronLeft
            size={14}
          />
        )}
      </button>

      {/* COLLAPSED */}

      {collapsed ? (
        <div className="flex h-full flex-col items-center bg-black pt-5">
          <button
            onClick={() => {
              if (
                chats.length > 0
              ) {
                console.log(chats)
                openChat(
                  chats[0].chatId,
                  chats[0].symbol
                );
              }
            }}
            className="
              flex
              h-[34px]
              w-[34px]
              items-center
              justify-center
              rounded-[5px]
              text-[#8c8d96]
              hover:bg-[#19191f]
              hover:text-white
            "
          >
            <MessageSquare
              size={17}
            />
          </button>

          <button
            onClick={
              createNewChat
            }
            className="
              mt-3
              flex
              h-[34px]
              w-[34px]
              items-center
              justify-center
              rounded-[5px]
              text-[#8c8d96]
              hover:bg-[#19191f]
              hover:text-white
            "
          >
            <Plus size={17} />
          </button>

          <div className="mt-4 h-px w-[28px] bg-[#24242c]" />

          <div className="mt-4 flex flex-col items-center gap-3">
            {chats
              .slice(0, 8)
              .map(
                (chat) => (
                  <button
                    key={
                      chat.chatId
                    }
                    onClick={() =>
                      openChat(
                        chat.chatId,
                        chat.symbol
                      )
                    }
                    title={
                      chat.title
                    }
                    className={`
                      h-[8px]
                      w-[8px]
                      rounded-full
                      ${
                        chat.chatId ===
                        currentChatId
                          ? "bg-[#8b3dff]"
                          : "bg-[#555963]"
                      }
                    `}
                  />
                )
              )}
          </div>
        </div>
      ) : (
        /* EXPANDED */

        <div className="flex h-full min-h-0 flex-col bg-black">
          {/* HEADER */}

          <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#202027] px-4">
            <div className="flex items-center gap-2">
              <MessageSquare
                size={14}
                className="text-[#a566ff]"
              />

              <span className="font-mono text-[12px] font-medium tracking-[0.5px]">
                Chat History
              </span>
            </div>
          </div>

          {/* NEW CHAT */}

          <div className="shrink-0 px-3 py-3">
            <button
              onClick={
                createNewChat
              }
              className="
                flex
                h-[34px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-[6px]
                border
                border-[#8038e9]
                bg-[#171122]
                text-[11px]
                text-[#c99cff]
                transition
                hover:bg-[#20152f]
              "
            >
              <Plus
                size={14}
              />

              New Chat
            </button>
          </div>

          {/* HISTORY */}

          <div className="min-h-0 flex-1 overflow-y-auto px-3">
            <div className="mb-2 px-2 font-mono text-[9px] tracking-[1.2px] text-[#626570]">
              YOUR CHATS
            </div>

            {loading && chats.length==0 ? (
              <div className="px-2 py-4 font-mono text-[9px] text-[#626570]">
                Loading...
              </div>
            ) : chats.length ===
              0 ? (
              <div className="px-2 py-4 text-[10px] leading-[1.5] text-[#626570]">
                No chats yet.
                <br />
                Start a conversation
                with Quant Bot.
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map(
                  (chat) => {
                    const active =
                      chat.chatId ===
                      currentChatId;

                    return (
                      <button
                        key={
                          chat.chatId
                        }
                        onClick={() =>
                          openChat(
                            chat.chatId,
                            chat.symbol
                          )
                        }
                        className={`
                          w-full
                          rounded-[6px]
                          px-2.5
                          py-2.5
                          text-left
                          transition
                          ${
                            active
                              ? "border border-[#7135c5] bg-[#18141f]"
                              : "border border-transparent hover:bg-[#15151b]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              h-[8px]
                              w-[8px]
                              shrink-0
                              rounded-full
                              ${
                                active
                                  ? "bg-[#28dc9b]"
                                  : "bg-[#555963]"
                              }
                            `}
                          />

                          <span className="truncate font-mono text-[11px] text-[#d8d8dd]">
                            {
                              chat.title
                            }
                          </span>
                        </div>

                        <div className="mt-1 googlesans flex items-center justify-between gap-2 pl-3  text-[8px] text-[#686b76]">
                          <span>
                            {
                              chat.symbol
                            }
                          </span>

                          <span>
                            {formatChatTime(
                              chat.updatedAt
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}