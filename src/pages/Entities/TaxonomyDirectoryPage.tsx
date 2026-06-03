import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { contentService } from "@/services/content";
import type {
  TaxonomyGroupDeleteStrategy,
  TaxonomyScope,
  TaxonomyTag,
  TaxonomyTagNamespace,
} from "@/types/content";
import {
  TAXONOMY_TAG_NAMESPACE_OPTIONS,
  taxonomyTagNamespaceLabel,
} from "@/types/content";

const { Title, Text } = Typography;

type TagFormValues = {
  key: string;
  namespace: TaxonomyTagNamespace;
  label: string;
};

type ScopeFormValues = {
  key: string;
  label: string;
  description?: string;
};

/** Корневой namespace по разделу (намеренные корни иерархии). */
function isIntentionalRoot(tag: TaxonomyTag, scopeKey: string): boolean {
  if (scopeKey === "crop") {
    return tag.namespace === "CROP";
  }
  if (scopeKey === "guides") {
    return tag.namespace === "TOPIC";
  }
  return !tag.parentId;
}

const DELETE_STRATEGY_LABELS: Record<TaxonomyGroupDeleteStrategy, string> = {
  REASSIGN: "Перенести подтеги в другую группу",
  CASCADE: "Удалить группу и все подтеги",
  PROMOTE_TO_ROOT: "Вывести подтеги на корневой уровень раздела",
};

