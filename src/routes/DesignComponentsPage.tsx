import { DesignComponentsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignComponentsPage() {
  return (
    <DashLayout activeHref="/design/components">
      <DesignComponentsPageView />
    </DashLayout>
  );
}
