import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { clerkLocalization } from "@/lib/clerk/localization";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization}>
      {children}
    </ClerkProvider>
  );
}
