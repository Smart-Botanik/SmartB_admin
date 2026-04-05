import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { actionPathRegistryService } from "@/services/actionPathRegistry";

const { Title, Text } = Typography;

const ActionPathRegistryPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<
    Array<{
      id: string;
      actionPath: string;
      targetType: string;
      mapping: Record<string, unknown>;
      tagId?: string | null;
      tag?: {
        id: string;
        label: string;
        color?: string | null;
      } | null;
      conditions?: Array<{
        field: string;
        operator: "lt" | "gt" | "eq" | "lte" | "gte";
        value: string;
        tagId: string;
      }> | null;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: pageSize,
        offset,
        targetType: targetTypeFilter,
      });
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageSize, offset, targetTypeFilter]);

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
          Action Path Registry
        </Title>
        <Space>
          <Button onClick={() => load()} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" onClick={() => navigate("/registry/new")}>
            Create Registry
          </Button>
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Select
              value={targetTypeFilter}
              onChange={(v) => {
                setTargetTypeFilter(v);
                setPage(1);
              }}
              placeholder="Filter by target type"
              style={{ width: 220 }}
              allowClear
              options={[{ value: "Plant", label: "Plant" }]}
            />
          </Space>
          <Text type="secondary">Total: {total}</Text>
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={
            [
              {
                title: "Action path",
                dataIndex: "actionPath",
                key: "actionPath",
                render: (v: string) => <Text code>{v}</Text>,
              },
              {
                title: "Target type",
                dataIndex: "targetType",
                key: "targetType",
                width: 160,
                render: (v: string) => {
                  const color = v === "Plant" ? "green" : "default";
                  return <Tag color={color}>{v}</Tag>;
                },
              },
              {
                title: "Mapping",
                dataIndex: "mapping",
                key: "mapping",
                render: (v: Record<string, unknown>) => (
                  <pre
                    style={{ margin: 0, maxWidth: 520, whiteSpace: "pre-wrap" }}
                  >
                    {JSON.stringify(v, null, 2)}
                  </pre>
                ),
              },
              {
                title: "Tag",
                dataIndex: "tag",
                key: "tag",
                width: 160,
                render: (tag: (typeof items)[number]["tag"]) => {
                  if (!tag) return <Text type="secondary">-</Text>;
                  return <Tag color={tag.color ?? "default"}>{tag.label}</Tag>;
                },
              },
              {
                title: "Actions",
                key: "actions",
                width: 120,
                render: (_v, record) => (
                  <Button
                    size="small"
                    onClick={() =>
                      navigate(
                        `/registry/edit/${encodeURIComponent(record.actionPath)}`,
                        {
                          state: {
                            item: {
                              actionPath: record.actionPath,
                              targetType: record.targetType,
                              mapping: record.mapping,
                              conditions: record.conditions ?? null,
                              tagId: record.tagId ?? null,
                            },
                          },
                        },
                      )
                    }
                  >
                    Edit
                  </Button>
                ),
              },
              {
                title: "Updated",
                dataIndex: "updatedAt",
                key: "updatedAt",
                width: 180,
                render: (v: string) => new Date(v).toLocaleString(),
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 180,
                render: (v: string) => new Date(v).toLocaleString(),
              },
            ] as ColumnsType<(typeof items)[number]>
          }
          pagination={
            {
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (nextPage, nextSize) => {
                setPage(nextPage);
                if (nextSize && nextSize !== pageSize) {
                  setPageSize(nextSize);
                  setPage(1);
                }
              },
            } as TablePaginationConfig
          }
        />
      </Card>
    </div>
  );
};

export default ActionPathRegistryPage;
