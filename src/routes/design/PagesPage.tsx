import { DesignPagesPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function PagesPage() {
  return (
    <DashLayout activeHref="/design/pages">
      <DesignPagesPageView />
    </DashLayout>
  );
}
