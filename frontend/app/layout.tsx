import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "아크릴 응원봉 시안 생성",
  description: "AI를 활용한 아크릴 응원봉 시안 자동 생성 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
