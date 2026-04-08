import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import {
  CloseOutlined,
  EditOutlined,
  SaveOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CompressOutlined,
  ExpandOutlined,
  FolderAddOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { actionPathRegistryService } from "@/services/actionPathRegistry";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  type CollisionDetection,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Title } = Typography;

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

const SortableGroupRow: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string }
> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
    data: { type: "group" },
  });

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

const makeSortableItemRow = (containerKey: string) => {
  const SortableItemRow: React.FC<
    React.HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string }
  > = (props) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props["data-row-key"],
      data: { type: "item", containerKey },
    });

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

  return SortableItemRow;
};

const DroppableContainer: React.FC<{
  id: string;
  children: React.ReactNode;
}> = (props) => {
  const { setNodeRef, isOver } = useDroppable({
    id: props.id,
    data: { type: "container", containerKey: props.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={
        isOver
          ? {
              outline: "2px dashed #1677ff",
              borderRadius: 8,
              padding: 8,
            }
          : { padding: 8 }
      }
    >
      {props.children}
    </div>
  );
};

function getFilterFromActionPath(actionPath: string): string {
  const parts = String(actionPath ?? "")
    .split(".")
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

const ActionPathRegistryPage: React.FC = () => {
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupForm] = Form.useForm<{
    path: string;
    description?: string;
  }>();

  const [createRegistryModalOpen, setCreateRegistryModalOpen] = useState(false);
  const [createRegistryLoading, setCreateRegistryLoading] = useState(false);
  const [createRegistryForm] = Form.useForm<{
    actionPath: string;
    targetType: string;
    mappingJson: string;
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
  const [targetTypeFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editMode, setEditMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const collisionDetection: CollisionDetection = (args) => {
    const activeType = (args.active.data.current as any)?.type;

    if (activeType === "group") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => (c.data.current as any)?.type === "group",
        ),
      });
    }

    if (activeType === "item") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => {
          const t = (c.data.current as any)?.type;
          return t === "item" || t === "container";
        }),
      });
    }

    return closestCenter(args);
  };

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
    position: number;
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
        position: it.position,
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
        children.sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.filter.localeCompare(b.filter);
        });
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
        children.sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.filter.localeCompare(b.filter);
        });
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
      children: ungrouped.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.filter.localeCompare(b.filter);
      }),
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

  const openCreateRegistryModal = () => {
    createRegistryForm.resetFields();
    setCreateRegistryModalOpen(true);
  };

  const closeCreateRegistryModal = () => {
    setCreateRegistryModalOpen(false);
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

  const submitCreateRegistry = async () => {
    try {
      const values = await createRegistryForm.validateFields();
      setCreateRegistryLoading(true);
      await actionPathRegistryService.upsert({
        actionPath: values.actionPath,
        targetType: values.targetType,
        mappingJson: values.mappingJson,
        description: values.description,
      });
      message.success("Registry saved");
      closeCreateRegistryModal();
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message ?? "Failed to save registry");
    } finally {
      setCreateRegistryLoading(false);
    }
  };

  const onDragEndGroups = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = (active.data.current as any)?.type;
    const overType = (over.data.current as any)?.type;
    if (activeType !== "group" || overType !== "group") return;

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

  const onDragEndItems = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = (active.data.current as any)?.type;
    if (activeType !== "item") return;

    const sourceContainerKey = String(
      (active.data.current as any)?.containerKey ?? "",
    );
    if (!sourceContainerKey) return;

    const overType = (over.data.current as any)?.type;
    if (overType !== "item" && overType !== "container") return;

    const destinationContainerKey = String(
      (over.data.current as any)?.containerKey ?? "",
    );
    if (!destinationContainerKey) return;

    if (destinationContainerKey !== sourceContainerKey) return;

    setDraftGroups((prev) => {
      if (!prev) return prev;

      const activeId = String(active.id);
      const overId = String(over.id);

      return prev.map((r) => {
        if (r.kind !== "group" && r.kind !== "ungrouped") return r;
        if (r.key !== sourceContainerKey) return r;

        const fromIdx = r.children.findIndex((c) => c.id === activeId);
        if (fromIdx < 0) return r;

        if (overType === "container") {
          // Dropped on container (empty space) -> move to end.
          const next = r.children.slice();
          const [picked] = next.splice(fromIdx, 1);
          next.push(picked);
          return { ...r, children: next };
        }

        const toIdx = r.children.findIndex((c) => c.id === overId);
        if (toIdx < 0) return r;

        return { ...r, children: arrayMove(r.children, fromIdx, toIdx) };
      });
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const activeType = (event.active.data.current as any)?.type;
    if (activeType === "group") {
      onDragEndGroups(event);
      return;
    }
    if (activeType === "item") {
      onDragEndItems(event);
    }
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
          picked = c;
          return false;
        });
        return { ...r, children };
      });

      const pickedItem = picked;
      if (!pickedItem) return prev;

      const pickedNext: DraftItem = {
        ...(pickedItem as DraftItem),
        groupId: nextGroupId,
      };
      const destinationKey = nextGroupId ? `group:${nextGroupId}` : "ungrouped";

      return cleaned.map((r) => {
        if (r.kind !== "group" && r.kind !== "ungrouped") return r;
        if (r.key !== destinationKey) return r;
        return { ...r, children: [...r.children, pickedNext] };
      });
    });
  };

  const saveOrder = async () => {
    if (!draftGroups) return;

    try {
      setSavingOrder(true);

      const groupOrderInput = draftGroups
        .filter((r): r is DraftGroup => r.kind === "group")
        .map((g, idx) => ({ id: g.groupId, order: idx }));

      const itemsOrderInput: Array<{
        id: string;
        groupId?: string | null;
        position: number;
      }> = [];

      for (const row of draftGroups) {
        if (row.kind !== "group" && row.kind !== "ungrouped") continue;
        const groupId = row.kind === "group" ? row.groupId : null;
        row.children.forEach((c, idx) => {
          itemsOrderInput.push({ id: c.id, groupId, position: idx });
        });
      }

      await Promise.all([
        actionPathRegistryService.updateGroupsOrder(groupOrderInput),
        actionPathRegistryService.updateOrder(itemsOrderInput),
      ]);

      message.success("Order saved");
      setEditMode(false);
      setDraftGroups(null);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  const itemColumns: ColumnsType<DraftItem> = [
    {
      title: "",
      width: 32,
      render: () => (editMode ? <DragHandle disabled={false} /> : null),
    },
    {
      title: "Filter",
      dataIndex: "filter",
      key: "filter",
    },
    {
      title: "Action Path",
      dataIndex: "actionPath",
      key: "actionPath",
    },
    {
      title: "Group",
      key: "group",
      render: (_, record) => (
        <span
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Select
            style={{ width: 220 }}
            disabled={!editMode}
            value={record.groupId ?? "__none__"}
            options={groupOptions}
            dropdownStyle={{ zIndex: 2000 }}
            getPopupContainer={(trigger) =>
              (trigger.parentElement as HTMLElement) ?? document.body
            }
            onChange={(v) => setItemGroup(record.id, String(v))}
          />
        </span>
      ),
    },
  ];

  const columns: ColumnsType<DraftRow> = [
    {
      title: "",
      width: 32,
      render: (_, record) =>
        editMode && record.kind === "group" ? (
          <DragHandle disabled={false} />
        ) : null,
    },
    {
      title: "Path",
      key: "path",
      render: (_, record) => {
        if (record.kind === "group") return record.path;
        if (record.kind === "ungrouped") return "(no group)";
        return null;
      },
    },
    {
      title: "Description",
      key: "description",
      render: (_, record) =>
        record.kind === "group" ? record.description : null,
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, record) => {
        if (record.kind !== "group") return null;
        return (
          <Button
            size="small"
            icon={<EditOutlined />}
            aria-label="Edit"
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
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Action Path Registry
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} disabled={loading}>
          Refresh
        </Button>

        <Button
          icon={<FolderAddOutlined />}
          onClick={openCreateGroupModal}
          disabled={loading}
          style={{
            background: "#52c41a",
            borderColor: "#52c41a",
            color: "#fff",
            boxShadow: "none",
          }}
        >
          Add Group
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateRegistryModal}
          disabled={loading}
        >
          Add Registry
        </Button>

        <Button
          icon={<ExpandOutlined />}
          onClick={() => setExpandedRowKeys(groupRowKeys)}
          disabled={loading || groupRowKeys.length === 0}
        >
          Expand All
        </Button>

        <Button
          icon={<CompressOutlined />}
          onClick={() => setExpandedRowKeys([])}
          disabled={loading || expandedRowKeys.length === 0}
        >
          Collapse All
        </Button>

        <Button
          type={editMode ? "primary" : "default"}
          onClick={editMode ? saveOrder : startEdit}
          disabled={
            loading ||
            (!editMode &&
              groupedData.filter(
                (r) => r.kind === "group" || r.kind === "ungrouped",
              ).length === 0)
          }
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
          collisionDetection={collisionDetection}
          onDragEnd={onDragEnd}
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
              components={
                editMode ? { body: { row: SortableGroupRow } } : undefined
              }
              expandable={{
                childrenColumnName: "__children_disabled__",
                expandedRowKeys,
                onExpandedRowsChange: (keys) =>
                  setExpandedRowKeys([...(keys as React.Key[])]),
                expandIcon: ({ expanded, onExpand, record }) => {
                  const Icon = expanded
                    ? CaretDownOutlined
                    : CaretRightOutlined;
                  return (
                    <span
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onExpand(record, e);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <Icon />
                    </span>
                  );
                },
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
                    children.length === 0 &&
                    !editMode
                  ) {
                    return (
                      <div style={{ padding: 16 }}>
                        <Empty description="В группе common ещё нет фильтров" />
                      </div>
                    );
                  }

                  const ids = children.map((c) => c.id);
                  const ItemRow = makeSortableItemRow(record.key);

                  return (
                    <DroppableContainer id={record.key}>
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
                            editMode ? { body: { row: ItemRow } } : undefined
                          }
                        />
                      </SortableContext>
                    </DroppableContainer>
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
        title="Add Registry"
        open={createRegistryModalOpen}
        onCancel={closeCreateRegistryModal}
        onOk={submitCreateRegistry}
        confirmLoading={createRegistryLoading}
        okText="Save"
      >
        <Form
          form={createRegistryForm}
          layout="vertical"
          initialValues={{ actionPath: "", targetType: "", mappingJson: "" }}
          onFinish={submitCreateRegistry}
        >
          <Form.Item
            label="Action Path"
            name="actionPath"
            rules={[{ required: true, message: "Action Path is required" }]}
          >
            <Input placeholder="e.g. plant.watering" />
          </Form.Item>

          <Form.Item
            label="Target Type"
            name="targetType"
            rules={[{ required: true, message: "Target Type is required" }]}
          >
            <Input placeholder="e.g. plant" />
          </Form.Item>

          <Form.Item
            label="Mapping JSON"
            name="mappingJson"
            rules={[{ required: true, message: "Mapping JSON is required" }]}
          >
            <Input.TextArea rows={6} placeholder='{ "field": "value" }' />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional" />
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
