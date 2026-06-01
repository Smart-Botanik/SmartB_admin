import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import {

  Button,

  Card,

  Form,

  Input,

  InputNumber,

  Select,

  Space,

  Typography,

  message,

} from "antd";



import { GuideContentEditor } from "@/components/Content/GuideContentEditor";

import { MediaUpload } from "@/components/Media/MediaUpload/MediaUpload";

import { contentService } from "@/services/content";

import type { MediaUploadResponse } from "@/services/media";

import { CROP_KIND_OPTIONS, type CropKind } from "@/types/content";



const { Title } = Typography;



const DEFAULT_SITE_MD = `---

scope: overview

---



## Заголовок раздела



Текст руководства.



> **Совет:** Полезная заметка.

`;



type FormValues = {

  cropKind: string;

  slug: string;

  title: string;

  excerpt?: string;

  seoTitle?: string;

  seoDescription?: string;

  sortOrder?: number;

};



const GuideCreatePage: React.FC = () => {

  const navigate = useNavigate();

  const [form] = Form.useForm<FormValues>();

  const [bodySiteMd, setBodySiteMd] = useState(DEFAULT_SITE_MD);

  const [bodyTelegramMd, setBodyTelegramMd] = useState("");

  const [coverFiles, setCoverFiles] = useState<MediaUploadResponse[]>([]);

  const [mediaFiles, setMediaFiles] = useState<MediaUploadResponse[]>([]);

  const [submitting, setSubmitting] = useState(false);



  const onFinish = async (values: FormValues) => {

    if (!bodySiteMd.trim()) {

      message.error("Заполните Markdown для сайта");

      return;

    }



    setSubmitting(true);

    try {

      await contentService.createGuide({

        cropKind: values.cropKind as CropKind,

        slug: values.slug.trim(),

        title: values.title.trim(),

        excerpt: values.excerpt?.trim() || null,

        bodySiteMd,

        bodyTelegramMd,

        coverMediaId: coverFiles[0]?.id ?? null,

        seoTitle: values.seoTitle?.trim() || null,

        seoDescription: values.seoDescription?.trim() || null,

        sortOrder: values.sortOrder ?? 0,

      });

      message.success("Руководство создано");

      navigate("/content/guides");

    } catch (error) {

      message.error(error instanceof Error ? error.message : "Ошибка сохранения");

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <Space direction="vertical" size="large" style={{ width: "100%" }}>

      <Title level={3} style={{ margin: 0 }}>

        Новое руководство

      </Title>

      <Card>

        <Form

          form={form}

          layout="vertical"

          onFinish={onFinish}

          initialValues={{ sortOrder: 0, cropKind: "TOMATO" }}

        >

          <Form.Item name="cropKind" label="Культура" rules={[{ required: true }]}>

            <Select options={CROP_KIND_OPTIONS} />

          </Form.Item>

          <Form.Item name="title" label="Заголовок" rules={[{ required: true }]}>

            <Input maxLength={200} />

          </Form.Item>

          <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}>

            <Input placeholder="vyrashchivanie-tomatov" maxLength={120} />

          </Form.Item>

          <Form.Item name="excerpt" label="Краткое описание">

            <Input.TextArea rows={2} maxLength={500} />

          </Form.Item>

          <Form.Item name="sortOrder" label="Порядок сортировки">

            <InputNumber min={0} style={{ width: "100%" }} />

          </Form.Item>

          <Form.Item label="Обложка">

            <MediaUpload

              maxFiles={1}

              multiple={false}

              accept="image/*"

              storageFolder="guides"

              onUploadComplete={files => setCoverFiles(files)}

            />

          </Form.Item>



          <Form.Item label="Контент">

            <GuideContentEditor

              bodySiteMd={bodySiteMd}

              bodyTelegramMd={bodyTelegramMd}

              onBodySiteMdChange={setBodySiteMd}

              onBodyTelegramMdChange={setBodyTelegramMd}

              mediaFiles={mediaFiles}

              onMediaUploaded={file =>

                setMediaFiles(prev =>

                  prev.some(f => f.id === file.id) ? prev : [...prev, file],

                )

              }

            />

          </Form.Item>



          <Form.Item name="seoTitle" label="SEO title">

            <Input maxLength={200} />

          </Form.Item>

          <Form.Item name="seoDescription" label="SEO description">

            <Input.TextArea rows={2} maxLength={500} />

          </Form.Item>

          <Space>

            <Button onClick={() => navigate("/content/guides")}>Отмена</Button>

            <Button type="primary" htmlType="submit" loading={submitting}>

              Создать

            </Button>

          </Space>

        </Form>

      </Card>

    </Space>

  );

};



export default GuideCreatePage;


