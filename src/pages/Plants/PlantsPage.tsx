import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";

import {
  plantsService,
  type PlantListItem,
} from "@/services/plants";

const { Title, Text } = Typography;

function previewCurrent(current: unknown, maxLen = 72): string {
  if (current === null || current === undefined) return "—";
  try {
    const s = JSON.stringify(current);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}…`;
  } catch {
    return "—";
  }
}

const PlantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PlantListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await plantsService.list({ limit: 500, offset: 0 });
      setRows(items);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось загрузить растения";
      message.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnsType<PlantListItem> = useMemo(
    () => [
      {
        title: "Название",
        dataIndex: "name",
        key: "name",
        ellipsis: true,
      },
      {
        title: "Локация",
        key: "location",
        width: 200,
        ellipsis: true,
        render: (_, r) => r.location?.name ?? "—",
      },
      {
        title: "Текущее состояние",
        key: "current",
        ellipsis: true,
        render: (_, r) => (
          <Text type="secondary" ellipsis title={previewCurrent(r.current, 500)}>
            {previewCurrent(r.current)}
          </Text>
        ),
      },
      {
        title: "Обновлено",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 200,
        render: (v: string) => new Date(v).toLocaleString(),
      },
      {
        title: "",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <Link to={`/plants/edit/${record.id}`}>Редактировать</Link>
        ),
      },
    ],
    [],
  );

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total: rows.length,
    showSizeChanger: true,
    showTotal: (t, range) => `${range[0]}-${range[1]} из ${t}`,
    onChange: (nextPage, nextSize) => {
      setPage(nextPage);
      if (nextSize && nextSize !== pageSize) {
        setPageSize(nextSize);
        setPage(1);
      }
    },
  };

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Растения
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/plants/create")}
        >
          Создать растение
        </Button>
      </Space>
      <Text type="secondary">
        Список в контексте текущего пользователя (JWT). Поле{" "}
        <Text code>current</Text> обновляется событиями растения, не из этой
        формы.
      </Text>
      <Table<PlantListItem>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={pagedRows}
        pagination={pagination}
      />
    </Space>
  );
};

export default PlantsPage;
