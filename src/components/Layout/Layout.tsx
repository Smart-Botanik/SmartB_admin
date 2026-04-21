import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  message,
  Button,
  Tooltip,
  Checkbox,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  ShoppingOutlined,
  TagsOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  LogoutOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
  DatabaseOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import "./Layout.css";

const { Header, Sider, Content } = AntLayout;
const MENU_SECTION_VISIBILITY_STORAGE_KEY = "admin_layout_section_visibility";
const SIDEBAR_WIDTH_STORAGE_KEY = "admin_layout_sidebar_width";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin_layout_sidebar_collapsed";
const MENU_OPEN_SECTION_KEYS_STORAGE_KEY = "admin_layout_menu_open_sections";

type SectionKey =
  | "analytics"
  | "work-zone"
  | "entities"
  | "media"
  | "admin-section";

type MenuLeafItem = NonNullable<MenuProps["items"]>[number];
const SECTION_MENU_KEYS = [
  "section-analytics",
  "section-work-zone",
  "section-entities",
  "section-media",
  "section-admin-section",
] as const;

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_COLLAPSED_WIDTH = 68;

const LayoutComponent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const openedSeparatelyRef = useRef(false);
  const [openSectionKeys, setOpenSectionKeys] =
    useState<string[]>(SECTION_MENU_KEYS as unknown as string[]);
  const [sidebarWidth, setSidebarWidth] = useState<number>(280);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const isResizingRef = useRef(false);
  const [hiddenSections, setHiddenSections] = useState<Record<SectionKey, boolean>>(
    {
      analytics: false,
      "work-zone": false,
      entities: false,
      media: false,
      "admin-section": false,
    },
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MENU_SECTION_VISIBILITY_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
      setHiddenSections((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore malformed persisted settings.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      MENU_SECTION_VISIBILITY_STORAGE_KEY,
      JSON.stringify(hiddenSections),
    );
  }, [hiddenSections]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MENU_OPEN_SECTION_KEYS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        const allowed = new Set(SECTION_MENU_KEYS as unknown as string[]);
        const sanitized = parsed.filter((key) => allowed.has(key));
        if (sanitized.length > 0) {
          setOpenSectionKeys(sanitized);
        }
      }
    } catch {
      // Ignore malformed persisted settings.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      MENU_OPEN_SECTION_KEYS_STORAGE_KEY,
      JSON.stringify(openSectionKeys),
    );
  }, [openSectionKeys]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const width = Number(raw);
      if (Number.isFinite(width)) {
        setSidebarWidth(
          Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width)),
        );
      }
    } catch {
      // Ignore malformed persisted settings.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (!raw) {
        return;
      }
      setIsSidebarCollapsed(raw === "true");
    } catch {
      // Ignore malformed persisted settings.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current || isSidebarCollapsed) {
        return;
      }
      const nextWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, event.clientX),
      );
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.classList.remove("admin-layout-sidebar-resizing");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSidebarCollapsed]);

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

  const createMenuItemLabel = (title: string, path: string) => (
    <span
      onMouseDown={(event) =>
        handleOpenSeparatelyMouseDown(event, () => openInNewTab(path))
      }
    >
      {title}
    </span>
  );

  const createSectionLabel = (title: string, sectionKey: SectionKey) => {
    const isHidden = hiddenSections[sectionKey];
    const toggleTitle = isHidden ? "Show section items" : "Hide section items";

    return (
      <div className="admin-layout-section-title">
        <span>{title}</span>
        {!isSidebarCollapsed ? (
          <Tooltip title={toggleTitle}>
            <Button
              size="small"
              type="text"
              className="admin-layout-section-toggle"
              icon={isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setHiddenSections((prev) => ({
                  ...prev,
                  [sectionKey]: !prev[sectionKey],
                }));
              }}
            />
          </Tooltip>
        ) : null}
      </div>
    );
  };

  const sectionDefinitions: Array<{
    key: SectionKey;
    title: string;
    menuKey: string;
    icon: React.ReactNode;
    items: MenuLeafItem[];
  }> = [
    {
      key: "analytics",
      title: "Analytics",
      menuKey: "section-analytics",
      icon: <BarChartOutlined />,
      items: [
        {
          key: "/",
          icon: <DashboardOutlined />,
          label: createMenuItemLabel("Dashboard", "/"),
        },
        {
          key: "/users",
          icon: <UserOutlined />,
          label: createMenuItemLabel("Users", "/users"),
        },
      ],
    },
    {
      key: "work-zone",
      title: "Work Zone",
      menuKey: "section-work-zone",
      icon: <DeploymentUnitOutlined />,
      items: [
        {
          key: "/plants",
          icon: <ExperimentOutlined />,
          label: createMenuItemLabel("Plants", "/plants"),
        },
        {
          key: "/diaries",
          icon: <FileTextOutlined />,
          label: createMenuItemLabel("Diaries", "/diaries"),
        },
        {
          key: "/events",
          icon: <ThunderboltOutlined />,
          label: createMenuItemLabel("Events", "/events"),
        },
      ],
    },
    {
      key: "entities",
      title: "Entities",
      menuKey: "section-entities",
      icon: <AppstoreOutlined />,
      items: [
        {
          key: "/products",
          icon: <ShoppingOutlined />,
          label: createMenuItemLabel("Products", "/products"),
        },
        {
          key: "/brands",
          icon: <TagsOutlined />,
          label: createMenuItemLabel("Brands", "/brands"),
        },
      ],
    },
    {
      key: "media",
      title: "Media",
      menuKey: "section-media",
      icon: <DatabaseOutlined />,
      items: [
        {
          key: "/media",
          icon: <PictureOutlined />,
          label: createMenuItemLabel("Media", "/media"),
        },
      ],
    },
    {
      key: "admin-section",
      title: "Projection/Stream Registry",
      menuKey: "section-admin-section",
      icon: <ToolOutlined />,
      items: [
        {
          key: "/projection-stream-registry",
          icon: <DeploymentUnitOutlined />,
          label: createMenuItemLabel(
            "Projection/Stream Hub",
            "/projection-stream-registry",
          ),
        },
        {
          key: "/tags",
          icon: <TagsOutlined />,
          label: createMenuItemLabel("Registry Tags", "/tags"),
        },
        {
          key: "/registry",
          icon: <SettingOutlined />,
          label: createMenuItemLabel("Action Path Registry", "/registry"),
        },
        {
          key: "/primitives",
          icon: <DatabaseOutlined />,
          label: createMenuItemLabel("Primitives", "/primitives"),
        },
      ],
    },
  ];

  const menuItems: MenuProps["items"] = useMemo(() => {
    return sectionDefinitions.map((section) => {
      const isHidden = hiddenSections[section.key];

      return {
        key: section.menuKey,
        icon: section.icon,
        label: createSectionLabel(section.title, section.key),
        children: isHidden
          ? [
              {
                key: `${section.menuKey}-hidden`,
                disabled: true,
                label: "Items hidden",
              },
            ]
          : section.items,
      };
    });
  }, [hiddenSections, isSidebarCollapsed]);

  const selectedMenuKey = useMemo(() => {
    if (location.pathname.startsWith("/registry")) {
      return "/registry";
    }
    if (location.pathname.startsWith("/tags")) {
      return "/tags";
    }
    if (location.pathname.startsWith("/primitives")) {
      return "/primitives";
    }
    if (location.pathname.startsWith("/projection-stream-registry")) {
      return "/projection-stream-registry";
    }
    if (location.pathname.startsWith("/users")) {
      return "/users";
    }
    if (location.pathname.startsWith("/plants")) {
      return "/plants";
    }
    if (location.pathname.startsWith("/diaries")) {
      return "/diaries";
    }
    if (location.pathname.startsWith("/products")) {
      return "/products";
    }
    if (location.pathname.startsWith("/brands")) {
      return "/brands";
    }
    if (location.pathname.startsWith("/media")) {
      return "/media";
    }
    if (location.pathname.startsWith("/events")) {
      return "/events";
    }
    return "/";
  }, [location.pathname]);

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

  const allSectionsExpanded = openSectionKeys.length === SECTION_MENU_KEYS.length;

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        className="admin-layout-sider"
        width={sidebarWidth}
        collapsed={isSidebarCollapsed}
        collapsible
        trigger={null}
        breakpoint="lg"
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        onBreakpoint={(broken) => {
          setIsSidebarCollapsed(broken);
        }}
        onCollapse={(collapsed) => setIsSidebarCollapsed(collapsed)}
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
          {isSidebarCollapsed ? "GA" : "Growing App"}
        </div>
        {!isSidebarCollapsed ? (
          <div className="admin-layout-menu-controls">
            <Checkbox
              checked={allSectionsExpanded}
              onChange={(event) => {
                setOpenSectionKeys(
                  event.target.checked
                    ? (SECTION_MENU_KEYS as unknown as string[])
                    : [],
                );
              }}
            >
              Expand all sections
            </Checkbox>
          </div>
        ) : null}
        <Menu
          className="admin-layout-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          openKeys={isSidebarCollapsed ? [] : openSectionKeys}
          onOpenChange={(keys) => setOpenSectionKeys(keys as string[])}
          items={menuItems}
          onClick={({ key }) => {
            if (openedSeparatelyRef.current) {
              openedSeparatelyRef.current = false;
              return;
            }
            if (typeof key === "string" && key.startsWith("/")) {
              navigate(key);
            }
          }}
        />
        {!isSidebarCollapsed ? (
          <div
            className="admin-layout-sider-resize-handle"
            onMouseDown={(event) => {
              event.preventDefault();
              isResizingRef.current = true;
              document.body.classList.add("admin-layout-sidebar-resizing");
            }}
          />
        ) : null}
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
          <Space size={12}>
            <Button
              type="text"
              icon={
                isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar menu"
            />
            <div style={{ fontSize: "18px", fontWeight: "500" }}>Admin Panel</div>
          </Space>
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
