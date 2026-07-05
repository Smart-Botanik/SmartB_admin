import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  message,
} from "antd";

import { contentService } from "@/services/content";
import type { SitePage } from "@/types/content";

import {
  DEFAULT_TELEGRAM_BLOCK,
  extractTelegramBlock,
  mergeTelegramIntoSectionsJson,
  parseSectionsJson,
  type TelegramBlockFormValues,
} from "./sitePageSections";

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
      type: "telegramBlock",
      ...DEFAULT_TELEGRAM_BLOCK,
    },
    {
      type: "cultureChips",
      title: "Культуры",
      subtitle: "Гайды и материалы по основным культурам.",
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
  telegramTitle: string;
  telegramText: string;
  telegramChannelUrl: string;
  telegramButtonLabel: string;
};

function telegramFromForm(values: Pick<
  FormValues,
  "telegramTitle" | "telegramText" | "telegramChannelUrl" | "telegramButtonLabel"
>): TelegramBlockFormValues {
  return {
    title: values.telegramTitle,
    text: values.telegramText,
    channelUrl: values.telegramChannelUrl,
    buttonLabel: values.telegramButtonLabel,
  };
}

const HomePageEditor: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const applySectionsToForm = (sectionsJson: string, title?: string) => {
    try {
      const sections = parseSectionsJson(sectionsJson);
      const telegram = extractTelegramBlock(sections);
      form.setFieldsValue({
        title: title ?? form.getFieldValue("title"),
        sectionsJson,
        telegramTitle: telegram.title,
        telegramText: telegram.text,
        telegramChannelUrl: telegram.channelUrl,
        telegramButtonLabel: telegram.buttonLabel,
      });
    } catch {
      form.setFieldsValue({
        sectionsJson,
        telegramTitle: DEFAULT_TELEGRAM_BLOCK.title,
        telegramText: DEFAULT_TELEGRAM_BLOCK.text,
        telegramChannelUrl: DEFAULT_TELEGRAM_BLOCK.channelUrl,
        telegramButtonLabel: DEFAULT_TELEGRAM_BLOCK.buttonLabel,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const item = await contentService.getSitePage("home");
        if (cancelled) return;
        if (item) {
          setPage(item);
          const sectionsJson = JSON.stringify(item.sections, null, 2);
          applySectionsToForm(sectionsJson, item.title);
          form.setFieldsValue({
            seoTitle: item.seoTitle ?? undefined,
            seoDescription: item.seoDescription ?? undefined,
          });
        } else {
          form.setFieldsValue({
            title: "SmartБотanik — главная",
            sectionsJson: DEFAULT_SECTIONS,
            telegramTitle: DEFAULT_TELEGRAM_BLOCK.title,
            telegramText: DEFAULT_TELEGRAM_BLOCK.text,
            telegramChannelUrl: DEFAULT_TELEGRAM_BLOCK.channelUrl,
            telegramButtonLabel: DEFAULT_TELEGRAM_BLOCK.buttonLabel,
          });
        }
      } catch {
        if (!cancelled) {
          form.setFieldsValue({
            title: "SmartБотanik — главная",
            sectionsJson: DEFAULT_SECTIONS,
            telegramTitle: DEFAULT_TELEGRAM_BLOCK.title,
            telegramText: DEFAULT_TELEGRAM_BLOCK.text,
            telegramChannelUrl: DEFAULT_TELEGRAM_BLOCK.channelUrl,
            telegramButtonLabel: DEFAULT_TELEGRAM_BLOCK.buttonLabel,
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

  const syncTelegramToSectionsJson = () => {
    const values = form.getFieldsValue();
    try {
      const merged = mergeTelegramIntoSectionsJson(
        values.sectionsJson,
        telegramFromForm(values),
      );
      form.setFieldValue("sectionsJson", merged);
      return merged;
    } catch {
      message.error("Не удалось обновить sectionsJson из полей Telegram");
      return null;
    }
  };

  const onFinish = async (values: FormValues) => {
    let sectionsJson = values.sectionsJson;
    try {
      sectionsJson = mergeTelegramIntoSectionsJson(
        values.sectionsJson,
        telegramFromForm(values),
      );
      parseSectionsJson(sectionsJson);
      form.setFieldValue("sectionsJson", sectionsJson);
    } catch {
      message.error("sectionsJson: невалидный JSON");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await contentService.upsertSitePage({
        key: "home",
        title: values.title.trim(),
        sectionsJson,
        seoTitle: values.seoTitle?.trim() || null,
        seoDescription: values.seoDescription?.trim() || null,
      });
      setPage(saved);
      applySectionsToForm(JSON.stringify(saved.sections, null, 2), saved.title);
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
        const merged = syncTelegramToSectionsJson();
        if (merged) {
          await contentService.upsertSitePage({
            key: "home",
            title: form.getFieldValue("title").trim(),
            sectionsJson: merged,
            seoTitle: form.getFieldValue("seoTitle")?.trim() || null,
            seoDescription: form.getFieldValue("seoDescription")?.trim() || null,
          });
        }
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
            {page?.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
          </Button>
        </Space>
      </Space>
      <Text type="secondary">Ключ страницы: home · секция telegramBlock → блок на `/`</Text>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Заголовок" rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>

          <Card size="small" title="Telegram-блок (главная)" style={{ marginBottom: 16 }}>
            <Form.Item name="telegramTitle" label="Заголовок" rules={[{ required: true }]}>
              <Input maxLength={200} onBlur={() => void syncTelegramToSectionsJson()} />
            </Form.Item>
            <Form.Item name="telegramText" label="Текст">
              <Input.TextArea rows={3} onBlur={() => void syncTelegramToSectionsJson()} />
            </Form.Item>
            <Form.Item
              name="telegramChannelUrl"
              label="Ссылка на канал"
              rules={[{ required: true, type: "url" }]}
            >
              <Input placeholder="https://t.me/..." onBlur={() => void syncTelegramToSectionsJson()} />
            </Form.Item>
            <Form.Item name="telegramButtonLabel" label="Текст кнопки" rules={[{ required: true }]}>
              <Input maxLength={80} onBlur={() => void syncTelegramToSectionsJson()} />
            </Form.Item>
            <Button onClick={() => void syncTelegramToSectionsJson()}>
              Применить к sections JSON
            </Button>
          </Card>

          <Collapse
            items={[
              {
                key: "sections-json",
                label: "Sections (JSON) — все секции главной",
                children: (
                  <Form.Item
                    name="sectionsJson"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea rows={16} />
                  </Form.Item>
                ),
              },
            ]}
          />

          <Form.Item name="seoTitle" label="SEO title" style={{ marginTop: 16 }}>
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
