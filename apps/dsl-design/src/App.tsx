import { Route, Routes } from 'react-router-dom';
import { OverviewPage } from '@/routes/overview/Page';
import { ColorsPage } from '@/routes/colors/Page';
import { TokensPage } from '@/routes/tokens/Page';
import { TypographyPage } from '@/routes/typography/Page';
import { ComponentsPage } from '@/routes/components/Page';
import { PrimitivesPage } from '@/routes/primitives/Page';
import { WidgetsPage } from '@/routes/widgets/Page';
import { PagesPage } from '@/routes/pages/Page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/colors" element={<ColorsPage />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="/typography" element={<TypographyPage />} />
      <Route path="/components" element={<ComponentsPage />} />
      <Route path="/primitives" element={<PrimitivesPage />} />
      <Route path="/widgets" element={<WidgetsPage />} />
      <Route path="/pages" element={<PagesPage />} />
    </Routes>
  );
}
