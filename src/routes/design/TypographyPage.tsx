import { DesignTypographyPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function TypographyPage() {
  return (
    <DashLayout activeHref="/design/typography">
      <DesignTypographyPageView />
    </DashLayout>
  );
}
