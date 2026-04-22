import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  RegistryFieldSpec,
  RegistryFieldSpecStatus,
  RegistrySemanticKind,
  RegistryValueType,
  registryFieldSpecsService,
} from "@/services/registryFieldSpecs";

const { Title } = Typography;

type FieldSpecFormValues = {
  fieldId: string;
  entity: string;
  label: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  canonicalPath: string;
  unit?: string;
  status?: RegistryFieldSpecStatus;
  includeInCurrent?: boolean;
  required?: boolean;
  formatJson?: string;
  constraintsJson?: string;
};

const FieldSpecStatusTag: React.FC<{ status: RegistryFieldSpecStatus }> = ({ status }) => {
  if (status === "deprecated") {
    return <Tag color="orange">deprecated</Tag>;
  }
  return <Tag color="green">active</Tag>;
};

const PrimitivesPage: React.FC = () => {
  const [items, setItems] = useState<RegistryFieldSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [form] = Form.useForm<FieldSpecFormValues>();

  const isEditing = Boolean(editingFieldId);

  const load = async () => {
    setLoading(true);
    try {
      const next = await registryFieldSpecsService.list({ entity: "Plant" });
      setItems(next);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load field specs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<RegistryFieldSpec> = useMemo(
    () => [
      { title: "Field ID", dataIndex: "fieldId", key: "fieldId", width: 220 },
      { title: "Label", dataIndex: "label", key: "label", width: 180 },
      { title: "Value Type", dataIndex: "valueType", key: "valueType", width: 120 },
      { title: "Semantic", dataIndex: "semanticKind", key: "semanticKind", width: 120 },
      { title: "Canonical Path", dataIndex: "canonicalPath", key: "canonicalPath", width: 160 },
      { title: "Unit", dataIndex: "unit", key: "unit", width: 120 },
      {
        title: "Current",
        key: "includeInCurrent",
        width: 90,
        render: (_, record) =>
          record.includeInCurrent ? <Tag color="blue">yes</Tag> : <Tag>no</Tag>,
      },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => <FieldSpecStatusTag status={record.status} />,
      },
      { title: "Version", dataIndex: "version", key: "version", width: 100 },
      {
        title: "",
        key: "actions",
        width: 72,
        render: (_, record) => (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingFieldId(record.fieldId);
              form.setFieldsValue({
                fieldId: record.fieldId,
                entity: record.entity,
                label: record.label,
                valueType: record.valueType,
                semanticKind: record.semanticKind,
                canonicalPath: record.canonicalPath,
                unit: record.unit ?? "",
                status: record.status,
                includeInCurrent: record.includeInCurrent,
                required: record.required,
                formatJson: record.formatJson
                  ? JSON.stringify(record.formatJson, null, 2)
                  : "",
                constraintsJson: record.constraintsJson
                  ? JSON.stringify(record.constraintsJson, null, 2)
                  : "",
              });
              setModalOpen(true);
            }}
          />
        ),
      },
    ],
    [form],
  );

  const openCreateModal = () => {
    setEditingFieldId(null);
    form.resetFields();
    form.setFieldsValue({
      entity: "Plant",
      semanticKind: "generic",
      valueType: "number",
      status: "active",
      includeInCurrent: false,
      required: false,
      formatJson: "",
      constraintsJson: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFieldId(null);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing && editingFieldId) {
        await registryFieldSpecsService.upsert({
          fieldId: editingFieldId,
          entity: values.entity,
          label: values.label,
          valueType: values.valueType,
          semanticKind: values.semanticKind,
          canonicalPath: values.canonicalPath,
          unit: values.unit?.trim() || undefined,
          status: values.status,
          includeInCurrent: values.includeInCurrent,
          required: values.required,
          formatJson: values.formatJson?.trim() || undefined,
          constraintsJson: values.constraintsJson?.trim() || undefined,
        });
        message.success("Field spec updated");
      } else {
        await registryFieldSpecsService.upsert({
          fieldId: values.fieldId,
          entity: values.entity,
          label: values.label,
          valueType: values.valueType,
          semanticKind: values.semanticKind,
          canonicalPath: values.canonicalPath,
          unit: values.unit?.trim() || undefined,
          status: values.status,
          includeInCurrent: values.includeInCurrent,
          required: values.required,
          formatJson: values.formatJson?.trim() || undefined,
          constraintsJson: values.constraintsJson?.trim() || undefined,
        });
        message.success("Field spec created");
      }
      closeModal();
      await load();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message ?? "Failed to save field spec");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Field Specs (Projection/Stream v1)
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Field Spec
        </Button>
      </Space>

      <Table rowKey="id" loading={loading} dataSource={items} columns={columns} />

      <Modal
        title={isEditing ? "Edit Field Spec" : "Create Field Spec"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={submit}
        okText={isEditing ? "Save" : "Create"}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ entity: "Plant" }}>
          <Form.Item
            name="fieldId"
            label="Field ID"
            rules={[
              { required: true, message: "Field ID is required" },
              {
                pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                message: "Use dotted format: plant.solution.ph",
              },
            ]}
          >
            <Input placeholder="e.g. plant.solution.ph" disabled={isEditing} />
          </Form.Item>

          <Form.Item
            name="entity"
            label="Entity"
            rules={[{ required: true, message: "Entity is required" }]}
          >
            <Select options={[{ value: "Plant", label: "Plant" }]} />
          </Form.Item>

          <Form.Item
            name="label"
            label="Label"
            rules={[{ required: true, message: "Label is required" }]}
          >
            <Input placeholder="e.g. Solution pH" />
          </Form.Item>

          <Form.Item
            name="valueType"
            label="Value Type"
            rules={[{ required: true, message: "Value type is required" }]}
          >
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

          <Form.Item name="semanticKind" label="Semantic Kind">
            <Select
              options={[
                { value: "generic", label: "generic" },
                { value: "ph", label: "ph" },
                { value: "ppm", label: "ppm" },
                { value: "temperature", label: "temperature" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="canonicalPath"
            label="Canonical Path"
            rules={[
              { required: true, message: "Canonical path is required" },
              {
                pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                message: "Use dotted format: solution.ph",
              },
            ]}
          >
            <Input placeholder="e.g. solution.ph" />
          </Form.Item>

          <Form.Item name="unit" label="Unit">
            <Input placeholder="e.g. ppm" />
          </Form.Item>

          <Form.Item name="required" valuePropName="checked">
            <Checkbox>Required in profile by default</Checkbox>
          </Form.Item>

          <Form.Item name="includeInCurrent" valuePropName="checked">
            <Checkbox>Include in current snapshot</Checkbox>
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "deprecated", label: "deprecated" },
              ]}
            />
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
            <Input.TextArea rows={4} placeholder='e.g. {"mode":"decimal","precision":1,"step":0.1}' />
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
            <Input.TextArea rows={4} placeholder='e.g. {"min":0,"max":14}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrimitivesPage;
