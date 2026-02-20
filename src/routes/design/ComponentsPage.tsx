import { DesignComponentsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function ComponentsPage() {
  return (
    <DashLayout activeHref="/design/components">
      <DesignComponentsPageView />
    </DashLayout>
  );
}
