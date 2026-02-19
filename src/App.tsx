import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/routes/LandingPage';
import { MenuPage } from '@/routes/MenuPage';
import { MenuDetailPage } from '@/routes/MenuDetailPage';
import { RecipesPage } from '@/routes/RecipesPage';
import { RecipeDetailPage } from '@/routes/RecipeDetailPage';
import { BlogPage } from '@/routes/BlogPage';
import { BlogDetailPage } from '@/routes/BlogDetailPage';
import { PromotionsPage } from '@/routes/PromotionsPage';
import { PromotionDetailPage } from '@/routes/PromotionDetailPage';
import { AdminLoginPage } from '@/routes/AdminLoginPage';
import { AdminDashboardPage } from '@/routes/AdminDashboardPage';
import { DesignPage } from '@/routes/DesignPage';
import { DesignColorsPage } from '@/routes/DesignColorsPage';
import { DesignTypographyPage } from '@/routes/DesignTypographyPage';
import { DesignComponentsPage } from '@/routes/DesignComponentsPage';
import { DesignWidgetsPage } from '@/routes/DesignWidgetsPage';

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
      <Route path="/design" element={<DesignPage />} />
      <Route path="/design/colors" element={<DesignColorsPage />} />
      <Route path="/design/typography" element={<DesignTypographyPage />} />
      <Route path="/design/components" element={<DesignComponentsPage />} />
      <Route path="/design/widgets" element={<DesignWidgetsPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    </Routes>
  );
}
