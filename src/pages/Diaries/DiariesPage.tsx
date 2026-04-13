import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Space,
  Table,
  Typography,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import {
  diariesService,
  type DiaryListItem,
} from "@/services/diaries";

const { Title, Text } = Typography;

function previewBody(body: string, maxLen = 80): string {
  if (!body?.trim()) return "—";
  const t = body.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function plantsLabel(plants: DiaryListItem["plants"]): string {
  if (!plants?.length) return "—";
  return plants.map((p) => p.name).join(", ");
}

const DiariesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DiaryListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await diariesService.list({ limit: 500, offset: 0 });
      setRows(items);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось загрузить дневники";
      message.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await diariesService.delete(id);
        message.success("Дневник удалён");
        await load();
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Не удалось удалить дневник";
        message.error(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  const columns: ColumnsType<DiaryListItem> = useMemo(
    () => [
      {
        title: "Заголовок",
        dataIndex: "title",
        key: "title",
        width: 200,
        ellipsis: true,
        render: (t: string | null | undefined) => t?.trim() || "—",
      },
      {
        title: "Текст",
        key: "body",
        ellipsis: true,
        render: (_, r) => (
          <Text type="secondary" ellipsis title={r.body}>
            {previewBody(r.body)}
          </Text>
        ),
      },
      {
        title: "Растения",
        key: "plants",
        width: 180,
        ellipsis: true,
        render: (_, r) => (
          <Text type="secondary" ellipsis title={plantsLabel(r.plants)}>
            {plantsLabel(r.plants)}
          </Text>
        ),
      },
      {
        title: "Обновлено",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 180,
        render: (v: string) => new Date(v).toLocaleString(),
      },
      {
        title: "",
        key: "actions",
        width: 96,
        align: "right",
        render: (_, record) => (
          <Space size={0} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Редактировать">
              <Button
                type="text"
                aria-label="Редактировать"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/diaries/edit/${encodeURIComponent(record.id)}`)
                }
              />
            </Tooltip>
            <Popconfirm
              title="Удалить дневник?"
              description="Действие необратимо."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{
                danger: true,
                loading: deletingId === record.id,
              }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                danger
                aria-label="Удалить"
                title="Удалить"
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, deletingId, handleDelete],
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
          Дневники
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/diaries/create")}
        >
          Создать дневник
        </Button>
      </Space>
      <Text type="secondary">
        Список в контексте текущего пользователя (JWT). Доступно ролям{" "}
        <Text code>USER</Text> и <Text code>ADMIN</Text>.
      </Text>
      <Table<DiaryListItem>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={pagedRows}
        pagination={pagination}
      />
    </Space>
  );
};

export default DiariesPage;
