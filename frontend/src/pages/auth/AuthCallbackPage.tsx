import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth.store';

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  createdAt: string;
}

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    sessionStorage.setItem('access_token', token);
    api
      .get<User>('/auth/me')
      .then(({ data }) => {
        setAuth(data, token);
        navigate('/');
      })
      .catch(() => navigate('/login'));
  }, [params, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">로그인 처리 중...</p>
    </div>
  );
}
