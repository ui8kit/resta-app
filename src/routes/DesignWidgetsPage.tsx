import { DesignWidgetsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignWidgetsPage() {
  return (
    <DashLayout activeHref="/design/widgets">
      <DesignWidgetsPageView />
    </DashLayout>
  );
}
