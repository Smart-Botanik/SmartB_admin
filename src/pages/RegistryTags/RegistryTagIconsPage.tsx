import React from "react";
import { Button, Card, Col, Row, Space, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

import { TAG_ICON_ITEMS } from "@/pages/RegistryTags/iconRegistry";
import { copyToClipboard } from "@/utils/helpers";

const { Title, Text } = Typography;

const RegistryTagIconsPage: React.FC = () => {
  const handleCopy = async (key: string) => {
    const ok = await copyToClipboard(key);
    if (ok) {
      message.success(`Copied: ${key}`);
      return;
    }
    message.error("Copy failed");
  };

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Tag Icons Catalog
        </Title>
      </Space>

      <Text type="secondary">
        Click copy to use icon key in the tag `icon` field.
      </Text>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        {TAG_ICON_ITEMS.map((item) => (
          <Col key={item.key} xs={24} sm={12} md={8} lg={6} xl={4}>
            <Card size="small">
              <Space
                direction="vertical"
                style={{ width: "100%", alignItems: "center" }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                <Text code>{item.key}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => void handleCopy(item.key)}
                >
                  Copy
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RegistryTagIconsPage;
