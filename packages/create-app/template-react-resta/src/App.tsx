import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/routes/landing/Page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}
