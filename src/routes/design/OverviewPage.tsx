import { DesignOverviewPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function OverviewPage() {
  return (
    <DashLayout activeHref="/design">
      <DesignOverviewPageView />
    </DashLayout>
  );
}
