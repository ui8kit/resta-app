import { AdminLoginPageView } from '@/blocks';
import { useLoginForm } from '@/hooks';

export function LoginPage() {
  const loginForm = useLoginForm();
  return (
    <AdminLoginPageView
      username={loginForm.username}
      setUsername={loginForm.setUsername}
      password={loginForm.password}
      setPassword={loginForm.setPassword}
      error={loginForm.error}
      handleSubmit={loginForm.handleSubmit}
    />
  );
}
