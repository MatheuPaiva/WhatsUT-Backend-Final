import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // Se o usuário está autenticado, permite o acesso à "Outlet" (a página filha).
  // Se não, redireciona para a página de login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}