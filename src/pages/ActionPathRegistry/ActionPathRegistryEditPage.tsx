import React, { useEffect, useMemo } from "react";
import { Button, Space, Typography, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionPathRegistryForm } from "./ActionPathRegistryForm";

const { Title } = Typography;

type LocationState = {
  item?: {
    actionPath: string;
    description?: string | null;
    targetType: string;
    mapping: Record<string, unknown>;
    conditions?: Array<{
      field: string;
      operator: "lt" | "gt" | "eq" | "lte" | "gte";
      value: string;
      tagId: string;
    }> | null;
    tagId?: string | null;
  };
};

const ActionPathRegistryEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state ?? {}) as LocationState;

  const initialValues = useMemo(() => {
    const item = state.item;
    if (!item) return null;

    return {
      actionPath: item.actionPath,
      description: item.description ?? "",
      targetType: item.targetType,
      mappingJson: JSON.stringify(item.mapping ?? {}, null, 2),
      conditionsJson: JSON.stringify(item.conditions ?? [], null, 2),
      tagId: item.tagId ?? null,
    };
  }, [state.item]);

  useEffect(() => {
    if (!initialValues) {
      message.error("Missing registry data. Please open edit from the list.");
      navigate("/registry", { replace: true });
    }
  }, [initialValues, navigate]);

  if (!initialValues) return null;

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
          Edit Registry
        </Title>
        <Button onClick={() => navigate("/registry")}>Back to list</Button>
      </Space>

      <ActionPathRegistryForm
        title={`Edit: ${initialValues.actionPath}`}
        initialValues={initialValues}
        onSaved={() => navigate("/registry")}
      />
    </div>
  );
};

export default ActionPathRegistryEditPage;
