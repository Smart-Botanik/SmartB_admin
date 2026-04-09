import React from "react";
import { Button, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { ActionPathRegistryForm } from "./ActionPathRegistryForm";

const { Title } = Typography;

const ActionPathRegistryUpsertPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          Registry Editor
        </Title>
        <Button onClick={() => navigate("/registry")}>Back to list</Button>
      </Space>

      <ActionPathRegistryForm onSaved={() => navigate("/registry")} />
    </div>
  );
};

export default ActionPathRegistryUpsertPage;
