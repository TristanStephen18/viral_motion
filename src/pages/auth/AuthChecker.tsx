import React from "react";
import { Navigate } from "react-router-dom";
import { token } from "../../config";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
