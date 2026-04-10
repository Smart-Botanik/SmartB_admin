import React from "react";
import { Button, Image, Tag } from "antd";
import type { TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";

import type { Brand } from "@/types/brand";
import {
  EntityTablePresentation,
  type EntityTablePresentationProps,
} from "@/components/shared/EntityTable";

export interface BrandsTablePresentationProps
  extends Omit<
    EntityTablePresentationProps<Brand>,
    "columns" | "rowKey" | "dataSource"
  > {
  brands: Brand[];
  /** Кнопка «Редактировать» в последней колонке (например переход в `/brands/edit/:id`). */
  onEditRow?: (brand: Brand) => void;
}

export const BrandsTablePresentation: React.FC<BrandsTablePresentationProps> = ({
  brands,
  onEditRow,
  ...props
}) => {
  const columns: TableProps<Brand>["columns"] = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 90,
      render: (avatar: Brand["avatar"]) => {
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
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
      render: (category: string) => <Tag>{category}</Tag>,
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
            render: (_: unknown, record: Brand) => (
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label="Редактировать бренд"
                onClick={() => onEditRow(record)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <EntityTablePresentation<Brand>
      {...props}
      dataSource={brands}
      columns={columns}
      rowKey={(record) => record.id}
    />
  );
};
