import { DesignColorsPageView } from '@/blocks';
import { DashLayout } from '@/layouts';

export function DesignColorsPage() {
  return (
    <DashLayout activeHref="/design/colors">
      <DesignColorsPageView />
    </DashLayout>
  );
}
