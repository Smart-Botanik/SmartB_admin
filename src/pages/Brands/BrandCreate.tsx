import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Image,
} from "antd";

import { MediaUpload } from "@/components/Media/MediaUpload/MediaUpload";
import { brandsService } from "@/services/brands";
import { BRAND_CATEGORY_OPTIONS } from "@/types/brand";
import type { MediaUploadResponse } from "@/services/media";

const { Title } = Typography;

interface BrandCreateFormValues {
  name: string;
  category: string;
  description?: string;
}

const BrandCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<BrandCreateFormValues>();
  const [avatarFiles, setAvatarFiles] = useState<MediaUploadResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: BrandCreateFormValues) => {
    setSubmitting(true);
    try {
      const avatarMediaId = avatarFiles[0]?.id ?? null;
      await brandsService.create({
        name: values.name.trim(),
        category: values.category,
        description: values.description?.trim() || null,
        avatarMediaId,
      });
      message.success("Бренд создан");
      navigate("/brands");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось создать бренд";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Новый бренд
      </Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ category: "COMMON" }}
        >
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
              maxFiles={1}
              multiple={false}
              accept="image/*"
              storageFolder="brands"
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
              Файл загружается в хранилище (`brands/`). Обрезка в UI — позже (FR-3.3.B).
            </Typography.Text>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Создать
              </Button>
              <Button onClick={() => navigate("/brands")}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default BrandCreatePage;
