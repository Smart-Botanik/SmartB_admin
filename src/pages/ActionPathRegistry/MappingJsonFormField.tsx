import React, { useState } from "react";
import { Button, Card, Input, Space } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import { MappingJsonBuilder } from "@/components/MappingJsonBuilder";

/**
 * Default editing: raw JSON string. Optional visual builder is hidden until opened.
 */
export const MappingJsonFormField: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Input.TextArea
        disabled={disabled}
        rows={10}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder='{ "potSize": "potSize", "stage": "stage" }'
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />
      <Button
        type="default"
        icon={<ToolOutlined />}
        disabled={disabled}
        onClick={() => setBuilderOpen((o) => !o)}
      >
        {builderOpen ? "Hide visual mapping builder" : "Open visual mapping builder"}
      </Button>
      {builderOpen ? (
        <Card size="small" title="Visual mapping builder (optional)">
          <MappingJsonBuilder value={value} onChange={onChange} disabled={disabled} />
        </Card>
      ) : null}
    </Space>
  );
};
