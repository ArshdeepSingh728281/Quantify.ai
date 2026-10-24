"use client";

import {
  Sparkles,
  BarChart3,
  SquareStack,
} from "lucide-react";

import {
  signIn,
  useSession,
} from "next-auth/react";

export default function QuantHero() {
  const { data: session } = useSession();

  const requireAuth = () => {
    if (!session) {
      signIn("google", {
        callbackUrl: "/",
      });

      return;
    }

    window.location.href = "/stock/NIFTY";
  };

  return (
    <section className="googlesans w-[calc(100%-90px)] mx-[auto] mt-[27px]">

      {/* LABEL */}
      <div className="flex items-center gap-3 mb-3">

        <span className="firacode text-[11px] font-mono tracking-[1.8px] text-[#92929a]">
          HOW AI IN QUANT HELPS YOU — EVEN AS A BEGINNER
        </span>

        <div className="h-px bg-[#28282f] w-[70px]" />

        <span className="ml-auto text-[9px] tracking-[1px] text-[#5f6067]">
          Autonomous Edge
        </span>

      </div>

      {/* HERO */}
      <div className=" shadow-[1px_1px_8px_#311b55] hero-card relative overflow-hidden border border-[#311b55] rounded-[4px] bg-[#0f0c15]">

        {/* BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_48%_100%,rgba(132,63,255,0.28),transparent_62%)]" />

        {/* GRAPH */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          <defs>

            <linearGradient
              id="heroAreaGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8f4cff"
                stopOpacity="0.30"
              />

              <stop
                offset="100%"
                stopColor="#8f4cff"
                stopOpacity="0.02"
              />
            </linearGradient>

          </defs>

<path
  d="
    M0 245

    C90 242 145 235 220 225
    C285 216 325 230 385 238

    C445 246 485 238 535 215
    C590 190 625 195 675 212

    C725 229 760 238 805 220
    C850 202 870 170 915 178

    C960 186 990 210 1035 194
    C1080 178 1115 145 1140 105

    C1165 68 1185 48 1200 25

    L1200 300
    L0 300
    Z
  "
  fill="url(#heroAreaGradient)"
/>

{/* LINE */}
<path
  d="
    M0 245

    C90 242 145 235 220 225
    C285 216 325 230 385 238

    C445 246 485 238 535 215
    C590 190 625 195 675 212

    C725 229 760 238 805 220
    C850 202 870 170 915 178

    C960 186 990 210 1035 194
    C1080 178 1115 145 1140 105

    C1165 68 1185 48 1200 25
  "
  fill="none"
  stroke="#bd8cff"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
/>
        </svg>

        {/* LEFT CONTENT */}
        <div className="absolute left-[26px] top-[65px] z-10 ">

          <h2 className="text-[33px] leading-[1.2] ml-[10px] font-semibold text-white tracking-[-1px]">
            Intelligent quant trading made simple
          </h2>

          <p className="text-[15px] ml-[11px] text-[white]/40 mt-2  leading-[1.5]">
            Powerful algorithmic tools built for every trader, even beginners.
          </p>
{/* 
          <button
            onClick={requireAuth}
            className="mt-[18px] h-[34px] px-4 bg-[#843cff] border border-[#a968ff] shadow-[0_0_18px_rgba(132,60,255,0.45)] rounded-[3px] text-white text-[11px] font-medium"
          >
            <Sparkles
              size={12}
              className="inline mr-2"
            />

            Chat with AI

            <span className="ml-3">
              →
            </span>
          </button> */}

<button
  onClick={requireAuth}
  className="
    mt-[30px]
    ml-[10px]
    h-[46px]
    px-[22px]
    flex
    items-center
    justify-center
    gap-2
    bg-gradient-to-r
    from-[#8b3dff]
    to-[#6246e8]
    border
    border-[#b77cff]
    rounded-[6px]
    text-white
    text-[14px]
    font-medium
    shadow-[0_0_8px_rgba(145,70,255,0.65),0_0_22px_rgba(132,60,255,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]
    hover:brightness-110
    transition-all
    duration-200
  "
>
  <Sparkles
    size={17}
    className="text-[#d8b8ff]"
  />

  <span>
    Chat with AI Nifty 50
  </span>

  <span className="ml-2 text-[23px] leading-none font-light">
    →
  </span>
</button>

        </div>

        {/* RIGHT FEATURE CARDS */}
        <div className="absolute z-20 right-[25px] top-[50px] w-[500px] space-y-2">

          <Feature
            icon={<BarChart3 size={16} />}
            text="EMA 50 with one click"
            action="Run"
          />

          <Feature
            icon={<Sparkles size={16} />}
            text="Your strategy in one prompt"
            action="AI"
          />

          <Feature
            icon={<SquareStack size={16} />}
            text="Backtesting engine to test strategy"
            action="Test"
          />

        </div>

      </div>
    </section>
  );
}

function Feature({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action: string;
}) {
  return (
    <div className="mb-[15px] rounded-[4px] firacode h-[50px] bg-[#17171c] border border-[#292930] flex items-center px-4 shadow-[0_5px_20px_rgba(0,0,0,0.3)]">

      <span className="text-[#ddd] mr-3">
        {icon}
      </span>

      <span className="text-[15px] text-[#ddd]">
        {text}
      </span>

      <button className="ml-auto h-[23px] px-3 border border-[#2f2f36] text-[10px] text-[#ccc]">
        {action}
      </button>

    </div>
  );
}