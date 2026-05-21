import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AuthCallbackPage from '../pages/auth/AuthCallbackPage';
import InvitePage from '../pages/invite/InvitePage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/invite/:token', element: <InvitePage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/workspace" replace /> },
          {
            path: 'workspace',
            lazy: async () => {
              const { default: C } = await import('../pages/workspace/WorkspaceListPage');
              return { Component: C };
            },
          },
          {
            path: 'workspace/new',
            lazy: async () => {
              const { default: C } = await import('../pages/workspace/WorkspaceNewPage');
              return { Component: C };
            },
          },
          {
            path: 'workspace/:workspaceId',
            lazy: async () => {
              const { default: C } = await import('../pages/workspace/WorkspacePage');
              return { Component: C };
            },
          },
          {
            path: 'workspace/:workspaceId/board/new',
            lazy: async () => {
              const { default: C } = await import('../pages/board/BoardNewPage');
              return { Component: C };
            },
          },
          {
            path: 'workspace/:workspaceId/board/:boardId',
            lazy: async () => {
              const { default: C } = await import('../pages/board/BoardPage');
              return { Component: C };
            },
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
