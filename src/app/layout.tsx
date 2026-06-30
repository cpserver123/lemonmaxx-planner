import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | LemonMaxx Planner",
    default: "LemonMaxx Planner",
  },
  description: "Accountability Driven Execution — plan, promise, and deliver.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.className}>
      <body suppressHydrationWarning className="bg-white dark:bg-[#020817] text-dark dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
