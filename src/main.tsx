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
import MediaLibrary from "@/pages/Media";
import ComponentDemo from "@/pages/ComponentDemo";
import BrandsPage from "@/pages/Brands";
import {
  EventsListPage,
  EventEditPage,
  CreatePlantEventPage,
} from "@/pages/Events";
import ActionPathRegistryPage from "@/pages/ActionPathRegistry/ActionPathRegistryPage";
import ActionPathRegistryUpsertPage from "@/pages/ActionPathRegistry/ActionPathRegistryUpsertPage";
import ActionPathRegistryEditPage from "@/pages/ActionPathRegistry/ActionPathRegistryEditPage";
import RegistryTagsPage from "@/pages/RegistryTags";
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
            {
              name: "media",
              list: "/media",
              create: "/media/create",
              edit: "/media/edit/:id",
              show: "/media/show/:id",
            },
            {
              name: "events",
              list: "/events",
              edit: "/events/edit/:id",
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
                        <Route path="/brands" element={<BrandsPage />} />
                        <Route path="/media" element={<MediaLibrary />} />
                        <Route path="/events" element={<EventsListPage />} />
                        <Route
                          path="/events/create-plant"
                          element={<CreatePlantEventPage />}
                        />
                        <Route
                          path="/registry"
                          element={<ActionPathRegistryPage />}
                        />
                        <Route
                          path="/registry/new"
                          element={<ActionPathRegistryUpsertPage />}
                        />
                        <Route
                          path="/registry/edit/:actionPath"
                          element={<ActionPathRegistryEditPage />}
                        />
                        <Route
                          path="/registry-tags"
                          element={<RegistryTagsPage />}
                        />
                        <Route
                          path="/events/edit/:id"
                          element={<EventEditPage />}
                        />
                        <Route path="/demo" element={<ComponentDemo />} />
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
