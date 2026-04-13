import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig, TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

import { useAuthRole } from "@/contexts/AuthContext";
import {
  adminUsersService,
  type AdminUserRow,
} from "@/services/adminUsers";

const { Title } = Typography;

const UsersListPage: React.FC = () => {
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columns: ColumnsType<AdminUserRow> = useMemo(
    () => [
      { title: "Username", dataIndex: "username", key: "username" },
      { title: "Email", dataIndex: "email", key: "email" },
      { title: "Role", dataIndex: "role", key: "role", width: 100 },
      {
        title: "Created",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 200,
        render: (v: string) => new Date(v).toLocaleString(),
      },
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await adminUsersService.list({
          page,
          pageSize,
          search: searchValue || undefined,
        });
        if (cancelled) return;
        setUsers(result.items);
        setTotal(result.total);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Не удалось загрузить пользователей";
        message.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, searchValue]);

  const pagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      showTotal: (t, range) => `${range[0]}-${range[1]} из ${t}`,
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

  const onTableChange: TableProps<AdminUserRow>["onChange"] = (
    nextPagination,
  ) => {
    if (!nextPagination) return;
    if (typeof nextPagination.current === "number") {
      setPage(nextPagination.current);
    }
    if (typeof nextPagination.pageSize === "number") {
      setPageSize(nextPagination.pageSize);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">
          Список пользователей доступен только администраторам.
        </Typography.Text>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Пользователи
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/users/create")}
        >
          Создать пользователя
        </Button>
      </Space>
      <Input
        allowClear
        placeholder="Поиск по email или username"
        prefix={<SearchOutlined />}
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setPage(1);
        }}
        style={{ maxWidth: 360 }}
      />
      <Table<AdminUserRow>
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
      />
    </Space>
  );
};

export default UsersListPage;
