import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AuthCallbackPage from '../pages/auth/AuthCallbackPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import('../pages/DashboardPage');
          return { Component };
        },
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
