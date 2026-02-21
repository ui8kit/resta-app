import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/providers/AdminAuthContext';

export function useAdminNav() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return { handleLogout };
}
