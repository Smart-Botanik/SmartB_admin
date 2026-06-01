import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  message,
} from "antd";

import { contentService } from "@/services/content";
import type { SitePage } from "@/types/content";

const { Title, Text } = Typography;

const DEFAULT_SECTIONS = JSON.stringify(
  [
    {
      type: "hero",
      title: "Выращивание с умом",
      subtitle: "Руководства по культурам и дневник сада.",
      ctaLabel: "Смотреть руководства",
      ctaHref: "/guides",
    },
    {
      type: "featuredGuides",
      cropKinds: ["TOMATO", "ZUCCHINI", "EGGPLANT", "CUCUMBER"],
    },
  ],
  null,
  2,
);

type FormValues = {
  title: string;
  sectionsJson: string;
  seoTitle?: string;
  seoDescription?: string;
};

const HomePageEditor: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const item = await contentService.getSitePage("home");
        if (cancelled) return;
        if (item) {
          setPage(item);
          form.setFieldsValue({
            title: item.title,
            sectionsJson: JSON.stringify(item.sections, null, 2),
            seoTitle: item.seoTitle ?? undefined,
            seoDescription: item.seoDescription ?? undefined,
          });
        } else {
          form.setFieldsValue({
            title: "SmartБотаник — главная",
            sectionsJson: DEFAULT_SECTIONS,
          });
        }
      } catch {
        if (!cancelled) {
          form.setFieldsValue({
            title: "SmartБотаник — главная",
            sectionsJson: DEFAULT_SECTIONS,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onFinish = async (values: FormValues) => {
    try {
      JSON.parse(values.sectionsJson);
    } catch {
      message.error("sectionsJson: невалидный JSON");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await contentService.upsertSitePage({
        key: "home",
        title: values.title.trim(),
        sectionsJson: values.sectionsJson,
        seoTitle: values.seoTitle?.trim() || null,
        seoDescription: values.seoDescription?.trim() || null,
      });
      setPage(saved);
      message.success("Главная сохранена");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      if (page?.status === "PUBLISHED") {
        const saved = await contentService.unpublishSitePage("home");
        setPage(saved);
        message.success("Снято с публикации");
      } else {
        const saved = await contentService.publishSitePage("home");
        setPage(saved);
        message.success("Опубликовано");
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка публикации");
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          Главная страница
        </Title>
        <Space>
          {page ? (
            <Tag color={page.status === "PUBLISHED" ? "green" : "default"}>
              {page.status}
            </Tag>
          ) : null}
          <Button onClick={() => void handlePublishToggle()}>
            {page?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </Button>
        </Space>
      </Space>
      <Text type="secondary">Ключ страницы: home</Text>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Заголовок" rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="sectionsJson"
            label="Sections (JSON)"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={16} />
          </Form.Item>
          <Form.Item name="seoTitle" label="SEO title">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="seoDescription" label="SEO description">
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Сохранить
          </Button>
        </Form>
      </Card>
    </Space>
  );
};

export default HomePageEditor;
