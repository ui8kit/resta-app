import { DesignPagesPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignPagesPage() {
  return (
    <DashLayout activeHref="/design/pages">
      <DesignPagesPageView />
    </DashLayout>
  );
}
