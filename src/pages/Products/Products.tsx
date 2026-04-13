import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Space, Typography } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { ProductsTablePresentation } from "@/components/Products";
import type { Product } from "@/types/product";
import { productsService } from "@/services/products";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title } = Typography;

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const canManageProducts = useAuthRole("admin");
  const [products, setProducts] = useState<Product[]>([]);
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
        const result = await productsService.list({
          limit: pageSize,
          offset,
          query: searchValue || undefined,
        });

        if (cancelled) return;
        setProducts(result.items);
        setTotal(result.total);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Не удалось загрузить продукты";
        message.error(msg);
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

  const handleTableChange: TableProps<Product>["onChange"] = (nextPagination) => {
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
          Продукты
        </Title>
        {canManageProducts ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/products/create")}
          >
            Создать продукт
          </Button>
        ) : null}
      </Space>
      <ProductsTablePresentation
        products={products}
        searchPlaceholder="Поиск по названию..."
        searchValue={searchValue}
        onSearchChange={(v) => {
          setSearchValue(v);
          setPage(1);
        }}
        loading={isLoading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onEditRow={
          canManageProducts ? (p) => navigate(`/products/edit/${p.id}`) : undefined
        }
      />
    </Space>
  );
};

export default ProductsPage;
