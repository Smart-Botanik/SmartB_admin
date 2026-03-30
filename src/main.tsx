import React from "react";
import ReactDOM from "react-dom/client";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import { ErrorComponent } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard, PublicRoute } from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/Dashboard";
import LoginPage from "@/pages/Login";
import { UnauthorizedPage } from "@/pages/Unauthorized";
import { envConfig } from "@/config/env";

// Import CORS debugger for development
if (import.meta.env.DEV) {
  import("@/utils/cors-debug");
}

const API_URL = envConfig.apiUrl;

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Refine
          dataProvider={dataProvider(API_URL)}
          routerProvider={routerProvider}
          resources={[
            {
              name: "users",
              list: "/users",
              create: "/users/create",
              edit: "/users/edit/:id",
              show: "/users/show/:id",
            },
            {
              name: "plants",
              list: "/plants",
              create: "/plants/create",
              edit: "/plants/edit/:id",
              show: "/plants/show/:id",
            },
            {
              name: "diaries",
              list: "/diaries",
              create: "/diaries/create",
              edit: "/diaries/edit/:id",
              show: "/diaries/show/:id",
            },
            {
              name: "brands",
              list: "/brands",
              create: "/brands/create",
              edit: "/brands/edit/:id",
              show: "/brands/show/:id",
            },
            {
              name: "products",
              list: "/products",
              create: "/products/create",
              edit: "/products/edit/:id",
              show: "/products/show/:id",
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <ConfigProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <AuthGuard>
                    <Layout>
                      <UnauthorizedPage />
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <Layout>
                      <Routes>
                        <Route index element={<DashboardPage />} />
                        <Route path="*" element={<ErrorComponent />} />
                      </Routes>
                    </Layout>
                  </AuthGuard>
                }
              />
            </Routes>
          </ConfigProvider>
        </Refine>
      </AuthProvider>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
