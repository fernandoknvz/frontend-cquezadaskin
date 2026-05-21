import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
};

const hasRequiredRole = (userRole: string, requiredRole?: string) => {
  if (!requiredRole) return true;
  if (requiredRole === "admin") {
    return userRole === "admin" || userRole === "superadmin";
  }
  return userRole === requiredRole;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-[#8E8E8E]">
        Verificando sesión...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRequiredRole(user.rol, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