const TaxonomyDirectoryPage: React.FC = () => {
  const [scopes, setScopes] = useState<TaxonomyScope[]>([]);
  const [activeScopeKey, setActiveScopeKey] = useState<string>("crop");
  const [forest, setForest] = useState<TaxonomyTag[]>([]);
  const [ungroupedTags, setUngroupedTags] = useState<TaxonomyTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TaxonomyTag | null>(null);

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagForm] = Form.useForm<TagFormValues>();
  const [scopeForm] = Form.useForm<ScopeFormValues>();
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [deleteStrategy, setDeleteStrategy] =
    useState<TaxonomyGroupDeleteStrategy>("PROMOTE_TO_ROOT");
  const [deleteNewParentId, setDeleteNewParentId] = useState<string | undefined>();
  const [assignTag, setAssignTag] = useState<TaxonomyTag | null>(null);
  const [assignParentId, setAssignParentId] = useState<string | undefined>();

  const activeScope = scopes.find(scope => scope.key === activeScopeKey);

  const hierarchyRoots = useMemo(
    () => forest.filter(root => isIntentionalRoot(root, activeScopeKey)),
    [forest, activeScopeKey],
  );

  const flatTags = useMemo(() => {
    const rows: TaxonomyTag[] = [];
    const walk = (nodes: TaxonomyTag[]) => {
      for (const node of nodes) {
        rows.push(node);
        if (node.children?.length) {
          walk(node.children);
        }
      }
    };
    walk(forest);
    return rows;
  }, [forest]);

  const groupChildren = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }
    return flatTags.filter(tag => tag.parentId === selectedGroup.id);
  }, [flatTags, selectedGroup]);

  const parentOptions = useMemo(
    () =>
      flatTags
        .filter(tag => (tag.childIds?.length ?? tag.children?.length ?? 0) > 0)
        .map(tag => ({ value: tag.id, label: `${tag.label} (${tag.key})` })),
    [flatTags],
  );

  const loadScopes = useCallback(async () => {
    const items = await contentService.listTaxonomyScopes();
    setScopes(items);
    if (items.length > 0 && !items.some(scope => scope.key === activeScopeKey)) {
      setActiveScopeKey(items[0].key);
    }
  }, [activeScopeKey]);

  const loadForest = useCallback(async () => {
    if (!activeScopeKey) {
      return;
    }
    setLoading(true);
    try {
      const [items, rootPage] = await Promise.all([
        contentService.taxonomyForest(activeScopeKey),
        contentService.listTaxonomyTags({
          scopeKey: activeScopeKey,
          parentId: null,
          limit: 500,
          offset: 0,
        }),
      ]);
      setForest(items);
      setUngroupedTags(
        rootPage.items.filter(tag => !isIntentionalRoot(tag, activeScopeKey)),
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [activeScopeKey]);

  useEffect(() => {
    void loadScopes();
  }, [loadScopes]);

  useEffect(() => {
    void loadForest();
    setSelectedGroup(null);
  }, [loadForest]);

  const openCreateTag = (parentId: string | null) => {
    setCreateParentId(parentId);
    tagForm.resetFields();
    tagForm.setFieldsValue({
      namespace: parentId ? "CROP_VARIANT" : activeScopeKey === "crop" ? "CROP" : "TOPIC",
    });
    setTagModalOpen(true);
  };

  const onCreateTag = async (values: TagFormValues) => {
    const parent = createParentId
      ? flatTags.find(tag => tag.id === createParentId)
      : undefined;
    const keyPrefix = parent?.key ?? activeScopeKey;
    const segment = values.key.trim().replace(/^\./, "");
    const fullKey = segment.includes(".") ? segment : `${keyPrefix}.${segment}`;
    try {
      await contentService.createTaxonomyTag({
        scopeKey: activeScopeKey,
        key: fullKey,
        namespace: values.namespace,
        label: values.label.trim(),
        sortOrder: 0,
        parentId: createParentId,
      });
      message.success("Тег создан");
      setTagModalOpen(false);
      await loadForest();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };

  const onCreateScope = async (values: ScopeFormValues) => {
    try {
      await contentService.createTaxonomyScope({
        key: values.key.trim().toLowerCase(),
        label: values.label.trim(),
        description: values.description?.trim() || null,
      });
      message.success("Раздел создан");
      setScopeModalOpen(false);
      await loadScopes();
      setActiveScopeKey(values.key.trim().toLowerCase());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };

  const openAssignGroup = (tag: TaxonomyTag) => {
    setAssignTag(tag);
    setAssignParentId(undefined);
    setAssignModalOpen(true);
  };

  const onAssignGroup = async () => {
    if (!assignTag || !assignParentId) {
      message.warning("Выберите группу");
      return;
    }
    try {
      await contentService.updateTaxonomyTag(assignTag.id, { parentId: assignParentId });
      message.success("Тег привязан к группе");
      setAssignModalOpen(false);
      setAssignTag(null);
      await loadForest();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка привязки");
    }
  };

  const onDeleteGroup = async () => {
    if (!selectedGroup) {
      return;
    }
    try {
      await contentService.deleteTaxonomyGroup(
        selectedGroup.id,
        deleteStrategy,
        deleteStrategy === "REASSIGN" ? deleteNewParentId : null,
      );
      message.success("Группа удалена");
      setDeleteModalOpen(false);
      setSelectedGroup(null);
      await loadForest();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка удаления");
    }
  };

  const hierarchyColumns: ColumnsType<TaxonomyTag> = [
    { title: "Название", dataIndex: "label", key: "label" },
    { title: "Ключ", dataIndex: "key", key: "key", render: key => <Text code>{key}</Text> },
    {
      title: "Тип",
      dataIndex: "namespace",
      key: "namespace",
      render: (ns: TaxonomyTagNamespace) => <Tag>{taxonomyTagNamespaceLabel(ns)}</Tag>,
    },
    {
      title: "Действия",
      key: "actions",
      width: 280,
      render: (_: unknown, record: TaxonomyTag) => {
        const isGroup = (record.childIds?.length ?? record.children?.length ?? 0) > 0;
        return (
          <Space size="small">
            {isGroup ? (
              <Button size="small" type={selectedGroup?.id === record.id ? "primary" : "default"} onClick={() => setSelectedGroup(record)}>
                Состав
              </Button>
            ) : null}
            <Button size="small" onClick={() => openCreateTag(record.id)}>
              Подтег
            </Button>
            {isGroup ? (
              <Button
                size="small"
                danger
                onClick={() => {
                  setSelectedGroup(record);
                  setDeleteModalOpen(true);
                }}
              >
                Удалить группу
              </Button>
            ) : (
              <Button
                size="small"
                danger
                onClick={async () => {
                  try {
                    await contentService.deleteTaxonomyTag(record.id);
                    message.success("Удалено");
                    await loadForest();
                  } catch (error) {
                    message.error(error instanceof Error ? error.message : "Ошибка");
                  }
                }}
              >
                Удалить
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const ungroupedColumns: ColumnsType<TaxonomyTag> = [
    { title: "Подпись", dataIndex: "label", key: "label" },
    { title: "Ключ", dataIndex: "key", key: "key", render: key => <Text code>{key}</Text> },
    {
      title: "Тип",
      dataIndex: "namespace",
      key: "namespace",
      render: ns => <Tag>{taxonomyTagNamespaceLabel(ns)}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 220,
      render: (_: unknown, record: TaxonomyTag) => (
        <Space size="small">
          <Button size="small" type="primary" onClick={() => openAssignGroup(record)}>
            {activeScopeKey === "crop" ? "Привязать к культуре" : "Назначить группу"}
          </Button>
          <Button
            size="small"
            danger
            onClick={async () => {
              try {
                await contentService.deleteTaxonomyTag(record.id);
                message.success("Удалено");
                await loadForest();
              } catch (error) {
                message.error(error instanceof Error ? error.message : "Ошибка");
              }
            }}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const childColumns: ColumnsType<TaxonomyTag> = [
    { title: "Подпись", dataIndex: "label", key: "label" },
    { title: "Ключ", dataIndex: "key", key: "key" },
    {
      title: "Тип",
      dataIndex: "namespace",
      key: "namespace",
      render: ns => <Tag>{taxonomyTagNamespaceLabel(ns)}</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: TaxonomyTag) => (
        <Button
          size="small"
          danger
          onClick={async () => {
            try {
              await contentService.deleteTaxonomyTag(record.id);
              message.success("Удалено");
              await loadForest();
            } catch (error) {
              message.error(error instanceof Error ? error.message : "Ошибка");
            }
          }}
        >
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Справочник таксономии
        </Title>
        <Button onClick={() => setScopeModalOpen(true)}>Добавить раздел</Button>
      </Space>

      <Tabs
        activeKey={activeScopeKey}
        onChange={setActiveScopeKey}
        items={scopes.map(scope => ({
          key: scope.key,
          label: scope.label,
        }))}
      />

      <Card
        title={`Иерархия раздела «${activeScope?.label ?? activeScopeKey}»`}
        extra={
          <Button type="primary" onClick={() => openCreateTag(null)}>
            Корневой тег
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={hierarchyColumns}
          dataSource={hierarchyRoots}
          pagination={false}
          expandable={{ childrenColumnName: "children" }}
        />
      </Card>

      {ungroupedTags.length > 0 ? (
        <Card
          title={`Несгруппированные теги (${ungroupedTags.length})`}
          extra={
            <Text type="secondary">
              Теги на корневом уровне без своей группы — назначьте родителя или удалите
            </Text>
          }
        >
          <Table
            rowKey="id"
            columns={ungroupedColumns}
            dataSource={ungroupedTags}
            pagination={false}
          />
        </Card>
      ) : null}

      {selectedGroup ? (
        <Card
          title={`Состав группы «${selectedGroup.label}»`}
          extra={
            <Space>
              <Button onClick={() => openCreateTag(selectedGroup.id)}>Подтег</Button>
              <Button danger onClick={() => setDeleteModalOpen(true)}>
                Удалить группу
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            columns={childColumns}
            dataSource={groupChildren}
            pagination={false}
            locale={{ emptyText: "В этой группе пока нет подтегов." }}
          />
        </Card>
      ) : null}

      <Modal
        title={createParentId ? "Новый подтег" : "Новый корневой тег"}
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        onOk={() => tagForm.submit()}
        destroyOnClose
      >
        <Form form={tagForm} layout="vertical" onFinish={onCreateTag}>
          <Form.Item
            name="key"
            label="Ключ (сегмент)"
            rules={[{ required: true }]}
            extra="Будет добавлен к префиксу раздела или родителя"
          >
            <Input placeholder="tomato.determinate" />
          </Form.Item>
          <Form.Item name="namespace" label="Тип" rules={[{ required: true }]}>
            <Select options={TAXONOMY_TAG_NAMESPACE_OPTIONS} />
          </Form.Item>
          <Form.Item name="label" label="Подпись" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Новый раздел таксономии"
        open={scopeModalOpen}
        onCancel={() => setScopeModalOpen(false)}
        onOk={() => scopeForm.submit()}
        destroyOnClose
      >
        <Form form={scopeForm} layout="vertical" onFinish={onCreateScope}>
          <Form.Item name="key" label="Ключ" rules={[{ required: true }]}>
            <Input placeholder="product" />
          </Form.Item>
          <Form.Item name="label" label="Подпись" rules={[{ required: true }]}>
            <Input placeholder="Метки продуктов" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={assignTag ? `Назначить группу для «${assignTag.label}»` : "Назначить группу"}
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={() => void onAssignGroup()}
        okText="Сохранить"
        destroyOnClose
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Выберите группу в разделе «{activeScope?.label ?? activeScopeKey}», к которой привязать
          тег.
        </Text>
        <Select
          allowClear
          placeholder="Группа-родитель"
          style={{ width: "100%" }}
          options={parentOptions}
          value={assignParentId}
          onChange={setAssignParentId}
        />
      </Modal>

      <Modal
        title={selectedGroup ? `Удаление группы «${selectedGroup.label}»` : "Удаление группы"}
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={() => void onDeleteGroup()}
        okText="Подтвердить"
        okButtonProps={{ danger: true }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          В группе {groupChildren.length} подтег(ов). Выберите, что с ними сделать.
        </Text>
        <Radio.Group
          value={deleteStrategy}
          onChange={event => setDeleteStrategy(event.target.value)}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {(Object.keys(DELETE_STRATEGY_LABELS) as TaxonomyGroupDeleteStrategy[]).map(key => (
            <Radio key={key} value={key}>
              {DELETE_STRATEGY_LABELS[key]}
            </Radio>
          ))}
        </Radio.Group>
        {deleteStrategy === "REASSIGN" ? (
          <Select
            allowClear
            placeholder="Новая группа"
            style={{ width: "100%", marginTop: 12 }}
            options={parentOptions.filter(option => option.value !== selectedGroup?.id)}
            value={deleteNewParentId}
            onChange={setDeleteNewParentId}
          />
        ) : null}
      </Modal>
    </Space>
  );
};

export default TaxonomyDirectoryPage;
