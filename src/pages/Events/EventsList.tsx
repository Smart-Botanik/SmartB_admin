import React, { useEffect, useMemo, useState } from "react";
import {
  AutoComplete,
  Button,
  Card,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  actionPathEventsService,
  type ActionPathEvent,
} from "@/services/actionPathEvents";
import { actionPathRegistryService } from "@/services/actionPathRegistry";

const { Title, Text } = Typography;

const EventsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<ActionPathEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [targetType, setTargetType] = useState<string | undefined>("Plant");
  const [targetId, setTargetId] = useState<string>("");
  const [actionPath, setActionPath] = useState<string>("");
  const [isSystem, setIsSystem] = useState<boolean | undefined>(undefined);
  const [actionPathOptionsLoading, setActionPathOptionsLoading] =
    useState(false);
  const [actionPathOptions, setActionPathOptions] = useState<
    Array<{ value: string }>
  >([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await actionPathEventsService.list({
        limit: pageSize,
        offset,
        targetType,
        targetId: targetId || undefined,
        actionPath: actionPath || undefined,
        isSystem,
      });
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadActionPathOptions = async () => {
    setActionPathOptionsLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: 200,
        offset: 0,
        targetType: targetType,
      });
      const options = resp.items
        .map((r) => r.actionPath)
        .filter((v): v is string => Boolean(v))
        .sort()
        .map((v) => ({ value: v }));
      setActionPathOptions(options);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load action paths");
    } finally {
      setActionPathOptionsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageSize, offset, targetType, targetId, actionPath, isSystem]);

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

  const columns: ColumnsType<ActionPathEvent> = useMemo(
    () => [
      {
        title: "When",
        dataIndex: "timestamp",
        key: "timestamp",
        width: 180,
        render: (v: string) => new Date(v).toLocaleString(),
        sorter: (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      },
      {
        title: "Action path",
        dataIndex: "actionPath",
        key: "actionPath",
        width: 260,
        render: (v: string) => <Text code>{v}</Text>,
      },
      {
        title: "Target",
        key: "target",
        width: 300,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Space>
              <Tag color={record.targetType === "Plant" ? "green" : "default"}>
                {record.targetType}
              </Tag>
              {record.isSystem ? <Tag color="gold">system</Tag> : null}
            </Space>
            <Text type="secondary">{record.targetId}</Text>
          </Space>
        ),
      },
      {
        title: "Payload",
        dataIndex: "payload",
        key: "payload",
        render: (v: unknown) => (
          <pre
            style={{
              margin: 0,
              maxWidth: 520,
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {JSON.stringify(v, null, 2)}
          </pre>
        ),
      },
    ],
    [],
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
          Events
        </Title>
        <Space>
          <Button onClick={() => navigate("/events/create-plant")}>
            Create Plant Event
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            Refresh
          </Button>
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%" }}>
          <Select
            value={targetType}
            onChange={(v) => {
              setTargetType(v);
              setPage(1);
              setActionPathOptions([]);
            }}
            placeholder="Target type"
            style={{ width: 160 }}
            allowClear
            options={[{ value: "Plant", label: "Plant" }]}
          />

          <Input
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              setPage(1);
            }}
            placeholder="Target id (plantId)"
            style={{ width: 320 }}
            allowClear
          />

          <AutoComplete
            value={actionPath}
            options={actionPathOptions}
            style={{ width: 300 }}
            placeholder="Action path"
            allowClear
            onFocus={() => {
              if (!actionPathOptions.length && !actionPathOptionsLoading) {
                void loadActionPathOptions();
              }
            }}
            onChange={(v) => {
              setActionPath(v);
              setPage(1);
            }}
            filterOption={(inputValue, option) =>
              String(option?.value ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
          />

          <Select
            value={isSystem}
            onChange={(v) => {
              setIsSystem(v);
              setPage(1);
            }}
            placeholder="System"
            style={{ width: 140 }}
            allowClear
            options={[
              { value: true, label: "system" },
              { value: false, label: "user" },
            ]}
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
