import React, { useRef } from "react";
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

  const openedSeparatelyRef = useRef(false);

  const getMenuHref = (path: string) => {
    return new URL(path, window.location.origin).toString();
  };

  const openInNewTab = (path: string) => {
    window.open(getMenuHref(path), "_blank", "noopener,noreferrer");
  };

  const handleOpenSeparatelyMouseDown = (
    event: React.MouseEvent<HTMLElement>,
    action: () => void,
  ) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openedSeparatelyRef.current = true;
    action();
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
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/"))
          }
        >
          Dashboard
        </span>
      ),
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/users"))
          }
        >
          Users
        </span>
      ),
    },
    {
      key: "/plants",
      icon: <FileTextOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/plants"))
          }
        >
          Plants
        </span>
      ),
    },
    {
      key: "/diaries",
      icon: <FileTextOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/diaries"))
          }
        >
          Diaries
        </span>
      ),
    },
    {
      key: "/brands",
      icon: <TagsOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/brands"))
          }
        >
          Brands
        </span>
      ),
    },
    {
      key: "/products",
      icon: <ShoppingOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () =>
              openInNewTab("/products"),
            )
          }
        >
          Products
        </span>
      ),
    },
    {
      key: "/media",
      icon: <PictureOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/media"))
          }
        >
          Media
        </span>
      ),
    },
    {
      key: "/events",
      icon: <ThunderboltOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () => openInNewTab("/events"))
          }
        >
          Events
        </span>
      ),
    },
    {
      key: "/registry-tags",
      icon: <TagsOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () =>
              openInNewTab("/registry-tags"),
            )
          }
        >
          Registry Tags
        </span>
      ),
    },
    {
      key: "/registry",
      icon: <SettingOutlined />,
      label: (
        <span
          onMouseDown={(event) =>
            handleOpenSeparatelyMouseDown(event, () =>
              openInNewTab("/registry"),
            )
          }
        >
          Action Path Registry
        </span>
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
          onClick={({ key }) => {
            if (openedSeparatelyRef.current) {
              openedSeparatelyRef.current = false;
              return;
            }
            navigate(String(key));
          }}
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
