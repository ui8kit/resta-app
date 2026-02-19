import { DesignTypographyPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignTypographyPage() {
  return (
    <DashLayout activeHref="/design/typography">
      <DesignTypographyPageView />
    </DashLayout>
  );
}
