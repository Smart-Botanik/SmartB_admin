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
import BrandsPage, { BrandCreatePage, BrandEditPage } from "@/pages/Brands";
import ProductsPage, {
  ProductCreatePage,
  ProductEditPage,
} from "@/pages/Products";
import LocationsPage, { LocationUpdatePage } from "@/pages/Locations";
import {
  PlantsPage,
  PlantCreatePage,
  PlantEditPage,
} from "@/pages/Plants";
import {
  DiariesPage,
  DiaryCreatePage,
  DiaryEditPage,
} from "@/pages/Diaries";
import { UsersListPage, UserCreatePage } from "@/pages/Users";
import {
  EventsListPage,
  EventEditPage,
  CreatePlantEventPage,
} from "@/pages/Events";
import ActionPathRegistryPage from "@/pages/ActionPathRegistry/ActionPathRegistryPage";
import ActionPathRegistryUpsertPage from "@/pages/ActionPathRegistry/ActionPathRegistryUpsertPage";
import ActionPathRegistryEditPage from "@/pages/ActionPathRegistry/ActionPathRegistryEditPage";
import RegistryTagsPage, { RegistryTagIconsPage } from "@/pages/RegistryTags";
import FieldSpecsPage from "@/pages/Primitives/PrimitivesPage";
import FieldPatternsPage from "@/pages/FieldPatterns/FieldPatternsPage";
import ProjectionStreamRegistryHubPage from "@/pages/ProjectionStreamRegistry/ProjectionStreamRegistryHubPage";
import RegistryProfileBuilderPage from "@/pages/ProjectionStreamRegistry/RegistryProfileBuilderPage";
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
              name: "locations",
              list: "/locations",
              edit: "/locations/update/:id",
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
            {
              name: "tags",
              list: "/tags",
            },
            {
              name: "field-specs",
              list: "/field-specs",
            },
            {
              name: "field-patterns",
              list: "/field-patterns",
            },
            {
              name: "projection-stream-registry",
              list: "/projection-stream-registry",
            },
            {
              name: "projection-stream-registry-profiles",
              list: "/projection-stream-registry/profiles",
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
                        <Route
                          path="/brands/create"
                          element={<BrandCreatePage />}
                        />
                        <Route
                          path="/brands/edit/:id"
                          element={<BrandEditPage />}
                        />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route
                          path="/products/create"
                          element={<ProductCreatePage />}
                        />
                        <Route
                          path="/products/edit/:id"
                          element={<ProductEditPage />}
                        />
                        <Route path="/locations" element={<LocationsPage />} />
                        <Route
                          path="/locations/update/:id"
                          element={<LocationUpdatePage />}
                        />
                        <Route path="/plants" element={<PlantsPage />} />
                        <Route
                          path="/plants/create"
                          element={<PlantCreatePage />}
                        />
                        <Route
                          path="/plants/edit/:id"
                          element={<PlantEditPage />}
                        />
                        <Route path="/diaries" element={<DiariesPage />} />
                        <Route
                          path="/diaries/create"
                          element={<DiaryCreatePage />}
                        />
                        <Route
                          path="/diaries/edit/:id"
                          element={<DiaryEditPage />}
                        />
                        <Route path="/users" element={<UsersListPage />} />
                        <Route
                          path="/users/create"
                          element={<UserCreatePage />}
                        />
                        <Route path="/media" element={<MediaLibrary />} />
                        <Route path="/events" element={<EventsListPage />} />
                        <Route
                          path="/events/create-plant"
                          element={<CreatePlantEventPage />}
                        />
                        <Route
                          path="/events/definitions/new"
                          element={<ActionPathRegistryUpsertPage />}
                        />
                        <Route
                          path="/events/definitions/edit/:actionPath"
                          element={<ActionPathRegistryEditPage />}
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
                          path="/tags"
                          element={<RegistryTagsPage />}
                        />
                        <Route
                          path="/registry-tags"
                          element={<RegistryTagsPage />}
                        />
                        <Route
                          path="/tags/icons"
                          element={<RegistryTagIconsPage />}
                        />
                        <Route path="/field-specs" element={<FieldSpecsPage />} />
                        <Route path="/primitives" element={<FieldSpecsPage />} />
                        <Route path="/field-patterns" element={<FieldPatternsPage />} />
                        <Route
                          path="/projection-stream-registry"
                          element={<ProjectionStreamRegistryHubPage />}
                        />
                        <Route
                          path="/projection-stream-registry/profiles"
                          element={<RegistryProfileBuilderPage />}
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
