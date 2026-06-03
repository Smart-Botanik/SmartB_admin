import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildTaxonomyForest,
  globalTopicTags,
  type FlatTaxonomyTag,
  type TaxonomyNode,
} from "@growing/contracts";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tree,
  Typography,
  message,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { Link } from "react-router-dom";

import { contentService } from "@/services/content";
import type { TaxonomyTag, TaxonomyTagNamespace, CropKind } from "@/types/content";
import {
  TAXONOMY_TAG_NAMESPACE_OPTIONS,
  CROP_KIND_OPTIONS,
  taxonomyTagNamespaceLabel,
  cropKindLabel,
} from "@/types/content";

const { Title, Text } = Typography;

type TagFormValues = {
  key: string;
  namespace: TaxonomyTagNamespace;
  label: string;
  sortOrder?: number;
  parentId?: string | null;
  cropKind?: CropKind | null;
  variantAxis?: string | null;
};

function toFlat(tags: TaxonomyTag[]): FlatTaxonomyTag[] {
  return tags.map(tag => ({
    id: tag.id,
    key: tag.key,
    namespace: tag.namespace,
    label: tag.label,
    sortOrder: tag.sortOrder,
    parentId: tag.parentId,
    cropKind: tag.cropKind,
    variantAxis: tag.variantAxis,
    status: tag.status,
  }));
}

function renderTreeTitle(
  node: TaxonomyNode,
  onEdit: (tag: TaxonomyTag) => void,
  onAddVariant: (parent: TaxonomyNode) => void,
  onDelete: (id: string) => void,
  tagById: Map<string, TaxonomyTag>,
): React.ReactNode {
  const record = tagById.get(node.id);
  if (!record) {
    return node.label;
  }

  return (
    <Space wrap size="small" style={{ width: "100%", justifyContent: "space-between" }}>
      <Space wrap size="small">
        <Text strong>{node.label}</Text>
        <Text type="secondary" code>
          {node.key}
        </Text>
        {node.cropKind ? <Tag>{cropKindLabel(node.cropKind)}</Tag> : null}
        {node.variantAxis ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {node.variantAxis}
          </Text>
        ) : null}
      </Space>
      <Space size="small" onClick={event => event.stopPropagation()}>
        {node.namespace === "CROP" ? (
          <Button size="small" type="link" onClick={() => onAddVariant(node)}>
            + подтег
          </Button>
        ) : null}
        <Button size="small" type="link" onClick={() => onEdit(record)}>
          Изменить
        </Button>
        <Popconfirm title="Удалить метку?" onConfirm={() => onDelete(record.id)}>
          <Button size="small" type="link" danger>
            Удалить
          </Button>
        </Popconfirm>
      </Space>
    </Space>
  );
}

function forestToTreeData(
  nodes: TaxonomyNode[],
  handlers: {
    onEdit: (tag: TaxonomyTag) => void;
    onAddVariant: (parent: TaxonomyNode) => void;
    onDelete: (id: string) => void;
  },
  tagById: Map<string, TaxonomyTag>,
): DataNode[] {
  return nodes.map(node => ({
    key: node.id,
    title: renderTreeTitle(node, handlers.onEdit, handlers.onAddVariant, handlers.onDelete, tagById),
    children:
      node.children.length > 0
        ? forestToTreeData(node.children, handlers, tagById)
        : undefined,
  }));
}

