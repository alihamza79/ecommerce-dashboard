import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

// Routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import AuthProtected from './AuthProtected';

const Index = () => {
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes */}
        {publicRoutes.map((route, idx) => (
          <Route
            key={idx}
            path={route.path}
            element={
              <NonAuthLayout>
                {route.component}
              </NonAuthLayout>
            }
          />
        ))}

        {/* Protected Routes */}
        {authProtectedRoutes.map((route, idx) => (
          <Route
            key={idx}
            path={route.path}
            element={
              <AuthProtected>
                <VerticalLayout>
                  {route.component}
                </VerticalLayout>
              </AuthProtected>
            }
          />
        ))}

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Fragment>
  );
};

export default Index;

