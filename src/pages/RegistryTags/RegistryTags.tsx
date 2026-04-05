import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  Modal,
  Space,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { tagsService, type TagListItem } from "@/services/tags";

const { Title, Text } = Typography;

type TagFormValues = {
  label: string;
  targetType?: string | null;
  color?: string | null;
  icon?: string | null;
  category?: string | null;
};

const TARGET_TYPE_OPTIONS = [
  { value: "Plant", label: "Plant" },
  { value: "Diary", label: "Diary" },
  { value: "Product", label: "Product" },
  { value: "Brand", label: "Brand" },
] as const;

const RegistryTagsPage: React.FC = () => {
  const [items, setItems] = useState<TagListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TagListItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm<TagFormValues>();

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await tagsService.list({
        limit: pageSize,
        offset,
        query: query || undefined,
      });
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const resp = await tagsService.list({
          limit: pageSize,
          offset,
          query: query || undefined,
        });
        if (cancelled) return;
        setItems(resp.items);
        setTotal(resp.total);
      } catch (e: any) {
        if (cancelled) return;
        message.error(e?.message ?? "Failed to load tags");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [offset, pageSize, query]);

  const pagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        if (nextPageSize && nextPageSize !== pageSize) {
          setPageSize(nextPageSize);
          setPage(1);
        }
      },
      showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} items`,
    }),
    [page, pageSize, total],
  );

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (tag: TagListItem) => {
    setModalMode("edit");
    setEditing(tag);
    form.setFieldsValue({
      label: tag.label,
      targetType: tag.targetType ?? null,
      color: tag.color ?? null,
      icon: tag.icon ?? null,
      category: tag.category ?? null,
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (modalMode === "create") {
        await tagsService.create({
          label: values.label,
          targetType: values.targetType ?? undefined,
          color: values.color ?? undefined,
          icon: values.icon ?? undefined,
          category: values.category ?? undefined,
        });
        message.success("Tag created");
      } else {
        if (!editing) throw new Error("No tag selected");
        await tagsService.update({
          id: editing.id,
          label: values.label,
          targetType: values.targetType ?? null,
          color: values.color ?? null,
          icon: values.icon ?? null,
          category: values.category ?? null,
        });
        message.success("Tag updated");
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (tag: TagListItem) => {
    Modal.confirm({
      title: "Delete tag",
      content: (
        <div>
          <Text>Are you sure you want to delete tag </Text>
          <Text strong>{tag.label}</Text>
          <Text>?</Text>
        </div>
      ),
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await tagsService.delete({ id: tag.id });
          message.success("Tag deleted");
          await load();
        } catch (e: any) {
          message.error(e?.message ?? "Failed to delete tag");
        }
      },
    });
  };

  const columns: ColumnsType<TagListItem> = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: "Target",
      dataIndex: "targetType",
      key: "targetType",
      width: 140,
      render: (v: string | null | undefined) =>
        v || <Text type="secondary">-</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 180,
      render: (v: string | null | undefined) =>
        v || <Text type="secondary">-</Text>,
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      width: 160,
      render: (_v, record) => {
        if (!record.color) return <Text type="secondary">-</Text>;
        return <Tag color={record.color}>{record.color}</Tag>;
      },
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 200,
      render: (v: string | null | undefined) =>
        v || <Text type="secondary">-</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_v, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

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
          Registry Tags
        </Title>
        <Space>
          <Button onClick={() => load()} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" onClick={openCreate}>
            Create Tag
          </Button>
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Input.Search
            allowClear
            placeholder="Search tags..."
            style={{ width: 360 }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <Text type="secondary">Total: {total}</Text>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={pagination}
        />
      </Card>

      <Modal
        title={modalMode === "create" ? "Create Tag" : "Edit Tag"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSave}
        okButtonProps={{ loading: saving }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="label"
            label="Label"
            rules={[{ required: true, message: "Label is required" }]}
          >
            <Input placeholder="Transplant" />
          </Form.Item>

          <Form.Item name="targetType" label="Target type (optional)">
            <Select
              allowClear
              placeholder="Common (no target type)"
              options={[...TARGET_TYPE_OPTIONS]}
              style={{ width: 240 }}
            />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input placeholder="status / stage / action ..." />
          </Form.Item>

          <Form.Item name="color" label="Color">
            <ColorPicker
              showText
              format="hex"
              allowClear
              value={form.getFieldValue("color") || undefined}
              onChange={(_, hex) => {
                form.setFieldValue("color", hex);
              }}
            />
          </Form.Item>

          <Form.Item name="icon" label="Icon">
            <Input placeholder="droplet-warning" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RegistryTagsPage;
