import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/supply-chain", locale: locale as "en" | "zh" });
}
