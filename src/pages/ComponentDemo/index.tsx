import React, { useState } from "react";
import { Card, Typography, Divider, Button, Space, Switch } from "antd";
import { ConfigProvider } from "antd";
import { DashboardStatistics } from "../../components/Dashboard/DashboardStatistics";
import { MediaUpload } from "../../components/Media/MediaUpload/MediaUpload";
import { MediaGrid } from "../../components/Media/MediaGrid/MediaGrid";
import { type MediaItem } from "../../services/media";

const { Title, Paragraph } = Typography;

const mockStats = {
  users: { total: 1234, growth: 12.5, trend: "up" as const },
  brands: { total: 56, growth: 8.3, trend: "up" as const },
  products: { total: 789, growth: -2.1, trend: "down" as const },
  views: { total: 45678, growth: 15.7, trend: "up" as const },
};

const ComponentDemo: React.FC = () => {
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(false);

  const updateStats = () => {
    setLoading(true);
    setTimeout(() => {
      setStats({
        users: {
          total: Math.floor(Math.random() * 5000) + 1000,
          growth: Math.random() * 50 - 25,
          trend: "up" as const,
        },
        brands: {
          total: Math.floor(Math.random() * 200) + 20,
          growth: Math.random() * 30 - 15,
          trend: "up" as const,
        },
        products: {
          total: Math.floor(Math.random() * 2000) + 500,
          growth: Math.random() * 40 - 20,
          trend: "down" as const,
        },
        views: {
          total: Math.floor(Math.random() * 100000) + 10000,
          growth: Math.random() * 60 - 30,
          trend: "up" as const,
        },
      });
      setLoading(false);
    }, 1000);
  };

  const resetStats = () => {
    setStats(mockStats);
  };

  const handleUploadComplete = (files: any[]) => {
    console.log("Uploaded files:", files);
  };

  const handleSelectionChange = (selectedFiles: MediaItem[]) => {
    console.log("Selected files:", selectedFiles);
  };

  return (
    <ConfigProvider>
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        <Title level={1}>🎨 Component Demo</Title>
        <Paragraph>
          Демонстрация компонентов без Storybook. Все компоненты работают в
          реальном времени.
        </Paragraph>

        {/* Dashboard Statistics Demo */}
        <Card title="📊 Dashboard Statistics" style={{ marginBottom: "24px" }}>
          <Space style={{ marginBottom: "16px" }}>
            <Button type="primary" onClick={updateStats} loading={loading}>
              Обновить данные
            </Button>
            <Button onClick={resetStats}>Сбросить</Button>
            <Switch
              checked={loading}
              onChange={setLoading}
              checkedChildren="Loading"
              unCheckedChildren="Normal"
            />
          </Space>
          <DashboardStatistics
            stats={stats}
            loading={loading}
            title="Статистика дашборда"
          />
        </Card>

        <Divider />

        {/* Media Upload Demo */}
        <Card title="📤 Media Upload" style={{ marginBottom: "24px" }}>
          <MediaUpload
            onUploadComplete={handleUploadComplete}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </Card>

        <Divider />

        {/* Media Grid Demo */}
        <Card title="🖼️ Media Grid">
          <Space style={{ marginBottom: "16px" }}>
            <Switch
              checked={selectable}
              onChange={setSelectable}
              checkedChildren="Selectable"
              unCheckedChildren="View Only"
            />
          </Space>
          <MediaGrid
            selectable={selectable}
            onSelectionChange={handleSelectionChange}
            pageSize={20}
            showActions={true}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default ComponentDemo;
