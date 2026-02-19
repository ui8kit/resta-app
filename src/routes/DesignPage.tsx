import { DesignOverviewPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignPage() {
  return (
    <DashLayout activeHref="/design">
      <DesignOverviewPageView />
    </DashLayout>
  );
}
