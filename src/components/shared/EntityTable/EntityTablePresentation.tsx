import React from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table, Typography } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";

const { Title } = Typography;

export interface EntityTableHeaderProps {
  /** Если пусто — заголовок таблицы не рендерится (внешний заголовок страницы). */
  title?: string | null;
  searchPlaceholder?: string;
  searchValue?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  headerExtra?: React.ReactNode;
  filters?: React.ReactNode;
}

export interface EntityTablePresentationProps<T extends object>
  extends EntityTableHeaderProps {
  dataSource: T[];
  columns: TableProps<T>["columns"];
  rowKey: TableProps<T>["rowKey"];
  loading?: boolean;
  pagination?: false | TablePaginationConfig;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onBackClick?: () => void;
  onTableChange?: TableProps<T>["onChange"];
}

export const EntityTablePresentation = <T extends object>({
  title,
  searchPlaceholder = "Search...",
  searchValue,
  showBackButton = false,
  backButtonText = "Back",
  headerExtra,
  filters,
  dataSource,
  columns,
  rowKey,
  loading,
  pagination,
  onSearchChange,
  onSearchSubmit,
  onBackClick,
  onTableChange,
}: EntityTablePresentationProps<T>) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 280, flex: 1 }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space align="center" size={12} wrap>
              {showBackButton && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={onBackClick}
                  type="default"
                >
                  {backButtonText}
                </Button>
              )}
              {title ? (
                <Title level={2} style={{ margin: 0 }}>
                  {title}
                </Title>
              ) : null}
            </Space>

            {(onSearchChange || onSearchSubmit) && (
              <Input.Search
                allowClear
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onSearch={(value) => onSearchSubmit?.(value)}
              />
            )}

            {filters}
          </Space>
        </div>

        {headerExtra && <div>{headerExtra}</div>}
      </div>

      <Table<T>
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
      />
    </div>
  );
};
