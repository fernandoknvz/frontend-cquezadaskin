import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
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

  if (requiredRole && user.rol !== requiredRole && user.rol !== "superadmin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
