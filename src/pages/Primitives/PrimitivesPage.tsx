import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
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
  Primitive,
  PrimitiveStatus,
  PrimitiveValueType,
  primitivesService,
} from "@/services/primitives";

const { Title } = Typography;

type PrimitiveFormValues = {
  key: string;
  name: string;
  valueType: PrimitiveValueType;
  unit?: string;
  status?: PrimitiveStatus;
  validationJson?: string;
};

const PrimitiveStatusTag: React.FC<{ status: PrimitiveStatus }> = ({ status }) => {
  if (status === "deprecated") {
    return <Tag color="orange">deprecated</Tag>;
  }
  return <Tag color="green">active</Tag>;
};

const PrimitivesPage: React.FC = () => {
  const [items, setItems] = useState<Primitive[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<PrimitiveFormValues>();

  const isEditing = Boolean(editingId);

  const load = async () => {
    setLoading(true);
    try {
      const next = await primitivesService.list();
      setItems(next);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load primitives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<Primitive> = useMemo(
    () => [
      { title: "Key", dataIndex: "key", key: "key", width: 180 },
      { title: "Name", dataIndex: "name", key: "name", width: 200 },
      { title: "Type", dataIndex: "valueType", key: "valueType", width: 140 },
      { title: "Unit", dataIndex: "unit", key: "unit", width: 120 },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => <PrimitiveStatusTag status={record.status} />,
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
              setEditingId(record.id);
              form.setFieldsValue({
                key: record.key,
                name: record.name,
                valueType: record.valueType,
                unit: record.unit ?? "",
                status: record.status,
                validationJson: record.validation
                  ? JSON.stringify(record.validation, null, 2)
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
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      valueType: "number",
      status: "active",
      validationJson: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing && editingId) {
        await primitivesService.update({
          id: editingId,
          key: values.key,
          name: values.name,
          valueType: values.valueType,
          unit: values.unit?.trim() || undefined,
          status: values.status,
          validationJson: values.validationJson?.trim() || undefined,
        });
        message.success("Primitive updated");
      } else {
        await primitivesService.create({
          key: values.key,
          name: values.name,
          valueType: values.valueType,
          unit: values.unit?.trim() || undefined,
          validationJson: values.validationJson?.trim() || undefined,
        });
        message.success("Primitive created");
      }
      closeModal();
      await load();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message ?? "Failed to save primitive");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Primitives
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Primitive
        </Button>
      </Space>

      <Table rowKey="id" loading={loading} dataSource={items} columns={columns} />

      <Modal
        title={isEditing ? "Edit Primitive" : "Create Primitive"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={submit}
        okText={isEditing ? "Save" : "Create"}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            name="key"
            label="Key"
            rules={[
              { required: true, message: "Key is required" },
              {
                pattern: /^[a-z][a-z0-9_]*$/,
                message: "Use lowercase latin letters, numbers and _",
              },
            ]}
          >
            <Input placeholder="e.g. ph" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. pH" />
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
                { value: "json", label: "json" },
              ]}
            />
          </Form.Item>

          <Form.Item name="unit" label="Unit">
            <Input placeholder="e.g. ppm" />
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
            name="validationJson"
            label="Validation JSON"
            rules={[
              {
                validator: async (_, value: string | undefined) => {
                  const payload = value?.trim();
                  if (!payload) return;
                  JSON.parse(payload);
                },
                message: "Validation JSON must be valid JSON",
              },
            ]}
          >
            <Input.TextArea rows={6} placeholder='e.g. {"min":0,"max":14}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrimitivesPage;
