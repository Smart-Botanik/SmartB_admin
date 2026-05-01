import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  fieldPatternsService,
  type FieldPattern,
} from "@/services/fieldPatterns";
import type {
  RegistrySemanticKind,
  RegistryValueType,
} from "@/services/registryFieldSpecs";

type PatternFormValues = {
  key: string;
  title: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  canonicalUnit?: string;
  allowedUnitsCsv?: string;
  defaultInputUnit?: string;
  conversionProfile?: string;
  formatJson?: string;
  constraintsJson?: string;
};

const FieldPatternsPage: React.FC = () => {
  const [items, setItems] = useState<FieldPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm<PatternFormValues>();

  const isEditing = Boolean(editingKey);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fieldPatternsService.list());
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load field patterns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<FieldPattern> = useMemo(
    () => [
      { title: "Pattern Key", dataIndex: "key", key: "key", width: 220 },
      { title: "Title", dataIndex: "title", key: "title", width: 180 },
      { title: "Value Type", dataIndex: "valueType", key: "valueType", width: 120 },
      {
        title: "Semantic",
        dataIndex: "semanticKind",
        key: "semanticKind",
        width: 120,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      { title: "Canonical Unit", dataIndex: "canonicalUnit", key: "canonicalUnit", width: 130 },
      {
        title: "Allowed Units",
        dataIndex: "allowedUnits",
        key: "allowedUnits",
        width: 180,
        render: (units?: string[]) => (
          <Space size={[4, 4]} wrap>
            {(units?.length ? units : ["-"]).map(unit => (
              <Tag key={unit}>{unit}</Tag>
            ))}
          </Space>
        ),
      },
      { title: "Default Input", dataIndex: "defaultInputUnit", key: "defaultInputUnit", width: 130 },
      {
        title: "",
        key: "actions",
        width: 110,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingKey(record.key);
                form.setFieldsValue({
                  key: record.key,
                  title: record.title,
                  valueType: record.valueType,
                  semanticKind: record.semanticKind,
                  canonicalUnit: record.canonicalUnit ?? "",
                  allowedUnitsCsv: (record.allowedUnits ?? []).join(", "),
                  defaultInputUnit: record.defaultInputUnit ?? "",
                  conversionProfile: record.conversionProfile ?? "",
                  formatJson: record.formatJson ?? "",
                  constraintsJson: record.constraintsJson ?? "",
                });
                setModalOpen(true);
              }}
            />
            <Popconfirm
              title="Delete field pattern?"
              description={`Pattern ${record.key} will be removed from list.`}
              onConfirm={async () => {
                await fieldPatternsService.remove(record.key);
                message.success("Field pattern deleted");
                await load();
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form]
  );

  const openCreateModal = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({
      valueType: "number",
      semanticKind: "generic",
      formatJson: "",
      constraintsJson: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingKey(null);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await fieldPatternsService.upsert({
        key: isEditing && editingKey ? editingKey : values.key.trim(),
        title: values.title.trim(),
        valueType: values.valueType,
        semanticKind: values.semanticKind,
        canonicalUnit: values.canonicalUnit?.trim() || undefined,
        allowedUnits: values.allowedUnitsCsv
          ?.split(",")
          .map(item => item.trim())
          .filter(Boolean),
        defaultInputUnit: values.defaultInputUnit?.trim() || undefined,
        conversionProfile: values.conversionProfile?.trim() || undefined,
        formatJson: values.formatJson?.trim() || undefined,
        constraintsJson: values.constraintsJson?.trim() || undefined,
      });
      message.success(isEditing ? "Field pattern updated" : "Field pattern created");
      closeModal();
      await load();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message ?? "Failed to save field pattern");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Field Patterns
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 920 }}>
        Configure reusable validation/format semantics first, then reference them from Field Specs.
      </Typography.Paragraph>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Field Pattern
        </Button>
      </Space>

      <Table<FieldPattern> rowKey="key" loading={loading} dataSource={items} columns={columns} />

      <Modal
        title={isEditing ? "Edit Field Pattern" : "Create Field Pattern"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={submit}
        okText={isEditing ? "Save" : "Create"}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="key"
            label="Pattern Key"
            rules={[
              { required: true, message: "Pattern key is required" },
              {
                pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                message: "Use dotted format: ph.decimal.v1",
              },
            ]}
          >
            <Input placeholder="e.g. ph.decimal.v1" disabled={isEditing} />
          </Form.Item>

          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="e.g. pH decimal" />
          </Form.Item>

          <Form.Item name="valueType" label="Value Type" rules={[{ required: true, message: "Value type is required" }]}>
            <Select
              options={[
                { value: "number", label: "number" },
                { value: "string", label: "string" },
                { value: "boolean", label: "boolean" },
                { value: "date", label: "date" },
                { value: "enum", label: "enum" },
                { value: "json", label: "json" },
              ]}
            />
          </Form.Item>

          <Form.Item name="semanticKind" label="Semantic Kind" rules={[{ required: true, message: "Semantic kind is required" }]}>
            <Select
              options={[
                { value: "generic", label: "generic" },
                { value: "ph", label: "ph" },
                { value: "ppm", label: "ppm" },
                { value: "temperature", label: "temperature" },
                { value: "length", label: "length" },
                { value: "concentration", label: "concentration" },
              ]}
            />
          </Form.Item>

          <Form.Item name="canonicalUnit" label="Canonical Unit">
            <Input placeholder="e.g. cm" />
          </Form.Item>

          <Form.Item name="allowedUnitsCsv" label="Allowed Units (comma separated)">
            <Input placeholder="e.g. cm, ft" />
          </Form.Item>

          <Form.Item name="defaultInputUnit" label="Default Input Unit">
            <Input placeholder="e.g. cm" />
          </Form.Item>

          <Form.Item name="conversionProfile" label="Conversion Profile">
            <Input placeholder="e.g. ec_to_ppm_500" />
          </Form.Item>

          <Form.Item
            name="formatJson"
            label="Format JSON"
            rules={[
              {
                validator: async (_, value: string | undefined) => {
                  const payload = value?.trim();
                  if (!payload) return;
                  JSON.parse(payload);
                },
                message: "Format JSON must be valid JSON",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="constraintsJson"
            label="Constraints JSON"
            rules={[
              {
                validator: async (_, value: string | undefined) => {
                  const payload = value?.trim();
                  if (!payload) return;
                  JSON.parse(payload);
                },
                message: "Constraints JSON must be valid JSON",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FieldPatternsPage;

