import React, { useMemo } from "react";
import { Button, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import type { TagItem } from "@/services/tags";
import { renderTagIcon } from "@/pages/RegistryTags/iconRegistry";

const { Text } = Typography;

type RegistryTagsTableProps = {
  items: TagItem[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onEdit: (tag: TagItem) => void;
  onManageMapping: (tag: TagItem) => void;
  onDelete: (id: string) => void;
};

const RegistryTagsTable: React.FC<RegistryTagsTableProps> = ({
  items,
  loading,
  pagination,
  onEdit,
  onManageMapping,
  onDelete,
}) => {
  const columns: ColumnsType<TagItem> = useMemo(
    () => [
      {
        title: "Label",
        dataIndex: "label",
        key: "label",
        render: (value: string, record) => (
          <Space size={8}>
            <Tag color={record.color ?? undefined}>{value}</Tag>
          </Space>
        ),
      },
      {
        title: "Target type",
        dataIndex: "targetType",
        key: "targetType",
        width: 140,
        render: (value?: string | null) =>
          value || <Text type="secondary">-</Text>,
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        width: 180,
        render: (value?: string | null) =>
          value || <Text type="secondary">-</Text>,
      },
      {
        title: "Icon",
        dataIndex: "icon",
        key: "icon",
        width: 160,
        render: (value?: string | null) =>
          value ? (
            <Space size={8}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {renderTagIcon(value)}
              </span>
              <Text code>{value}</Text>
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: "Actions",
        key: "actions",
        width: 260,
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => onEdit(record)}>
              Edit
            </Button>
            <Button size="small" onClick={() => onManageMapping(record)}>
              Mapping
            </Button>
            <Popconfirm
              title="Delete tag?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onDelete, onEdit, onManageMapping],
  );

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={items}
      columns={columns}
      pagination={pagination}
    />
  );
};

export default RegistryTagsTable;
