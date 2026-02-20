import { DesignWidgetsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function WidgetsPage() {
  return (
    <DashLayout activeHref="/design/widgets">
      <DesignWidgetsPageView />
    </DashLayout>
  );
}
