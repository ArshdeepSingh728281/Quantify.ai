"use client";

import { signIn } from "next-auth/react";
import { BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#08080a] flex items-center justify-center">
      <div className="w-[390px] border border-[#28282f] bg-[#101014] p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-white flex items-center justify-center">
            <BarChart3 className="text-black" />
          </div>
        </div>

        <h1 className="text-center text-[24px] font-semibold">
          Welcome to Quantify.ai
        </h1>

        <p className="text-center text-[12px] text-[#77777f] mt-2 mb-7">
          Simplifies quant for everybody.
        </p>

        <button
          onClick={() => signIn("google")}
          className="w-full h-[42px] bg-white text-black text-[12px] font-medium rounded-[3px] hover:bg-[#e8e8e8]"
        >
          Continue with Google
        </button>

        <p className="text-center text-[9px] text-[#55555c] mt-5">
          Your dashboard is available without signing in.
        </p>
      </div>
    </main>
  );
}