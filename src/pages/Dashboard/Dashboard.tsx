import React from "react";
import { Card, Row, Col, Statistic, List, Avatar, Typography } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  TagsOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Plants"
              value={456}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Brands"
              value={89}
              prefix={<TagsOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={234}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#eb2f96" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activities">
            <List
              dataSource={[
                { title: "New user registered", description: "John Doe - 2 hours ago" },
                { title: "Plant updated", description: "Tomato Plant - 4 hours ago" },
                { title: "New brand added", description: "Organic Seeds - 6 hours ago" },
                { title: "Product created", description: "Fertilizer Pack - 8 hours ago" },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="System Status">
            <List
              dataSource={[
                { title: "Database", status: "Healthy", color: "#52c41a" },
                { title: "API Server", status: "Running", color: "#52c41a" },
                { title: "File Storage", status: "Active", color: "#52c41a" },
                { title: "Cache", status: "Connected", color: "#52c41a" },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <span style={{ color: item.color }}>
                        {item.status}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
