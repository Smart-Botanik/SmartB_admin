import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Space, Typography } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { BrandsTablePresentation } from "@/components/Brands";
import type { Brand } from "@/types/brand";
import { brandsService } from "@/services/brands";

const { Title } = Typography;

const BrandsPage: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await brandsService.list({
          limit: pageSize,
          offset,
          query: searchValue || undefined,
        });

        if (cancelled) return;
        setBrands(result.items);
        setTotal(result.total);
      } catch (e: any) {
        if (cancelled) return;
        message.error(e?.message ?? "Failed to load brands");
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [offset, pageSize, searchValue]);

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

  const handleTableChange: TableProps<Brand>["onChange"] = (nextPagination) => {
    if (!nextPagination) return;
    if (typeof nextPagination.current === "number") {
      setPage(nextPagination.current);
    }
    if (typeof nextPagination.pageSize === "number") {
      setPageSize(nextPagination.pageSize);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Бренды
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/brands/create")}
        >
          Создать бренд
        </Button>
      </Space>
      <BrandsTablePresentation
        brands={brands}
        searchPlaceholder="Search brands..."
        searchValue={searchValue}
        onSearchChange={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        loading={isLoading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onEditRow={(b) => navigate(`/brands/edit/${b.id}`)}
      />
    </Space>
  );
};

export default BrandsPage;
