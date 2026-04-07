import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CloseOutlined,
  EditOutlined,
  SaveOutlined,
  CompressOutlined,
  ExpandOutlined,
  FolderAddOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { actionPathRegistryService } from "@/services/actionPathRegistry";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Title, Text } = Typography;

const DragHandle: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  return (
    <MenuOutlined
      style={{ cursor: disabled ? "not-allowed" : "grab", color: "#999" }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
};

const SortableRow: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string }
> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : null),
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

function getFilterFromActionPath(actionPath: string): string {
  const parts = String(actionPath ?? "")
    .split(".")
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

const ActionPathRegistryPage: React.FC = () => {
  const navigate = useNavigate();

  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupForm] = Form.useForm<{
    path: string;
    description?: string;
  }>();

  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupForm] = Form.useForm<{
    path: string;
    description?: string;
  }>();

  const [groups, setGroups] = useState<
    Array<{
      id: string;
      path: string;
      description?: string | null;
      order: number;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [items, setItems] = useState<
    Array<{
      id: string;
      actionPath: string;
      description?: string | null;
      targetType: string;
      mapping: Record<string, unknown>;
      groupId?: string | null;
      position: number;
      group?: {
        id: string;
        path: string;
        description?: string | null;
      } | null;
      tagId?: string | null;
      tag?: {
        id: string;
        label: string;
        color?: string | null;
      } | null;
      conditions?: Array<{
        field: string;
        operator: "lt" | "gt" | "eq" | "lte" | "gte";
        value: string;
        tagId: string;
      }> | null;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editMode, setEditMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  type DraftGroup = {
    key: string;
    kind: "group";
    groupId: string;
    path: string;
    description?: string | null;
    children: DraftItem[];
  };

  type DraftUngrouped = {
    key: string;
    kind: "ungrouped";
    children: DraftItem[];
  };

  type DraftItem = {
    key: string;
    kind: "item";
    id: string;
    groupId?: string | null;
    actionPath: string;
    filter: string;
    description?: string | null;
    targetType: string;
    mapping: Record<string, unknown>;
    tagId?: string | null;
    tag?: (typeof items)[number]["tag"];
    conditions?: (typeof items)[number]["conditions"];
    createdAt: string;
    updatedAt: string;
  };

  type DraftRow = DraftGroup | DraftUngrouped | DraftItem;

  const [draftGroups, setDraftGroups] = useState<DraftRow[] | null>(null);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const [groupsResp, resp] = await Promise.all([
        actionPathRegistryService.listGroups(),
        actionPathRegistryService.list({
          limit: pageSize,
          offset,
          targetType: targetTypeFilter,
        }),
      ]);
      setGroups(groupsResp);
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageSize, offset, targetTypeFilter]);

  const groupedData = useMemo(() => {
    if (editMode && draftGroups) return draftGroups;

    const byGroupId = new Map<string, DraftItem[]>();
    const ungrouped: DraftItem[] = [];

    for (const it of items) {
      const filter = getFilterFromActionPath(it.actionPath);
      const row: DraftItem = {
        key: it.id,
        kind: "item",
        id: it.id,
        groupId: it.groupId ?? null,
        actionPath: it.actionPath,
        filter,
        description: it.description,
        targetType: it.targetType,
        mapping: it.mapping,
        tagId: it.tagId,
        tag: it.tag,
        conditions: it.conditions,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
      };

      if (!it.groupId) {
        ungrouped.push(row);
        continue;
      }
      byGroupId.set(it.groupId, [...(byGroupId.get(it.groupId) ?? []), row]);
    }

    const groupById = new Map(groups.map((g) => [g.id, g] as const));

    const groupRows: DraftGroup[] = groups
      .map((g): DraftGroup => {
        const children = (byGroupId.get(g.id) ?? []).slice();
        children.sort((a, b) => a.filter.localeCompare(b.filter));
        return {
          key: `group:${g.id}`,
          kind: "group" as const,
          groupId: g.id,
          path: g.path,
          description: g.description ?? "",
          children,
        };
      })
      .sort((a, b) => {
        const ga = groups.find((g) => g.id === a.groupId);
        const gb = groups.find((g) => g.id === b.groupId);
        const oa = ga?.order ?? 0;
        const ob = gb?.order ?? 0;
        if (oa !== ob) return oa - ob;
        return a.path.localeCompare(b.path);
      });

    // Groups not present in groups list (edge case) -> place before ungrouped.
    const unknownGroupIds = Array.from(byGroupId.keys()).filter(
      (id) => !groupById.has(id),
    );
    const unknownGroups: DraftGroup[] = unknownGroupIds
      .map((id): DraftGroup => {
        const children = (byGroupId.get(id) ?? []).slice();
        children.sort((a, b) => a.filter.localeCompare(b.filter));
        return {
          key: `group:${id}`,
          kind: "group" as const,
          groupId: id,
          path: `unknown:${id}`,
          description: "",
          children,
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));

    const ungroupedRow: DraftUngrouped = {
      key: "ungrouped",
      kind: "ungrouped" as const,
      children: ungrouped.sort((a, b) => a.filter.localeCompare(b.filter)),
    };

    return [...groupRows, ...unknownGroups, ungroupedRow];
  }, [draftGroups, editMode, groups, items]);

  const groupRowKeys = useMemo(
    () =>
      groupedData
        .filter((r) => r.kind === "group" || r.kind === "ungrouped")
        .map((g) => g.key),
    [groupedData],
  );

  const groupOptions = useMemo(() => {
    const opts = groups
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((g) => ({ value: g.id, label: g.path }));
    return [{ value: "__none__", label: "(no group)" }, ...opts];
  }, [groups]);

  const startEdit = () => {
    setDraftGroups(groupedData);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setDraftGroups(null);
  };

  const openCreateGroupModal = () => {
    createGroupForm.resetFields();
    setCreateGroupModalOpen(true);
  };

  const closeCreateGroupModal = () => {
    setCreateGroupModalOpen(false);
  };

  const openEditGroupModal = (params: {
    id: string;
    path: string;
    description?: string | null;
  }) => {
    editGroupForm.setFieldsValue({
      path: params.path,
      description: params.description ?? "",
    });
    setEditGroupId(params.id);
    setEditGroupModalOpen(true);
  };

  const closeEditGroupModal = () => {
    setEditGroupModalOpen(false);
    setEditGroupId(null);
  };

  const submitEditGroup = async () => {
    if (!editGroupId) return;
    try {
      const values = await editGroupForm.validateFields();
      setEditGroupLoading(true);
      await actionPathRegistryService.updateGroup({
        id: editGroupId,
        path: values.path,
        description: values.description,
      });
      message.success("Group updated");
      closeEditGroupModal();
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message ?? "Failed to update group");
    } finally {
      setEditGroupLoading(false);
    }
  };

  const submitCreateGroup = async () => {
    try {
      const values = await createGroupForm.validateFields();
      setCreateGroupLoading(true);
      await actionPathRegistryService.createGroup({
        path: values.path,
        description: values.description,
      });
      message.success("Group created");
      setCreateGroupModalOpen(false);
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message ?? "Failed to create group");
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const onDragEndGroups = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraftGroups((prev) => {
      if (!prev) return prev;

      const activeKey = String(active.id);
      const overKey = String(over.id);

      const activeIdx = prev.findIndex(
        (r) => r.key === activeKey && r.kind === "group",
      );
      const overIdx = prev.findIndex(
        (r) => r.key === overKey && r.kind === "group",
      );
      if (activeIdx < 0 || overIdx < 0) return prev;

      return arrayMove(prev, activeIdx, overIdx);
    });
  };

  const onDragEndItems = (parentKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraftGroups((prev) => {
      if (!prev) return prev;

      const next = prev.map((r) => {
        if (r.kind !== "group" && r.kind !== "ungrouped") return r;
        if (r.key !== parentKey) return r;

        const activeId = String(active.id);
        const overId = String(over.id);
        const oldIndex = r.children.findIndex((c) => c.id === activeId);
        const newIndex = r.children.findIndex((c) => c.id === overId);
        if (oldIndex < 0 || newIndex < 0) return r;

        return { ...r, children: arrayMove(r.children, oldIndex, newIndex) };
      });

      return next;
    });
  };

  const setItemGroup = (itemId: string, nextGroupIdRaw: string) => {
    const nextGroupId = nextGroupIdRaw === "__none__" ? null : nextGroupIdRaw;

    setDraftGroups((prev) => {
      if (!prev) return prev;

      let picked: DraftItem | null = null;
      const cleaned = prev.map((r) => {
        if (r.kind !== "group" && r.kind !== "ungrouped") return r;
        const children = r.children.filter((c) => {
          if (c.id !== itemId) return true;
          picked = { ...c, groupId: nextGroupId };
          return false;
        });
        return { ...r, children };
      });

      if (!picked) return prev;

      // insert to target group
      const inserted = cleaned.map((r) => {
        if (nextGroupId) {
          if (r.kind !== "group") return r;
          if (r.groupId !== nextGroupId) return r;
          return { ...r, children: [...r.children, picked!] };
        }
        if (r.kind !== "ungrouped") return r;
        return { ...r, children: [...r.children, picked!] };
      });

      return inserted;
    });
  };

  const saveOrder = async () => {
    if (!draftGroups) return;

    setSavingOrder(true);
    try {
      const groupInput: Array<{ id: string; order: number }> = [];
      const input: Array<{
        id: string;
        groupId?: string | null;
        position: number;
      }> = [];

      for (const r of draftGroups) {
        if (r.kind !== "group" && r.kind !== "ungrouped") continue;
        if (r.kind === "group") {
          groupInput.push({ id: r.groupId, order: groupInput.length });
        }
        for (let i = 0; i < r.children.length; i += 1) {
          const c = r.children[i];
          input.push({
            id: c.id,
            groupId: r.kind === "group" ? r.groupId : null,
            position: i,
          });
        }
      }

      const groupsOk =
        await actionPathRegistryService.updateGroupsOrder(groupInput);
      if (!groupsOk) {
        message.error("Failed to save group order");
        return;
      }

      const ok = await actionPathRegistryService.updateOrder(input);
      if (ok) {
        message.success("Order saved");
        setEditMode(false);
        setDraftGroups(null);
        await load();
      } else {
        message.error("Failed to save order");
      }
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  const columns: ColumnsType<DraftRow> = useMemo(
    () => [
      {
        title: "",
        key: "sort",
        width: 36,
        className: "drag-visible",
        render: (_v, record) => {
          if (!editMode) return null;
          if (record.kind !== "group") return null;
          return <DragHandle />;
        },
      },
      {
        title: "",
        key: "expanderPlaceholder",
        width: 28,
        render: () => null,
      },
      {
        title: "Group / Filter",
        key: "groupOrFilter",
        render: (_v, record) => {
          if (record.kind === "group") {
            return <Text code>{record.path}</Text>;
          }
          if (record.kind === "ungrouped") {
            return <Text type="secondary">(no group)</Text>;
          }
          return <Text>{record.filter}</Text>;
        },
      },
      {
        title: "Description",
        key: "description",
        render: (_v, record) => {
          if (record.kind === "group") {
            return record.description ? (
              <Text>{record.description}</Text>
            ) : (
              <Text type="secondary">-</Text>
            );
          }
          if (record.kind === "ungrouped") {
            return <Text type="secondary">-</Text>;
          }
          return record.description ? (
            <Text>{record.description}</Text>
          ) : (
            <Text type="secondary">-</Text>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 90,
        render: (_v, record) => {
          if (record.kind !== "group") {
            return <Text type="secondary">-</Text>;
          }

          return (
            <Button
              type="link"
              icon={<EditOutlined />}
              aria-label="Edit group"
              disabled={editMode}
              onClick={() =>
                openEditGroupModal({
                  id: record.groupId,
                  path: record.path,
                  description: record.description,
                })
              }
            />
          );
        },
      },
    ],
    [editMode],
  );

  const itemColumns: ColumnsType<DraftItem> = useMemo(
    () => [
      {
        title: "",
        key: "sort",
        width: 36,
        render: () => (editMode ? <DragHandle /> : null),
      },
      {
        title: "Filter",
        key: "filter",
        render: (_v, record) => <Text>{record.filter}</Text>,
      },
      {
        title: "Description",
        key: "description",
        render: (_v, record) =>
          record.description ? (
            <Text>{record.description}</Text>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "Target type",
        key: "targetType",
        width: 160,
        render: (_v, record) => {
          const color = record.targetType === "Plant" ? "green" : "default";
          return <Tag color={color}>{record.targetType}</Tag>;
        },
      },
      {
        title: "Updated",
        key: "updatedAt",
        width: 180,
        render: (_v, record) => new Date(record.updatedAt).toLocaleString(),
      },
      {
        title: "",
        key: "edit",
        width: 64,
        render: (_v, record) => {
          return (
            <Space>
              {editMode ? (
                <Select
                  size="small"
                  value={record.groupId ?? "__none__"}
                  options={groupOptions}
                  style={{ width: 160 }}
                  onChange={(v) => setItemGroup(record.id, v)}
                />
              ) : null}
              <Button
                type="link"
                icon={<EditOutlined />}
                aria-label="Edit"
                onClick={() =>
                  navigate(
                    `/registry/edit/${encodeURIComponent(record.actionPath)}`,
                    {
                      state: {
                        item: {
                          actionPath: record.actionPath,
                          description: record.description ?? "",
                          targetType: record.targetType,
                          mapping: record.mapping,
                          conditions: record.conditions ?? null,
                          tagId: record.tagId ?? null,
                        },
                      },
                    },
                  )
                }
              />
            </Space>
          );
        },
      },
    ],
    [editMode, groupOptions, navigate],
  );

  return (
    <div>
      <Title level={2} style={{ margin: 0, marginBottom: 16 }}>
        Action Path Registry - Total: {total}
      </Title>

      <Divider style={{ marginTop: 0, marginBottom: 16 }} />

      <Space wrap style={{ width: "100%", marginBottom: 12 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => load()}
          loading={loading}
        >
          Refresh
        </Button>
        <Button
          type="primary"
          onClick={openCreateGroupModal}
          disabled={editMode || loading}
          style={{ background: "#52c41a", borderColor: "#52c41a" }}
          icon={<FolderAddOutlined />}
        >
          Add Group
        </Button>
        <Button
          type="primary"
          onClick={() => navigate("/registry/new")}
          icon={<PlusOutlined />}
        >
          Create Registry
        </Button>
      </Space>

      <Space wrap style={{ width: "100%", marginBottom: 16 }}>
        <Select
          value={targetTypeFilter}
          onChange={(v) => {
            setTargetTypeFilter(v);
            setPage(1);
          }}
          allowClear
          placeholder="Filter by target type"
          style={{ width: 220 }}
          options={[{ value: "Plant", label: "Plant" }]}
        />

        <Button
          onClick={() => setExpandedRowKeys(groupRowKeys)}
          disabled={!groupRowKeys.length}
          icon={<ExpandOutlined />}
        >
          Expand All
        </Button>
        <Button
          onClick={() => setExpandedRowKeys([])}
          icon={<CompressOutlined />}
        >
          Collapse All
        </Button>

        <Button
          type={editMode ? "primary" : "default"}
          onClick={editMode ? saveOrder : startEdit}
          disabled={loading || total === 0}
          loading={editMode ? savingOrder : false}
          icon={editMode ? <SaveOutlined /> : <EditOutlined />}
        >
          {editMode ? "Save Order" : "Change Order"}
        </Button>
        {editMode ? (
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={cancelEdit}
            disabled={savingOrder}
            aria-label="Discard"
          />
        ) : null}
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEndGroups}
        >
          <SortableContext
            items={
              editMode && draftGroups
                ? draftGroups
                    .filter((r) => r.kind === "group")
                    .map((r) => r.key)
                : []
            }
            strategy={verticalListSortingStrategy}
          >
            <Table
              rowKey="key"
              loading={loading}
              dataSource={groupedData}
              columns={columns}
              components={editMode ? { body: { row: SortableRow } } : undefined}
              expandable={{
                childrenColumnName: "__children_disabled__",
                expandedRowKeys,
                onExpandedRowsChange: (keys) =>
                  setExpandedRowKeys([...(keys as React.Key[])]),
                rowExpandable: (record) =>
                  record.kind === "group" || record.kind === "ungrouped",
                expandedRowRender: (record) => {
                  if (record.kind !== "group" && record.kind !== "ungrouped") {
                    return null;
                  }

                  const children = record.children;
                  if (
                    record.kind === "group" &&
                    record.path === "common" &&
                    children.length === 0
                  ) {
                    return (
                      <div style={{ padding: 16 }}>
                        <Empty description="В группе common ещё нет фильтров" />
                      </div>
                    );
                  }
                  const ids = children.map((c) => c.id);

                  return (
                    <DndContext
                      sensors={sensors}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={onDragEndItems(record.key)}
                    >
                      <SortableContext
                        items={editMode ? ids : []}
                        strategy={verticalListSortingStrategy}
                      >
                        <Table
                          rowKey="id"
                          size="small"
                          pagination={false}
                          dataSource={children}
                          columns={itemColumns}
                          components={
                            editMode
                              ? { body: { row: SortableRow } }
                              : undefined
                          }
                        />
                      </SortableContext>
                    </DndContext>
                  );
                },
              }}
              pagination={
                {
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  onChange: (nextPage, nextSize) => {
                    setPage(nextPage);
                    if (nextSize && nextSize !== pageSize) {
                      setPageSize(nextSize);
                      setPage(1);
                    }
                  },
                } as TablePaginationConfig
              }
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title="Add Group"
        open={createGroupModalOpen}
        onCancel={closeCreateGroupModal}
        onOk={submitCreateGroup}
        confirmLoading={createGroupLoading}
        okText="Create"
      >
        <Form
          form={createGroupForm}
          layout="vertical"
          initialValues={{ path: "", description: "" }}
          onFinish={submitCreateGroup}
        >
          <Form.Item
            label="Path"
            name="path"
            rules={[
              { required: true, message: "Path is required" },
              {
                validator: async (_, value) => {
                  const v = String(value ?? "").trim();
                  if (!v) return;
                  const exists = groups.some(
                    (g) => g.path.toLowerCase() === v.toLowerCase(),
                  );
                  if (exists) {
                    throw new Error("Group with this path already exists");
                  }
                },
              },
            ]}
          >
            <Input placeholder="e.g. plant.watering" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Optional" rows={3} />
          </Form.Item>

          <Button htmlType="submit" style={{ display: "none" }} />
        </Form>
      </Modal>

      <Modal
        title="Edit Group"
        open={editGroupModalOpen}
        onCancel={closeEditGroupModal}
        onOk={submitEditGroup}
        confirmLoading={editGroupLoading}
        okText="Save"
      >
        <Form
          form={editGroupForm}
          layout="vertical"
          initialValues={{ path: "", description: "" }}
          onFinish={submitEditGroup}
        >
          <Form.Item
            label="Path"
            name="path"
            rules={[{ required: true, message: "Path is required" }]}
          >
            <Input placeholder="e.g. plant.watering" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Optional" rows={3} />
          </Form.Item>

          <Button htmlType="submit" style={{ display: "none" }} />
        </Form>
      </Modal>
    </div>
  );
};

export default ActionPathRegistryPage;
