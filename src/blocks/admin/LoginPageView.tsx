import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Block, Stack, Title, Text, Button, Field } from '@ui8kit/core';
import { If } from '@ui8kit/dsl';
import { useAdminAuth } from '@/providers/AdminAuthContext';

export interface AdminLoginPageViewProps {
  headerTitle?: string;
}

export function AdminLoginPageView({ headerTitle }: AdminLoginPageViewProps) {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid username or password');
    }
  }

  return (
    <AdminLayout>
      <Block component="main" py="16" data-class="admin-login-section">
        <Stack gap="6" max="w-md" mx="auto" px="4" data-class="admin-login-form">
          <Title fontSize="2xl" fontWeight="bold" textAlign="center" data-class="admin-login-title">
            Admin Login
          </Title>
          <Text fontSize="sm" textColor="muted-foreground" textAlign="center" data-class="admin-login-subtitle">
            RestA admin area. Test credentials: admin / admin
          </Text>
          <form onSubmit={handleSubmit} data-class="admin-login-form-element">
            <Stack gap="4" data-class="admin-login-fields">
              <Stack gap="2" data-class="admin-login-field">
                <Text fontSize="sm" fontWeight="medium" data-class="admin-login-label">
                  Username
                </Text>
                <Field
                  type="text"
                  value={username}
                  onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
                  placeholder="admin"
                  data-class="admin-login-input"
                />
              </Stack>
              <Stack gap="2" data-class="admin-login-field">
                <Text fontSize="sm" fontWeight="medium" data-class="admin-login-label">
                  Password
                </Text>
                <Field
                  type="password"
                  value={password}
                  onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                  placeholder="••••••••"
                  data-class="admin-login-input"
                />
              </Stack>
              <If test="error" value={!!error}>
                <Text fontSize="sm" textColor="destructive" data-class="admin-login-error">
                  {error}
                </Text>
              </If>
              <Button type="submit" size="lg" data-class="admin-login-submit">
                Sign In
              </Button>
            </Stack>
          </form>
        </Stack>
      </Block>
    </AdminLayout>
  );
}
