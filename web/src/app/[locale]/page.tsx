import { GlobalRiskIndex } from "@/components/strategic/GlobalRiskIndex";
import { ActiveDemand } from "@/components/strategic/ActiveDemand";
import { StrategicMapPreview } from "@/components/strategic/StrategicMapPreview";
import { RegulatoryMatrix } from "@/components/strategic/RegulatoryMatrix";
import { AgentInsights } from "@/components/strategic/AgentInsights";
import { KpiBar } from "@/components/strategic/KpiBar";
import {
  PendingDecisions,
  WeeklyRegulatorySummary,
} from "@/components/strategic/PendingDecisions";
import { DashboardProvider } from "@/components/providers/DashboardProvider";

export default function StrategicHomePage() {
  return (
    <DashboardProvider>
      <KpiBar />
      <div className="mx-auto grid w-full max-w-full gap-4 overflow-x-hidden p-4 md:gap-5 md:p-6 xl:grid-cols-[minmax(200px,1fr)_minmax(360px,2fr)_minmax(200px,1fr)]">
      <aside className="flex flex-col gap-4 md:gap-5">
        <GlobalRiskIndex />
        <ActiveDemand />
        <WeeklyRegulatorySummary />
      </aside>

      <section className="flex min-h-[50vh] flex-col">
        <StrategicMapPreview />
      </section>

      <aside className="flex flex-col gap-4 md:gap-5">
        <PendingDecisions />
        <RegulatoryMatrix />
        <AgentInsights />
      </aside>
      </div>
    </DashboardProvider>
  );
}
