import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
  );
}
