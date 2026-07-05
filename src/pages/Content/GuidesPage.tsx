import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { TablePaginationConfig } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { contentService } from "@/services/content";
import {
  CROP_KIND_OPTIONS,
  cropKindLabel,
  type CropGuide,
  type CropKind,
} from "@/types/content";

const { Title, Text } = Typography;

const GuidesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CropGuide[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cropKind, setCropKind] = useState<CropKind | "ALL">("ALL");

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await contentService.listGuides({
          limit: pageSize,
          offset,
          cropKind: cropKind === "ALL" ? undefined : cropKind,
        });
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
      } catch (error) {
        if (cancelled) return;
        message.error(error instanceof Error ? error.message : "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [cropKind, offset, pageSize]);

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: (nextPage, nextSize) => {
      setPage(nextPage);
      if (nextSize && nextSize !== pageSize) {
        setPageSize(nextSize);
        setPage(1);
      }
    },
  };

  const tabItems = [
    { key: "ALL", label: "Все" },
    ...CROP_KIND_OPTIONS.map(option => ({
      key: option.value,
      label: option.label,
    })),
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Руководства
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/content/guides/create")}
        >
          Создать
        </Button>
      </Space>
      <Text type="secondary">
        Контент публичного сайта. Редактирование доступно роли ADMIN.
      </Text>
      <Tabs
        activeKey={cropKind}
        items={tabItems}
        onChange={key => {
          setCropKind(key as CropKind | "ALL");
          setPage(1);
        }}
      />
      <Table<CropGuide>
        rowKey="id"
        loading={loading}
        pagination={pagination}
        dataSource={rows}
        onRow={record => ({
          onClick: () => navigate(`/content/guides/edit/${record.id}`),
          style: { cursor: "pointer" },
        })}
        columns={[
          { title: "Культура", dataIndex: "cropKind", render: cropKindLabel },
          { title: "Заголовок", dataIndex: "title" },
          { title: "Slug", dataIndex: "slug" },
          {
            title: "Статус",
            dataIndex: "status",
            render: status => (
              <Tag color={status === "PUBLISHED" ? "green" : "default"}>{status}</Tag>
            ),
          },
          {
            title: "Telegram",
            dataIndex: "telegramPublishedAt",
            width: 110,
            render: (value: string | null | undefined) =>
              value ? (
                <Tag color="blue">TG</Tag>
              ) : (
                <Text type="secondary">—</Text>
              ),
          },
          { title: "Порядок", dataIndex: "sortOrder", width: 90 },
        ]}
      />
    </Space>
  );
};

export default GuidesPage;
