import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { productsService } from "@/services/products";
import type { Brand } from "@/types/brand";
import { PRODUCT_CATEGORY_OPTIONS } from "@/types/product";
import type { MediaUploadResponse } from "@/services/media";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title } = Typography;

interface ProductCreateFormValues {
  name: string;
  category: string;
  brandId: string;
}

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [form] = Form.useForm<ProductCreateFormValues>();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [avatarFiles, setAvatarFiles] = useState<MediaUploadResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBrandsLoading(true);
      try {
        const { items } = await brandsService.list({ limit: 500, offset: 0 });
        if (!cancelled) setBrands(items);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Не удалось загрузить бренды";
          message.error(msg);
        }
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFinish = async (values: ProductCreateFormValues) => {
    setSubmitting(true);
    try {
      const avatarMediaId = avatarFiles[0]?.id ?? null;
      await productsService.create({
        name: values.name.trim(),
        category: values.category,
        brandId: values.brandId,
        ...(avatarMediaId ? { avatarMediaId } : {}),
      });
      message.success("Продукт создан");
      navigate("/products");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось создать продукт";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">
          Создание продуктов доступно только администраторам.
        </Typography.Text>
        <Button onClick={() => navigate("/products")}>К списку продуктов</Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Новый продукт
      </Title>
      <Card>
        {brandsLoading ? (
          <Spin />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ category: PRODUCT_CATEGORY_OPTIONS[0].value }}
          >
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: "Укажите название" }]}
            >
              <Input placeholder="Название продукта" maxLength={200} />
            </Form.Item>
            <Form.Item
              name="category"
              label="Категория"
              rules={[{ required: true, message: "Выберите категорию" }]}
            >
              <Select
                placeholder="Категория продукта"
                options={PRODUCT_CATEGORY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="brandId"
              label="Бренд"
              rules={[{ required: true, message: "Выберите бренд" }]}
            >
              <Select
                placeholder="Бренд"
                showSearch
                optionFilterProp="label"
                options={brands.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            </Form.Item>
            <Form.Item label="Изображение продукта">
              <MediaUpload
                maxFiles={1}
                multiple={false}
                accept="image/*"
                storageFolder="general"
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
                Необязательно. Файл сохраняется в хранилище (`general/`).
              </Typography.Text>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Создать
                </Button>
                <Button onClick={() => navigate("/products")}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>
    </Space>
  );
};

export default ProductCreatePage;
