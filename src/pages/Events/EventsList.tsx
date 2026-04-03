import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { EditOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import type { AppEvent, EventAction, EventScope, EventTargetType } from "@/types/event";
import { eventsService } from "@/services/events";

const { Title, Text } = Typography;

const actionColor: Record<EventAction, string> = {
  create: "green",
  update: "blue",
  delete: "red",
};

const scopeColor: Record<EventScope, string> = {
  entity: "geekblue",
  field: "purple",
};

const EventsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<AppEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState<string>("");
  const [scope, setScope] = useState<EventScope | undefined>(undefined);
  const [targetType, setTargetType] = useState<EventTargetType | undefined>(undefined);
  const [action, setAction] = useState<EventAction | undefined>(undefined);
  const [fieldPath, setFieldPath] = useState<string>("");
  const [createdAtRange, setCreatedAtRange] = useState<[any, any] | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await eventsService.list({
        limit: pageSize,
        offset,
        query: query || undefined,
        scope,
        targetType,
        action,
        fieldPath: fieldPath || undefined,
        createdAtFrom: createdAtRange?.[0]?.toISOString?.(),
        createdAtTo: createdAtRange?.[1]?.toISOString?.(),
      });
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageSize, offset, query, scope, targetType, action, fieldPath, createdAtRange]);

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

  const columns: ColumnsType<AppEvent> = useMemo(
    () => [
      {
        title: "When",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v: string) => new Date(v).toLocaleString(),
        sorter: (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      },
      {
        title: "Scope",
        dataIndex: "scope",
        key: "scope",
        width: 110,
        render: (v: AppEvent["scope"]) => <Tag color={scopeColor[v]}>{v}</Tag>,
      },
      {
        title: "Action",
        dataIndex: "action",
        key: "action",
        width: 110,
        render: (v: AppEvent["action"]) => <Tag color={actionColor[v]}>{v}</Tag>,
      },
      {
        title: "Target",
        key: "target",
        width: 260,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.targetType}</Text>
            <Text type="secondary">{record.targetId}</Text>
          </Space>
        ),
      },
      {
        title: "Field",
        key: "field",
        width: 220,
        render: (_, record) => {
          if (record.scope !== "field") return <Text type="secondary">-</Text>;
          return (
            <Space direction="vertical" size={0}>
              <Text strong>{record.fieldPath}</Text>
              <Text type="secondary">
                {String(record.from ?? "-")} → {String(record.to ?? "-")}
              </Text>
            </Space>
          );
        },
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (v: string | undefined, record) => (
          <Space direction="vertical" size={0}>
            <Text>{v || "(no title)"}</Text>
            <Text type="secondary">{record.message || ""}</Text>
          </Space>
        ),
      },
      {
        title: "Actor",
        key: "actor",
        width: 180,
        render: (_, record) => (
          <Text>{record.createdBy?.email ?? record.createdBy?.id ?? "-"}</Text>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 80,
        render: (_, record) => (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/events/edit/${record.id}`)}
          />
        ),
      },
    ],
    [navigate],
  );

  return (
    <div>
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Events
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          Refresh
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%" }}>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title/message/target id"
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={scope}
            onChange={(v) => {
              setScope(v);
              setPage(1);
            }}
            placeholder="Scope"
            style={{ width: 140 }}
            allowClear
            options={[
              { value: "entity", label: "entity" },
              { value: "field", label: "field" },
            ]}
          />

          <Select
            value={targetType}
            onChange={(v) => {
              setTargetType(v);
              setPage(1);
            }}
            placeholder="Target type"
            style={{ width: 160 }}
            allowClear
            options={[
              { value: "plant", label: "plant" },
              { value: "diary", label: "diary" },
            ]}
          />

          <Select
            value={action}
            onChange={(v) => {
              setAction(v);
              setPage(1);
            }}
            placeholder="Action"
            style={{ width: 140 }}
            allowClear
            options={[
              { value: "create", label: "create" },
              { value: "update", label: "update" },
              { value: "delete", label: "delete" },
            ]}
          />

          <Input
            value={fieldPath}
            onChange={(e) => {
              setFieldPath(e.target.value);
              setPage(1);
            }}
            placeholder="Field path (e.g. potSize)"
            style={{ width: 220 }}
            allowClear
            disabled={scope === "entity"}
          />

          <DatePicker.RangePicker
            value={createdAtRange as any}
            onChange={(v) => {
              setCreatedAtRange(v as any);
              setPage(1);
            }}
            showTime
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={pagination}
        />
      </Card>
    </div>
  );
};

export default EventsListPage;
