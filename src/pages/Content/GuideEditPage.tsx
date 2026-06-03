import React, { useEffect, useMemo, useState } from "react";

import { formatHashtagsLine } from "@growing/content-markdown";

import { useNavigate, useParams } from "react-router-dom";

import {

  Button,

  Card,

  Form,

  Input,

  InputNumber,

  Popconfirm,

  Select,

  Space,

  Tag,

  Typography,

  message,

} from "antd";



import { ContentTaxonomyFields } from "@/components/Content/ContentTaxonomyFields";
import { GuideContentEditor } from "@/components/Content/GuideContentEditor";

import { MediaUpload } from "@/components/Media/MediaUpload/MediaUpload";

import { contentService } from "@/services/content";

import type { MediaUploadResponse } from "@/services/media";

import {

  CONTENT_STATUS_OPTIONS,

  CROP_KIND_OPTIONS,

  type TaxonomyTag,

  type CropGuide,

  type CropKind,

} from "@/types/content";



const { Title, Text } = Typography;



type FormValues = {

  cropKind: CropKind;

  slug: string;

  title: string;

  excerpt?: string;

  status?: string;

  seoTitle?: string;

  seoDescription?: string;

  sortOrder?: number;

};



const GuideEditPage: React.FC = () => {

  const { id = "" } = useParams();

  const navigate = useNavigate();

  const [form] = Form.useForm<FormValues>();

  const [guide, setGuide] = useState<CropGuide | null>(null);

  const [bodySiteMd, setBodySiteMd] = useState("");

  const [bodyTelegramMd, setBodyTelegramMd] = useState("");

  const [coverFiles, setCoverFiles] = useState<MediaUploadResponse[]>([]);

  const [mediaFiles, setMediaFiles] = useState<MediaUploadResponse[]>([]);

  const [taxonomyTagIds, setTaxonomyTagIds] = useState<string[]>([]);

  const [taxonomyTags, setTaxonomyTags] = useState<TaxonomyTag[]>([]);

  const watchedCropKind = Form.useWatch("cropKind", form) as CropKind | undefined;

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {

    let cancelled = false;



    const load = async () => {

      setLoading(true);

      try {

        const item = await contentService.getGuide(id);

        if (cancelled) return;

        if (!item) {

          message.error("Руководство не найдено");

          navigate("/content/guides");

          return;

        }

        setGuide(item);

        setTaxonomyTagIds(item.taxonomyTags?.map(tag => tag.id) ?? []);

        setBodySiteMd(item.bodySiteMd ?? "");

        setBodyTelegramMd(item.bodyTelegramMd ?? "");

        form.setFieldsValue({

          cropKind: item.cropKind,

          slug: item.slug,

          title: item.title,

          excerpt: item.excerpt ?? undefined,

          status: item.status,

          seoTitle: item.seoTitle ?? undefined,

          seoDescription: item.seoDescription ?? undefined,

          sortOrder: item.sortOrder,

        });

      } catch (error) {

        if (!cancelled) {

          message.error(error instanceof Error ? error.message : "Ошибка загрузки");

        }

      } finally {

        if (!cancelled) setLoading(false);

      }

    };



    void load();

    return () => {

      cancelled = true;

    };

  }, [form, id, navigate]);

  useEffect(() => {
    let cancelled = false;
    const loadTags = async () => {
      try {
        const page = await contentService.listTaxonomyTags({ limit: 200, offset: 0 });
        if (!cancelled) {
          setTaxonomyTags(page.items);
        }
      } catch {
        if (!cancelled) {
          setTaxonomyTags([]);
        }
      }
    };
    void loadTags();
    return () => {
      cancelled = true;
    };
  }, []);

  const telegramHashtagPreview = useMemo(() => {
    const terms = taxonomyTagIds
      .map(tagId => taxonomyTags.find(tag => tag.id === tagId))
      .filter((tag): tag is TaxonomyTag => Boolean(tag))
      .map(tag => ({
        key: tag.key,
        label: tag.label,
        sortOrder: tag.sortOrder,
      }));
    const line = formatHashtagsLine(terms, {
      excludeInText: `${bodyTelegramMd}\n${bodySiteMd}`,
    });
    return line || null;
  }, [taxonomyTagIds, taxonomyTags, bodyTelegramMd, bodySiteMd]);

  const onFinish = async (values: FormValues) => {

    if (!bodySiteMd.trim()) {

      message.error("Заполните Markdown для сайта");

      return;

    }



    setSubmitting(true);

    try {

      await contentService.updateGuide(id, {

        cropKind: values.cropKind,

        slug: values.slug.trim(),

        title: values.title.trim(),

        excerpt: values.excerpt?.trim() || null,

        bodySiteMd,

        bodyTelegramMd,

        coverMediaId: coverFiles[0]?.id ?? undefined,

        seoTitle: values.seoTitle?.trim() || null,

        seoDescription: values.seoDescription?.trim() || null,

        sortOrder: values.sortOrder ?? 0,

        taxonomyTagIds,

      });

      message.success("Сохранено");

      navigate("/content/guides");

    } catch (error) {

      message.error(error instanceof Error ? error.message : "Ошибка сохранения");

    } finally {

      setSubmitting(false);

    }

  };



  const handlePublishToTelegram = async () => {
    if (!guide) return;
    try {
      const result = await contentService.publishGuideToTelegram(guide.id);
      if (!result.success) {
        message.error(result.message ?? "Не удалось отправить в Telegram");
        return;
      }
      message.success(result.message ?? "Отправлено в Telegram");
      const refreshed = await contentService.getGuide(id);
      setGuide(refreshed);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка отправки в Telegram",
      );
    }
  };

  const handlePublishToggle = async () => {

    if (!guide) return;

    try {

      if (guide.status === "PUBLISHED") {

        await contentService.unpublishGuide(guide.id);

        message.success("Снято с публикации");

      } else {

        await contentService.publishGuide(guide.id);

        message.success("Опубликовано");

      }

      const refreshed = await contentService.getGuide(id);

      setGuide(refreshed);

      form.setFieldValue("status", refreshed?.status);

    } catch (error) {

      message.error(error instanceof Error ? error.message : "Ошибка публикации");

    }

  };



  const handleDelete = async () => {

    try {

      await contentService.deleteGuide(id);

      message.success("Удалено");

      navigate("/content/guides");

    } catch (error) {

      message.error(error instanceof Error ? error.message : "Ошибка удаления");

    }

  };



  const handleMediaUploaded = (file: MediaUploadResponse) => {

    setMediaFiles(prev => (prev.some(f => f.id === file.id) ? prev : [...prev, file]));

  };



  return (

    <Space direction="vertical" size="large" style={{ width: "100%" }}>

      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>

        <Title level={3} style={{ margin: 0 }}>

          Редактирование руководства

        </Title>

        {guide ? (

          <Space>

            <Tag color={guide.status === "PUBLISHED" ? "green" : "default"}>

              {guide.status}

            </Tag>

            {guide.status === "PUBLISHED" ? (

              <Button href={`/guides/${guide.slug}`} target="_blank">

                Открыть на сайте

              </Button>

            ) : null}

            <Button onClick={() => void handlePublishToggle()}>

              {guide.status === "PUBLISHED" ? "Unpublish" : "Publish"}

            </Button>

            <Button onClick={() => void handlePublishToTelegram()}>

              Отправить в Telegram

            </Button>

            {guide.telegramPostUrl ? (

              <Button href={guide.telegramPostUrl} target="_blank">

                Пост в Telegram

              </Button>

            ) : null}

            {guide.telegramPublishedAt ? (

              <Text type="secondary">

                TG: {new Date(guide.telegramPublishedAt).toLocaleString("ru-RU")}

              </Text>

            ) : null}

            <Popconfirm title="Удалить руководство?" onConfirm={() => void handleDelete()}>

              <Button danger>Удалить</Button>

            </Popconfirm>

          </Space>

        ) : null}

      </Space>

      <Card loading={loading}>

        <Form form={form} layout="vertical" onFinish={onFinish}>

          <Form.Item name="cropKind" label="Культура" rules={[{ required: true }]}>

            <Select options={CROP_KIND_OPTIONS} />

          </Form.Item>

          <Form.Item label="Таксономия (культура → подтег)">
            <ContentTaxonomyFields
              cropKind={watchedCropKind ?? guide?.cropKind ?? "TOMATO"}
              tags={taxonomyTags}
              value={taxonomyTagIds}
              onChange={setTaxonomyTagIds}
              disabled={submitting}
            />
          </Form.Item>

          {telegramHashtagPreview ? (
            <Form.Item label="Хештеги в Telegram (авто)">
              <Text type="secondary" style={{ display: "block" }}>
                {telegramHashtagPreview}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Добавятся в конец поста при «Отправить в Telegram», если их ещё нет в тексте.
              </Text>
            </Form.Item>
          ) : null}

          <Form.Item name="title" label="Заголовок" rules={[{ required: true }]}>

            <Input maxLength={200} />

          </Form.Item>

          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>

            <Input maxLength={120} />

          </Form.Item>

          <Form.Item name="excerpt" label="Краткое описание">

            <Input.TextArea rows={2} maxLength={500} />

          </Form.Item>

          <Form.Item name="sortOrder" label="Порядок">

            <InputNumber min={0} style={{ width: "100%" }} />

          </Form.Item>

          <Form.Item label="Обложка">

            {guide?.cover?.url ? (

              <Text type="secondary">Текущая: {guide.cover.url}</Text>

            ) : null}

            <MediaUpload

              maxFiles={1}

              multiple={false}

              accept="image/*"

              storageFolder={`guides/${id}`}

              onUploadComplete={files => setCoverFiles(files)}

            />

          </Form.Item>



          <Form.Item label="Контент">

            <GuideContentEditor

              guideId={id}

              bodySiteMd={bodySiteMd}

              bodyTelegramMd={bodyTelegramMd}

              onBodySiteMdChange={setBodySiteMd}

              onBodyTelegramMdChange={setBodyTelegramMd}

              mediaFiles={mediaFiles}

              onMediaUploaded={handleMediaUploaded}

            />

          </Form.Item>



          <Form.Item name="status" label="Статус">

            <Select options={CONTENT_STATUS_OPTIONS} disabled />

          </Form.Item>

          <Form.Item name="seoTitle" label="SEO title">

            <Input maxLength={200} />

          </Form.Item>

          <Form.Item name="seoDescription" label="SEO description">

            <Input.TextArea rows={2} maxLength={500} />

          </Form.Item>

          <Space>

            <Button onClick={() => navigate("/content/guides")}>Назад</Button>

            <Button type="primary" htmlType="submit" loading={submitting}>

              Сохранить

            </Button>

          </Space>

        </Form>

      </Card>

    </Space>

  );

};



export default GuideEditPage;


