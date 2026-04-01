import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  AppstoreOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { DashboardStatsProps } from "./types";

const { Title } = Typography;

export const DashboardStatistics: React.FC<DashboardStatsProps> = ({
  stats,
  loading = false,
  title = "Dashboard Statistics",
  ...props
}) => {
  return (
    <div {...props} style={{ width: "100%", ...props.style }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        {title}
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} style={{ minWidth: "120px" }}>
          <Card loading={loading} style={{ textAlign: "center" }}>
            <Statistic
              title="Total Users"
              value={stats.users.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff", fontSize: "1.2em" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ minWidth: "120px" }}>
          <Card loading={loading} style={{ textAlign: "center" }}>
            <Statistic
              title="Total Brands"
              value={stats.brands.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#52c41a", fontSize: "1.2em" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ minWidth: "120px" }}>
          <Card loading={loading} style={{ textAlign: "center" }}>
            <Statistic
              title="Total Products"
              value={stats.products.total}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: "#fa8c16", fontSize: "1.2em" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} style={{ minWidth: "120px" }}>
          <Card loading={loading} style={{ textAlign: "center" }}>
            <Statistic
              title="Total Views"
              value={stats.views.total}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#eb2f96", fontSize: "1.2em" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardStatistics;
