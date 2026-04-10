import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Typography,
  message,
  Image,
} from "antd";

import { MediaUpload } from "@/components/Media/MediaUpload/MediaUpload";
import { brandsService } from "@/services/brands";
import { BRAND_CATEGORY_OPTIONS } from "@/types/brand";
import type { Brand } from "@/types/brand";
import type { MediaUploadResponse } from "@/services/media";

const { Title } = Typography;

interface BrandEditFormValues {
  name: string;
  category: string;
  description?: string;
}

function brandToInitialUploads(brand: Brand): MediaUploadResponse[] {
  if (!brand.avatar?.id || !brand.avatar.url) return [];
  return [
    {
      id: brand.avatar.id,
      url: brand.avatar.url,
      name: "Логотип",
      size: 0,
      mimeType: "image/*",
      createdAt: brand.updatedAt ?? brand.createdAt ?? new Date().toISOString(),
    },
  ];
}

const BrandEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<BrandEditFormValues>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarFiles, setAvatarFiles] = useState<MediaUploadResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const b = await brandsService.getById(id);
      if (!b) {
        setLoadError("Бренд не найден");
        setBrand(null);
        return;
      }
      setBrand(b);
      form.setFieldsValue({
        name: b.name,
        category: b.category,
        description: b.description ?? undefined,
      });
      setAvatarFiles(brandToInitialUploads(b));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить бренд";
      setLoadError(msg);
      setBrand(null);
    }
  }, [id, form]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadKey = useMemo(() => {
    if (!brand) return "loading";
    return `brand-avatar-${brand.id}-${brand.avatar?.id ?? "none"}`;
  }, [brand]);

  const onFinish = async (values: BrandEditFormValues) => {
    if (!id || !brand) return;
    setSubmitting(true);
    try {
      const initialAvatarId = brand.avatar?.id ?? null;
      const currentAvatarId = avatarFiles[0]?.id ?? null;

      const input: Parameters<typeof brandsService.update>[1] = {
        name: values.name.trim(),
        category: values.category,
        description: values.description?.trim() || null,
      };

      if (currentAvatarId !== initialAvatarId) {
        input.avatarMediaId = currentAvatarId;
      }

      await brandsService.update(id, input);
      message.success("Бренд обновлён");
      navigate("/brands");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return <Typography.Text type="danger">Некорректный id</Typography.Text>;
  }

  if (loadError) {
    return (
      <Space direction="vertical">
        <Typography.Text type="danger">{loadError}</Typography.Text>
        <Button onClick={() => navigate("/brands")}>К списку</Button>
      </Space>
    );
  }

  if (!brand) {
    return <Spin size="large" />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Редактирование: {brand.name}
      </Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input placeholder="Название бренда" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Категория"
            rules={[{ required: true, message: "Выберите категорию" }]}
          >
            <Select
              options={BRAND_CATEGORY_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} placeholder="Необязательно" maxLength={2000} />
          </Form.Item>
          <Form.Item label="Аватар / логотип">
            <MediaUpload
              key={uploadKey}
              maxFiles={1}
              multiple={false}
              accept="image/*"
              storageFolder="brands"
              uploadedFiles={brandToInitialUploads(brand)}
              onUploadComplete={(files) => setAvatarFiles(files)}
            />
            {avatarFiles[0]?.url ? (
              <Image
                src={avatarFiles[0].url}
                alt="Предпросмотр"
                width={120}
                style={{ marginTop: 12, objectFit: "cover", borderRadius: 8 }}
              />
            ) : null}
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Файл сохраняется в хранилище (`brands/`). Обрезка в интерфейсе — позже (FR-3.3.B).
            </Typography.Text>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Сохранить
              </Button>
              <Button onClick={() => navigate("/brands")}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default BrandEditPage;
