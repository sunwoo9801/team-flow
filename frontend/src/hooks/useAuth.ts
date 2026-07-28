import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
}

export function useAuth() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const meQuery = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
    enabled: !!sessionStorage.getItem('access_token'),
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: { email: string; name: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: async data => {
      sessionStorage.setItem('access_token', data.accessToken);
      const { data: me } = await api.get<User>('/auth/me');
      setAuth(me, data.accessToken);
      navigate('/');
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: async data => {
      sessionStorage.setItem('access_token', data.accessToken);
      const { data: me } = await api.get<User>('/auth/me');
      setAuth(me, data.accessToken);
      navigate('/');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { token: string; newPassword: string }) =>
      api.post('/auth/reset-password', payload),
  });

  return {
    user: meQuery.data ?? user,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data || !!user,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    isRegisterPending: registerMutation.isPending,
    isLoginPending: loginMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isForgotPasswordPending: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResetPasswordPending: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
  };
}
