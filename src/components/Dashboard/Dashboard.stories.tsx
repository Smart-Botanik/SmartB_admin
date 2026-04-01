import type { Meta, StoryObj } from "@storybook/react";
import { DashboardStatistics } from "./DashboardStatistics/DashboardStatistics";
import { Card, Row, Col, Typography, Space } from "antd";

const { Title } = Typography;

const meta: Meta = {
  title: "Components/Dashboard/Dashboard",
  component: () => null,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Complete Dashboard layout with all components properly sized and aligned.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Complete Dashboard with all components
export const CompleteDashboard: Story = {
  render: () => {
    const mockStats = {
      users: { total: 1234, growth: 12.5, trend: "up" as const },
      brands: { total: 56, growth: 8.3, trend: "up" as const },
      products: { total: 789, growth: -2.1, trend: "down" as const },
      views: { total: 45678, growth: 15.7, trend: "up" as const },
    };

    return (
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        <Title level={2} style={{ marginBottom: "24px" }}>
          Admin Dashboard
        </Title>

        {/* Statistics Cards Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col
            xs={24}
            sm={12}
            lg={6}
            style={{ width: "100%", minWidth: "250px" }}
          >
            <DashboardStatistics
              stats={mockStats}
              loading={false}
              title="Statistics Overview"
            />
          </Col>

          {/* Additional dashboard components can be added here */}
          <Col xs={24} sm={12} lg={6}>
            <Card title="Quick Actions" style={{ height: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>Add User</div>
                <div>Create Product</div>
                <div>View Reports</div>
                <div>Settings</div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card title="Recent Activity" style={{ height: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>New user registered</div>
                <div>Product updated</div>
                <div>Order completed</div>
                <div>System backup</div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card title="System Status" style={{ height: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>✅ Database: Online</div>
                <div>✅ API: Healthy</div>
                <div>⚠️ Storage: 85%</div>
                <div>✅ CDN: Active</div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Content Area */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Analytics Overview" style={{ height: "400px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "300px",
                  color: "#999",
                }}
              >
                Analytics Chart Placeholder
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Notifications" style={{ height: "400px" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>🔔 New order received</div>
                <div>📊 Monthly report ready</div>
                <div>⚠️ Low stock alert</div>
                <div>✅ Backup completed</div>
                <div>👤 New user registration</div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  },
};

// Loading State Dashboard
export const LoadingDashboard: Story = {
  render: () => {
    return (
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        <Title level={2} style={{ marginBottom: "24px" }}>
          Admin Dashboard
        </Title>

        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} lg={6}>
            <DashboardStatistics
              stats={{
                users: { total: 0, growth: 0, trend: "up" },
                brands: { total: 0, growth: 0, trend: "up" },
                products: { total: 0, growth: 0, trend: "up" },
                views: { total: 0, growth: 0, trend: "up" },
              }}
              loading={true}
              title="Statistics Overview"
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card title="Quick Actions" loading style={{ height: "100%" }} />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card title="Recent Activity" loading style={{ height: "100%" }} />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card title="System Status" loading style={{ height: "100%" }} />
          </Col>
        </Row>
      </div>
    );
  },
};

// Compact Dashboard Layout
export const CompactDashboard: Story = {
  render: () => {
    const mockStats = {
      users: { total: 1234, growth: 12.5, trend: "up" as const },
      brands: { total: 56, growth: 8.3, trend: "up" as const },
      products: { total: 789, growth: -2.1, trend: "down" as const },
      views: { total: 45678, growth: 15.7, trend: "up" as const },
    };

    return (
      <div
        style={{ padding: "16px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        <Title level={3} style={{ marginBottom: "16px" }}>
          Dashboard Overview
        </Title>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <DashboardStatistics
              stats={mockStats}
              loading={false}
              title="Statistics"
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card title="Quick Actions" size="small" style={{ height: "100%" }}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div style={{ fontSize: "12px" }}>Add User</div>
                <div style={{ fontSize: "12px" }}>Create Product</div>
                <div style={{ fontSize: "12px" }}>View Reports</div>
                <div style={{ fontSize: "12px" }}>Settings</div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card title="Activity" size="small" style={{ height: "100%" }}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div style={{ fontSize: "12px" }}>New user</div>
                <div style={{ fontSize: "12px" }}>Product update</div>
                <div style={{ fontSize: "12px" }}>Order done</div>
                <div style={{ fontSize: "12px" }}>Backup ok</div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card title="Status" size="small" style={{ height: "100%" }}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div style={{ fontSize: "12px" }}>✅ DB: Online</div>
                <div style={{ fontSize: "12px" }}>✅ API: OK</div>
                <div style={{ fontSize: "12px" }}>⚠️ Storage: 85%</div>
                <div style={{ fontSize: "12px" }}>✅ CDN: Active</div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  },
};

// Mobile Optimized Dashboard
export const MobileDashboard: Story = {
  render: () => {
    const mockStats = {
      users: { total: 1234, growth: 12.5, trend: "up" as const },
      brands: { total: 56, growth: 8.3, trend: "up" as const },
      products: { total: 789, growth: -2.1, trend: "down" as const },
      views: { total: 45678, growth: 15.7, trend: "up" as const },
    };

    return (
      <div
        style={{
          padding: "12px",
          background: "#f5f5f5",
          minHeight: "100vh",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <Title level={4} style={{ marginBottom: "12px", textAlign: "center" }}>
          Dashboard
        </Title>

        {/* Stats take full width on mobile */}
        <div style={{ marginBottom: "16px" }}>
          <DashboardStatistics
            stats={mockStats}
            loading={false}
            title="Overview"
          />
        </div>

        {/* Other cards stacked vertically */}
        <Card
          title="Quick Actions"
          size="small"
          style={{ marginBottom: "12px" }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div style={{ fontSize: "12px" }}>➕ Add User</div>
            <div style={{ fontSize: "12px" }}>📦 Create Product</div>
            <div style={{ fontSize: "12px" }}>📊 View Reports</div>
            <div style={{ fontSize: "12px" }}>⚙️ Settings</div>
          </Space>
        </Card>

        <Card
          title="Recent Activity"
          size="small"
          style={{ marginBottom: "12px" }}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div style={{ fontSize: "12px" }}>👤 New user registered</div>
            <div style={{ fontSize: "12px" }}>📦 Product updated</div>
            <div style={{ fontSize: "12px" }}>✅ Order completed</div>
            <div style={{ fontSize: "12px" }}>💾 System backup</div>
          </Space>
        </Card>

        <Card title="System Status" size="small">
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div style={{ fontSize: "12px" }}>✅ Database: Online</div>
            <div style={{ fontSize: "12px" }}>✅ API: Healthy</div>
            <div style={{ fontSize: "12px" }}>⚠️ Storage: 85%</div>
            <div style={{ fontSize: "12px" }}>✅ CDN: Active</div>
          </Space>
        </Card>
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: "iphone12",
    },
  },
};
