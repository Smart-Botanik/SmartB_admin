import React from "react";
import ReactDOM from "react-dom/client";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import { ErrorComponent } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/Dashboard";
import { LoginPage } from "@/pages/Login";

const API_URL = "http://localhost:3001/api";

const App: React.FC = () => {
  return (
    <BrowserRouter>
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
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </ConfigProvider>
      </Refine>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
