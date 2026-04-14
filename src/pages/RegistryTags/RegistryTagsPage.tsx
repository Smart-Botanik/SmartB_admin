import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select, Space, Typography, message } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import { tagsService, type TagItem } from "@/services/tags";
import RegistryTagUpsertModal, {
  type TagFormValues,
} from "@/pages/RegistryTags/components/RegistryTagUpsertModal";
import RegistryTagsTable from "@/pages/RegistryTags/components/RegistryTagsTable";

const { Title } = Typography;

const targetTypeOptions = [
  { value: "Plant", label: "Plant" },
  { value: "Diary", label: "Diary" },
  { value: "Location", label: "Location" },
  { value: "Global", label: "Global" },
];

const RegistryTagsPage: React.FC = () => {
  const [items, setItems] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [targetType, setTargetType] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [isUpsertModalOpen, setIsUpsertModalOpen] = useState(false);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await tagsService.list({
        limit: pageSize,
        offset,
        query: query || undefined,
        targetType,
        category: category || undefined,
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
    void load();
  }, [pageSize, offset, query, targetType, category]);

  const openCreateModal = () => {
    setEditingTag(null);
    setIsUpsertModalOpen(true);
  };

  const openEditModal = (tag: TagItem) => {
    setEditingTag(tag);
    setIsUpsertModalOpen(true);
  };

  const closeModal = () => {
    setIsUpsertModalOpen(false);
    setEditingTag(null);
  };

  const submitTag = async (values: TagFormValues) => {
    setSaving(true);
    try {
      if (editingTag) {
        await tagsService.update(editingTag.id, {
          label: values.label,
          targetType: values.targetType || undefined,
          category: values.category || undefined,
          color: values.color || undefined,
          icon: values.icon || undefined,
        });
        message.success("Tag updated");
      } else {
        await tagsService.create({
          label: values.label,
          targetType: values.targetType || undefined,
          category: values.category || undefined,
          color: values.color || undefined,
          icon: values.icon || undefined,
        });
        message.success("Tag created");
      }
      closeModal();
      await load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  const removeTag = async (id: string) => {
    try {
      await tagsService.delete(id);
      message.success("Tag deleted");
      await load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete tag");
    }
  };

  const pagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} items`,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        if (nextPageSize && nextPageSize !== pageSize) {
          setPageSize(nextPageSize);
          setPage(1);
        }
      },
    }),
    [page, pageSize, total],
  );

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
          Tags
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Create Tag
          </Button>
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search label..."
            allowClear
            style={{ width: 280 }}
          />
          <Select
            value={targetType}
            onChange={(value) => {
              setTargetType(value);
              setPage(1);
            }}
            allowClear
            style={{ width: 180 }}
            placeholder="Target type"
            options={targetTypeOptions}
          />
          <Input
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="Category"
            allowClear
            style={{ width: 220 }}
          />
        </Space>
      </Card>

      <Card>
        <RegistryTagsTable
          items={items}
          loading={loading}
          pagination={pagination}
          onEdit={openEditModal}
          onDelete={removeTag}
        />
      </Card>

      <RegistryTagUpsertModal
        open={isUpsertModalOpen}
        saving={saving}
        editingTag={editingTag}
        targetTypeOptions={targetTypeOptions}
        onCancel={closeModal}
        onSubmit={submitTag}
      />
    </div>
  );
};

export default RegistryTagsPage;
