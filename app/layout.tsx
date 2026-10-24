// import type { Metadata } from "next";
// import "./globals.css";
// import AuthProvider from "@/components/AuthProvider";

// export const metadata: Metadata = {
//   title: "Quantify.ai",
//   description: "Simplifies Quant for Everybody",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//   <style>
//   @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap');
//   </style>
//       <body>
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   );
// }






// import type { Metadata } from "next";
// import { Fira_Code, Google_Sans } from "next/font/google";

// import "./globals.css";
// import AuthProvider from "@/components/AuthProvider";

// const firaCode = Fira_Code({
//   variable: "--font-fira-code",
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
// });

// const googleSans = Google_Sans({
//   variable: "--font-google-sans",
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// });

// export const metadata: Metadata = {
//   title: "Quantify.ai",
//   description: "Simplifies Quant for Everybody",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html
//       lang="en"
//       className={`${firaCode.variable} ${googleSans.variable}`}
//     >
//       <body>
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   );
// }



import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";

import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quantify.ai",
  description: "Simplifies Quant for Everybody",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={firaCode.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}