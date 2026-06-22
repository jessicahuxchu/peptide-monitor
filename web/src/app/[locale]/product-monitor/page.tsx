import { ProductMonitorView } from "@/components/product-monitor/ProductMonitorView";
import { ProductMonitorProvider } from "@/components/providers/ProductMonitorProvider";

export default function ProductMonitorPage() {
  return (
    <ProductMonitorProvider>
      <ProductMonitorView />
    </ProductMonitorProvider>
  );
}
