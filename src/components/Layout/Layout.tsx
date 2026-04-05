import React from "react";
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  message,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TagsOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = AntLayout;

const LayoutComponent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuHref = (path: string) => {
    return new URL(path, window.location.origin).toString();
  };

  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect to login even if logout API call fails
      navigate("/login");
    }
  };

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: (
        <a href={getMenuHref("/")} target="_blank" rel="noopener noreferrer">
          Dashboard
        </a>
      ),
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: (
        <a
          href={getMenuHref("/users")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Users
        </a>
      ),
    },
    {
      key: "/plants",
      icon: <FileTextOutlined />,
      label: (
        <a
          href={getMenuHref("/plants")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Plants
        </a>
      ),
    },
    {
      key: "/diaries",
      icon: <FileTextOutlined />,
      label: (
        <a
          href={getMenuHref("/diaries")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Diaries
        </a>
      ),
    },
    {
      key: "/brands",
      icon: <TagsOutlined />,
      label: (
        <a
          href={getMenuHref("/brands")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Brands
        </a>
      ),
    },
    {
      key: "/products",
      icon: <ShoppingOutlined />,
      label: (
        <a
          href={getMenuHref("/products")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Products
        </a>
      ),
    },
    {
      key: "/media",
      icon: <PictureOutlined />,
      label: (
        <a
          href={getMenuHref("/media")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Media
        </a>
      ),
    },
    {
      key: "/events",
      icon: <ThunderboltOutlined />,
      label: (
        <a
          href={getMenuHref("/events")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Events
        </a>
      ),
    },
    {
      key: "/registry-tags",
      icon: <TagsOutlined />,
      label: (
        <a
          href={getMenuHref("/registry-tags")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Registry Tags
        </a>
      ),
    },
    {
      key: "/registry",
      icon: <SettingOutlined />,
      label: (
        <a
          href={getMenuHref("/registry")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Action Path Registry
        </a>
      ),
    },
  ];

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255, 255, 255, 0.3)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Growing App
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "500" }}>Admin Panel</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                alt={user?.firstName || user?.email}
              />
              <span>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Admin User"}
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{ margin: "24px 16px", padding: 24, background: "#fff" }}
        >
          {children || <Outlet />}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default LayoutComponent;
