import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Space, Spin, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";

import { locationsService } from "@/services/locations";
import type { AdminLocation } from "@/types/location";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title, Text } = Typography;

const LocationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminLocation[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await locationsService.list({ limit: 500, offset: 0 });
      setRows(items);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось загрузить локации";
      message.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  const columns: ColumnsType<AdminLocation> = [
    { title: "ID", dataIndex: "id", key: "id", width: 280, ellipsis: true },
    { title: "Пользователь", dataIndex: "userId", key: "userId", width: 200 },
    { title: "Название", dataIndex: "name", key: "name" },
    { title: "Статус", dataIndex: "status", key: "status", width: 110 },
    { title: "Тип", dataIndex: "type", key: "type", width: 120 },
    { title: "Подтип", dataIndex: "subType", key: "subType", width: 160 },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Link to={`/locations/update/${record.id}`}>Обновить</Link>
      ),
    },
  ];

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Text type="secondary">
          Раздел локаций в админке доступен только администраторам.
        </Text>
        <Button type="link" onClick={() => navigate("/")}>
          На главную
        </Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Локации
      </Title>
      <Text type="secondary">
        Сейчас API возвращает локации в контексте текущего JWT (как в основном
        приложении). Полный кросс-пользовательский список — после{" "}
        <Text code>BK-LOC-3</Text>.
      </Text>
      {loading ? (
        <Spin />
      ) : (
        <Table<AdminLocation>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 25, showSizeChanger: true }}
        />
      )}
    </Space>
  );
};

export default LocationsListPage;
