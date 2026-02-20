import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/routes/landing/Page';
import { MenuPage } from '@/routes/menu/MenuPage';
import { DetailPage as MenuDetailPage } from '@/routes/menu/DetailPage';
import { RecipesPage } from '@/routes/recipes/RecipesPage';
import { RecipeDetailPage } from '@/routes/recipes/DetailPage';
import { BlogPage } from '@/routes/blog/BlogPage';
import { BlogDetailPage } from '@/routes/blog/DetailPage';
import { PromotionsPage } from '@/routes/promotions/PromotionsPage';
import { PromotionDetailPage } from '@/routes/promotions/DetailPage';
import { LoginPage } from '@/routes/admin/LoginPage';
import { DashboardPage } from '@/routes/admin/DashboardPage';
import { OverviewPage } from '@/routes/design/OverviewPage';
import { ColorsPage } from '@/routes/design/ColorsPage';
import { TypographyPage } from '@/routes/design/TypographyPage';
import { ComponentsPage } from '@/routes/design/ComponentsPage';
import { WidgetsPage } from '@/routes/design/WidgetsPage';
import { PagesPage } from '@/routes/design/PagesPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/:id" element={<MenuDetailPage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogDetailPage />} />
      <Route path="/promotions" element={<PromotionsPage />} />
      <Route path="/promotions/:id" element={<PromotionDetailPage />} />
      <Route path="/design" element={<OverviewPage />} />
      <Route path="/design/colors" element={<ColorsPage />} />
      <Route path="/design/typography" element={<TypographyPage />} />
      <Route path="/design/components" element={<ComponentsPage />} />
      <Route path="/design/widgets" element={<WidgetsPage />} />
      <Route path="/design/pages" element={<PagesPage />} />
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
