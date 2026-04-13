import React from "react";
import { Button, Image, Tag } from "antd";
import type { TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";

import type { Product } from "@/types/product";
import { getProductCategoryLabel } from "@/types/product";
import {
  EntityTablePresentation,
  type EntityTablePresentationProps,
} from "@/components/shared/EntityTable";

export interface ProductsTablePresentationProps
  extends Omit<
    EntityTablePresentationProps<Product>,
    "columns" | "rowKey" | "dataSource"
  > {
  products: Product[];
  /** Кнопка «Редактировать» — только для ролей с правом редактирования (например ADMIN). */
  onEditRow?: (product: Product) => void;
}

export const ProductsTablePresentation: React.FC<ProductsTablePresentationProps> = ({
  products,
  onEditRow,
  ...props
}) => {
  const columns: TableProps<Product>["columns"] = [
    {
      title: "Image",
      dataIndex: "avatar",
      key: "avatar",
      width: 90,
      render: (avatar: Product["avatar"]) => {
        const url = avatar?.url;
        if (!url) return null;
        return (
          <Image
            width={40}
            height={40}
            src={url}
            preview={false}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (category: string) => (
        <Tag>{getProductCategoryLabel(category)}</Tag>
      ),
    },
    {
      title: "Brand",
      key: "brand",
      sorter: (a, b) => a.brand.name.localeCompare(b.brand.name),
      render: (_: unknown, record: Product) => record.brand.name,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (value?: string) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    ...(onEditRow
      ? [
          {
            title: "",
            key: "actions",
            width: 56,
            align: "center" as const,
            render: (_: unknown, record: Product) => (
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label="Редактировать продукт"
                onClick={() => onEditRow(record)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <EntityTablePresentation<Product>
      {...props}
      dataSource={products}
      columns={columns}
      rowKey={(record) => record.id}
    />
  );
};
