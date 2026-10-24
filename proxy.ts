import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: [
    "/watchlist/:path*",
    "/strategies/:path*",
    "/backtest/:path*",
    "/stock/:path*",
  ],
};