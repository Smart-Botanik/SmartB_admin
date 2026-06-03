import React, { useEffect, useState } from "react";
import { ADMIN_VUE_TAXONOMY_PATH, crossAppLinkHref } from "@growing/admin-shell";

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import { contentService } from "@/services/content";
import type { TaxonomyTag, TaxonomyTagNamespace, CropKind } from "@/types/content";
import {
  TAXONOMY_TAG_NAMESPACE_OPTIONS,
  CROP_KIND_OPTIONS,
  taxonomyTagNamespaceLabel,
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

const vueTaxonomyHref = crossAppLinkHref({
  key: "vue-taxonomy",
  label: "Справочник таксономии",
  path: ADMIN_VUE_TAXONOMY_PATH,
  app: "vue",
});

const TaxonomyTagsListPage: React.FC = () => {
  const [rows, setRows] = useState<TaxonomyTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxonomyTag | null>(null);
  const [form] = Form.useForm<TagFormValues>();
  const watchedNamespace = Form.useWatch("namespace", form) as TaxonomyTagNamespace | undefined;

  const cropParents = rows.filter(tag => tag.namespace === "CROP");

  const load = async () => {
    setLoading(true);
    try {
      const page = await contentService.listTaxonomyTags({ limit: 500, offset: 0 });
      setRows(page.items);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sortOrder: 0, namespace: "CROP" });
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

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Теги таксономии
        </Title>
        <Button type="primary" onClick={openCreate}>
          Создать метку
        </Button>
      </Space>
      <Text type="secondary">
        Плоский список всех меток. Иерархию культур и подтегов настраивайте в{" "}
        <a href={vueTaxonomyHref} target="_blank" rel="noopener noreferrer">
          справочнике таксономии (Vue)
        </a>
        . Ключи: <code>crop.tomato</code>,{" "}
        <code>crop.tomato.determinate</code>.
      </Text>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={false}
        columns={[
          { title: "Метка", dataIndex: "label", key: "label" },
          { title: "Ключ", dataIndex: "key", key: "key" },
          {
            title: "Namespace",
            dataIndex: "namespace",
            key: "namespace",
            render: (ns: TaxonomyTagNamespace) => (
              <Tag>{taxonomyTagNamespaceLabel(ns)}</Tag>
            ),
          },
          {
            title: "Родитель",
            key: "parent",
            render: (_: unknown, record: TaxonomyTag) =>
              record.parent?.label ?? record.parentId ?? "—",
          },
          { title: "Порядок", dataIndex: "sortOrder", key: "sortOrder", width: 90 },
          {
            title: "",
            key: "actions",
            width: 180,
            render: (_: unknown, record: TaxonomyTag) => (
              <Space>
                <Button size="small" onClick={() => openEdit(record)}>
                  Изменить
                </Button>
                <Popconfirm
                  title="Удалить метку?"
                  onConfirm={async () => {
                    try {
                      await contentService.deleteTaxonomyTag(record.id);
                      message.success("Удалено");
                      await load();
                    } catch (error) {
                      message.error(
                        error instanceof Error ? error.message : "Ошибка удаления",
                      );
                    }
                  }}
                >
                  <Button size="small" danger>
                    Удалить
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? "Редактировать метку" : "Новая метка"}
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
            <Select options={TAXONOMY_TAG_NAMESPACE_OPTIONS} />
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
                allowClear
                options={cropParents.map(tag => ({
                  value: tag.id,
                  label: `${tag.label} (${tag.key})`,
                }))}
              />
            </Form.Item>
          ) : null}
          {watchedNamespace === "CROP" ? (
            <Form.Item name="cropKind" label="CropKind">
              <Select allowClear options={CROP_KIND_OPTIONS} />
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

export default TaxonomyTagsListPage;
