"use client";

import { usePathname } from "@/i18n/navigation";
import { Header } from "./Header";

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="w-full max-w-full">{children}</main>
    </>
  );
}
