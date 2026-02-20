import { DesignColorsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function ColorsPage() {
  return (
    <DashLayout activeHref="/design/colors">
      <DesignColorsPageView />
    </DashLayout>
  );
}
