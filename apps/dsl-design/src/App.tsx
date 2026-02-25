import { Navigate, Route, Routes } from 'react-router-dom';
import { TokensPage } from '@/routes/tokens/Page';
import { PrimitivesPage } from '@/routes/primitives/Page';
import { WidgetsPage } from '@/routes/widgets/Page';
import { TypographyPage } from '@/routes/typography/Page';
import { PagesPage } from '@/routes/pages/Page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tokens" replace />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="/primitives" element={<PrimitivesPage />} />
      <Route path="/widgets" element={<WidgetsPage />} />
      <Route path="/typography" element={<TypographyPage />} />
      <Route path="/pages" element={<PagesPage />} />
    </Routes>
  );
}
