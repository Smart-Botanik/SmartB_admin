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
import { productsService } from "@/services/products";
import type { Brand } from "@/types/brand";
import type { Product } from "@/types/product";
import { PRODUCT_CATEGORY_OPTIONS, getProductCategoryLabel } from "@/types/product";
import type { MediaUploadResponse } from "@/services/media";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title } = Typography;

interface ProductEditFormValues {
  name: string;
  category: string;
  brandId: string;
}

function productToInitialUploads(product: Product): MediaUploadResponse[] {
  if (!product.avatar?.id || !product.avatar.url) return [];
  return [
    {
      id: product.avatar.id,
      url: product.avatar.url,
      name: "Изображение",
      size: 0,
      mimeType: "image/*",
      createdAt: product.updatedAt ?? product.createdAt ?? new Date().toISOString(),
    },
  ];
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [form] = Form.useForm<ProductEditFormValues>();
  const [product, setProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<MediaUploadResponse[]>([]);
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

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const p = await productsService.getById(id);
      if (!p) {
        setLoadError("Продукт не найден");
        setProduct(null);
        return;
      }
      setProduct(p);
      form.setFieldsValue({
        name: p.name,
        category: p.category,
        brandId: p.brand.id,
      });
      setImageFiles(productToInitialUploads(p));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить продукт";
      setLoadError(msg);
      setProduct(null);
    }
  }, [id, form]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadKey = useMemo(() => {
    if (!product) return "loading";
    return `product-image-${product.id}-${product.avatar?.id ?? "none"}`;
  }, [product]);

  const categorySelectOptions = useMemo(() => {
    const base = PRODUCT_CATEGORY_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
    }));
    if (
      product?.category &&
      !base.some((o) => o.value === product.category)
    ) {
      return [
        ...base,
        {
          value: product.category,
          label: `${getProductCategoryLabel(product.category)} (текущее)`,
        },
      ];
    }
    return base;
  }, [product?.category]);

  const onFinish = async (values: ProductEditFormValues) => {
    if (!id || !product) return;
    setSubmitting(true);
    try {
      const initialImageId = product.avatar?.id ?? null;
      const currentImageId = imageFiles[0]?.id ?? null;

      const input: Parameters<typeof productsService.update>[1] = {
        name: values.name.trim(),
        category: values.category,
        brandId: values.brandId,
      };

      if (currentImageId !== initialImageId) {
        input.avatarMediaId = currentImageId;
      }

      await productsService.update(id, input);
      message.success("Продукт обновлён");
      navigate("/products");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">
          Редактирование продуктов доступно только администраторам.
        </Typography.Text>
        <Button onClick={() => navigate("/products")}>К списку продуктов</Button>
      </Space>
    );
  }

  if (!id) {
    return <Typography.Text type="danger">Некорректный id</Typography.Text>;
  }

  if (loadError) {
    return (
      <Space direction="vertical">
        <Typography.Text type="danger">{loadError}</Typography.Text>
        <Button onClick={() => navigate("/products")}>К списку</Button>
      </Space>
    );
  }

  if (!product || brandsLoading) {
    return <Spin size="large" />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Редактирование: {product.name}
      </Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
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
              options={categorySelectOptions}
            />
          </Form.Item>
          <Form.Item
            name="brandId"
            label="Бренд"
            rules={[{ required: true, message: "Выберите бренд" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={brands.map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />
          </Form.Item>
          <Form.Item label="Изображение">
            <MediaUpload
              key={uploadKey}
              maxFiles={1}
              multiple={false}
              accept="image/*"
              storageFolder="general"
              uploadedFiles={productToInitialUploads(product)}
              onUploadComplete={(files) => setImageFiles(files)}
            />
            {imageFiles[0]?.url ? (
              <Image
                src={imageFiles[0].url}
                alt="Предпросмотр"
                width={120}
                style={{ marginTop: 12, objectFit: "cover", borderRadius: 8 }}
              />
            ) : null}
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Сохранить
              </Button>
              <Button onClick={() => navigate("/products")}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default ProductEditPage;