const ContentTaxonomyPage: React.FC = () => {
  const [rows, setRows] = useState<TaxonomyTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxonomyTag | null>(null);
  const [form] = Form.useForm<TagFormValues>();
  const watchedNamespace = Form.useWatch("namespace", form) as TaxonomyTagNamespace | undefined;

  const cropParents = rows.filter(tag => tag.namespace === "CROP");
  const tagById = useMemo(() => new Map(rows.map(tag => [tag.id, tag])), [rows]);
  const flat = useMemo(() => toFlat(rows), [rows]);
  const cropForest = useMemo(() => buildTaxonomyForest(flat), [flat]);
  const topicTags = useMemo(() => globalTopicTags(flat), [flat]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await contentService.listTaxonomyTags({ limit: 500, offset: 0 });
      setRows(page.items);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateCrop = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sortOrder: 0, namespace: "CROP" });
    setModalOpen(true);
  };

  const openAddVariant = (parent: TaxonomyNode) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0,
      namespace: "CROP_VARIANT",
      parentId: parent.id,
      variantAxis: parent.variantAxis ?? (parent.cropKind === "CUCUMBER" ? "pollination" : "growth_habit"),
    });
    setModalOpen(true);
  };

  const openEdit = (tag: TaxonomyTag) => {
    setEditing(tag);
    form.setFieldsValue({
      key: tag.key,
      namespace: tag.namespace,
      label: tag.label,
      sortOrder: tag.sortOrder,
      parentId: tag.parentId,
      cropKind: tag.cropKind,
      variantAxis: tag.variantAxis,
    });
    setModalOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      await contentService.deleteTaxonomyTag(id);
      message.success("Удалено");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка удаления");
    }
  };

  const onSubmit = async (values: TagFormValues) => {
    try {
      if (editing) {
        await contentService.updateTaxonomyTag(editing.id, {
          key: values.key.trim(),
          namespace: values.namespace,
          label: values.label.trim(),
          sortOrder: values.sortOrder ?? 0,
          parentId: values.parentId ?? null,
          cropKind: values.cropKind ?? null,
          variantAxis: values.variantAxis?.trim() || null,
        });
        message.success("Метка обновлена");
      } else {
        await contentService.createTaxonomyTag({
          key: values.key.trim(),
          namespace: values.namespace,
          label: values.label.trim(),
          sortOrder: values.sortOrder ?? 0,
          parentId: values.parentId ?? null,
          cropKind: values.cropKind ?? null,
          variantAxis: values.variantAxis?.trim() || null,
        });
        message.success("Метка создана");
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  };

  const cropTreeData = useMemo(
    () =>
      forestToTreeData(
        cropForest,
        { onEdit: openEdit, onAddVariant: openAddVariant, onDelete },
        tagById,
      ),
    [cropForest, tagById, rows],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Таксономия контента
        </Title>
        <Space>
          <Link to="/content/taxonomy-tags">
            <Button>Плоский список меток</Button>
          </Link>
          <Button type="primary" onClick={openCreateCrop}>
            Добавить культуру (CROP)
          </Button>
        </Space>
      </Space>

      <Text type="secondary">
        Иерархия: культура → подтеги (детерминантные для томатов, тип опыления для огурцов). Для
        глобальных тем используйте раздел ниже или{" "}
        <Link to="/content/taxonomy-tags">метки контента</Link>.
      </Text>

      <Card title="Культуры и подтеги" loading={loading}>
        {cropTreeData.length > 0 ? (
          <Tree showLine defaultExpandAll treeData={cropTreeData} />
        ) : (
          <Text type="secondary">Нет корневых меток CROP. Добавьте культуру.</Text>
        )}
      </Card>

      <Card title="Общие темы (TOPIC, PRODUCT_USE)" loading={loading}>
        {topicTags.length > 0 ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            {topicTags.map(tag => {
              const record = tagById.get(tag.id);
              if (!record) {
                return null;
              }
              return (
                <Space
                  key={tag.id}
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Space>
                    <Text>{tag.label}</Text>
                    <Text type="secondary" code>
                      {tag.key}
                    </Text>
                    <Tag>{taxonomyTagNamespaceLabel(tag.namespace)}</Tag>
                  </Space>
                  <Space>
                    <Button size="small" type="link" onClick={() => openEdit(record)}>
                      Изменить
                    </Button>
                    <Popconfirm
                      title="Удалить метку?"
                      onConfirm={() => onDelete(record.id)}
                    >
                      <Button size="small" type="link" danger>
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              );
            })}
          </Space>
        ) : (
          <Text type="secondary">
            Нет общих тем. Создайте в <Link to="/content/taxonomy-tags">списке меток</Link>.
          </Text>
        )}
      </Card>

      <Modal
        title={
          editing
            ? "Редактировать метку"
            : watchedNamespace === "CROP_VARIANT"
              ? "Новый подтег"
              : "Новая культура"
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="key"
            label="Ключ"
            rules={[{ required: true, message: "Укажите ключ" }]}
          >
            <Input placeholder="crop.tomato.determinate" disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item name="namespace" label="Тип" rules={[{ required: true }]}>
            <Select
              disabled={Boolean(editing) || Boolean(form.getFieldValue("parentId"))}
              options={TAXONOMY_TAG_NAMESPACE_OPTIONS}
            />
          </Form.Item>
          <Form.Item
            name="label"
            label="Подпись"
            rules={[{ required: true, message: "Укажите подпись" }]}
          >
            <Input placeholder="Детерминантный" />
          </Form.Item>
          {watchedNamespace === "CROP_VARIANT" ? (
            <Form.Item name="parentId" label="Культура (родитель)" rules={[{ required: true }]}>
              <Select
                disabled={Boolean(editing)}
                options={cropParents.map(tag => ({
                  value: tag.id,
                  label: `${tag.label} (${tag.key})`,
                }))}
              />
            </Form.Item>
          ) : null}
          {watchedNamespace === "CROP" ? (
            <Form.Item name="cropKind" label="CropKind" rules={[{ required: true }]}>
              <Select options={CROP_KIND_OPTIONS} />
            </Form.Item>
          ) : null}
          {watchedNamespace === "CROP_VARIANT" ? (
            <Form.Item name="variantAxis" label="Ось варианта">
              <Input placeholder="growth_habit / pollination" />
            </Form.Item>
          ) : null}
          <Form.Item name="sortOrder" label="Порядок сортировки">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ContentTaxonomyPage;
