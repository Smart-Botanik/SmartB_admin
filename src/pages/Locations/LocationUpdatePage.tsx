import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from "antd";

import { locationsService } from "@/services/locations";
import type {
  AdminLocation,
  LocationSpecBlock,
  LocationStatus,
  LocationSubType,
  LocationType,
  LocationWateringType,
} from "@/types/location";
import {
  registryProfilesService,
  type RegistryBuildPreviewResult,
} from "@/services/registryProfiles";
import {
  LOCATION_STATUS_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  LOCATION_WATERING_OPTIONS,
  subTypeOptionsForType,
} from "@/types/location";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title, Text } = Typography;
const LOCATION_EQUIPMENT_PROFILE_KEY = "location.indoor.equipment.v1";

type EquipmentLampDraft = {
  label?: string;
  productId?: string;
  watts?: number | null;
};

interface LocationUpdateFormValues {
  name: string;
  status: LocationStatus;
  type?: LocationType | null;
  subType?: LocationSubType | null;
  wateringType?: LocationWateringType | null;
  description?: string | null;
  capacity?: number | null;
  occupiedSlots?: number | null;
  enclosureProductId?: string | null;
  enclosureWidth?: number | null;
  enclosureHeight?: number | null;
  enclosureDepth?: number | null;
  vegetationLamps?: EquipmentLampDraft[];
  bloomLamps?: EquipmentLampDraft[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeLampDrafts = (lamps: EquipmentLampDraft[] | undefined) =>
  (lamps ?? [])
    .map((lamp) => ({
      label: lamp.label?.trim() || undefined,
      productId: lamp.productId?.trim() || undefined,
      watts: lamp.watts ?? undefined,
    }))
    .filter((lamp) => lamp.label || lamp.productId || lamp.watts !== undefined);

const asLampDrafts = (value: unknown): EquipmentLampDraft[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((lamp) => ({
    label: typeof lamp.label === "string" ? lamp.label : undefined,
    productId: typeof lamp.productId === "string" ? lamp.productId : undefined,
    watts: typeof lamp.watts === "number" ? lamp.watts : undefined,
  }));
};

const locationToFormEquipment = (loc: AdminLocation): Partial<LocationUpdateFormValues> => {
  const lighting = loc.specBlocks.find(block => block.kind === "lighting")?.lighting;
  const enclosure = loc.specBlocks.find(block => block.kind === "enclosure")?.enclosure;
  return {
    enclosureProductId: enclosure?.product?.id ?? enclosure?.productId ?? undefined,
    enclosureWidth: enclosure?.width ?? undefined,
    enclosureHeight: enclosure?.height ?? undefined,
    enclosureDepth: enclosure?.depth ?? undefined,
    vegetationLamps: asLampDrafts(lighting?.vegetationLamps),
    bloomLamps: asLampDrafts(lighting?.bloomLamps),
  };
};

const buildLocationEquipmentValues = (values: LocationUpdateFormValues) => ({
  "location.indoor.enclosure.product_id": values.enclosureProductId?.trim() || undefined,
  "location.indoor.enclosure.width": values.enclosureWidth ?? undefined,
  "location.indoor.enclosure.height": values.enclosureHeight ?? undefined,
  "location.indoor.enclosure.depth": values.enclosureDepth ?? undefined,
  "location.indoor.lighting.vegetation_lamps": normalizeLampDrafts(values.vegetationLamps),
  "location.indoor.lighting.bloom_lamps": normalizeLampDrafts(values.bloomLamps),
});

const compactPreviewValues = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );

const specBlockToInput = (block: LocationSpecBlock, position: number): LocationSpecBlock => ({
  position,
  kind: block.kind,
  ...(block.kind === "space" && block.space ? { space: block.space } : {}),
  ...(block.kind === "area" && block.area ? { area: block.area } : {}),
});

const buildSpecBlocksFromPreview = (
  existing: LocationSpecBlock[],
  previewPayload: Record<string, unknown>,
): LocationSpecBlock[] => {
  const equipment = isRecord(previewPayload.equipment) ? previewPayload.equipment : {};
  const enclosure = isRecord(equipment.enclosure) ? equipment.enclosure : {};
  const lighting = isRecord(equipment.lighting) ? equipment.lighting : {};
  const result: LocationSpecBlock[] = [];

  const productId =
    typeof enclosure.product_id === "string" && enclosure.product_id.trim()
      ? enclosure.product_id.trim()
      : undefined;
  const hasEnclosure =
    productId ||
    typeof enclosure.width === "number" ||
    typeof enclosure.height === "number" ||
    typeof enclosure.depth === "number";
  if (hasEnclosure) {
    result.push({
      position: result.length,
      kind: "enclosure",
      enclosure: {
        productId,
        width: typeof enclosure.width === "number" ? enclosure.width : undefined,
        height: typeof enclosure.height === "number" ? enclosure.height : undefined,
        depth: typeof enclosure.depth === "number" ? enclosure.depth : undefined,
      },
    });
  }

  if ("vegetation_lamps" in lighting || "bloom_lamps" in lighting) {
    result.push({
      position: result.length,
      kind: "lighting",
      lighting: {
        vegetationLamps: Array.isArray(lighting.vegetation_lamps)
          ? lighting.vegetation_lamps
          : [],
        bloomLamps: Array.isArray(lighting.bloom_lamps) ? lighting.bloom_lamps : [],
      },
    });
  }

  existing
    .filter(block => block.kind !== "lighting" && block.kind !== "enclosure")
    .sort((a, b) => a.position - b.position)
    .forEach(block => result.push(specBlockToInput(block, result.length)));

  return result;
};

export const LocationUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [form] = Form.useForm<LocationUpdateFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [existingSpecBlocks, setExistingSpecBlocks] = useState<LocationSpecBlock[]>([]);
  const [previewResult, setPreviewResult] = useState<RegistryBuildPreviewResult | null>(null);
  const watchedType = Form.useWatch("type", form);
  const subTypeOptions = useMemo(
    () => subTypeOptionsForType(watchedType ?? undefined),
    [watchedType],
  );

  useEffect(() => {
    if (!id || !canManage) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loc = await locationsService.getById(id);
        if (cancelled) return;
        if (!loc) {
          message.error("Локация не найдена");
          navigate("/locations");
          return;
        }
        form.setFieldsValue({
          name: loc.name,
          status: loc.status,
          type: loc.type ?? undefined,
          subType: loc.subType ?? undefined,
          wateringType: loc.wateringType ?? undefined,
          description: loc.description ?? undefined,
          capacity: loc.capacity ?? undefined,
          occupiedSlots: loc.occupiedSlots ?? undefined,
          ...locationToFormEquipment(loc),
        });
        setExistingSpecBlocks(loc.specBlocks ?? []);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Не удалось загрузить локацию";
          message.error(msg);
          navigate("/locations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canManage, form, navigate]);

  const onFinish = async (values: LocationUpdateFormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      let nextSpecBlocks: LocationSpecBlock[] | undefined;
      if (values.type === "indoor") {
        const preview = await registryProfilesService.buildPreview({
          profileKey: LOCATION_EQUIPMENT_PROFILE_KEY,
          valuesJson: compactPreviewValues(buildLocationEquipmentValues(values)),
        });
        setPreviewResult(preview);
        if (preview.errors.length) {
          message.error("Проверьте ошибки equipment preview перед сохранением");
          return;
        }
        nextSpecBlocks = buildSpecBlocksFromPreview(existingSpecBlocks, preview.payload);
      }

      await locationsService.update(id, {
        name: values.name.trim(),
        status: values.status,
        type: values.type ?? null,
        subType: values.subType ?? null,
        wateringType: values.wateringType ?? null,
        description: values.description?.trim() || null,
        capacity: values.capacity ?? null,
        occupiedSlots: values.occupiedSlots ?? null,
        ...(nextSpecBlocks ? { specBlocks: nextSpecBlocks } : {}),
      });
      message.success("Локация обновлена");
      navigate("/locations");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось обновить локацию";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const runEquipmentPreview = async () => {
    const values = form.getFieldsValue();
    if (values.type !== "indoor") {
      message.warning("Equipment preview включён только для indoor Location");
      return;
    }
    setPreviewing(true);
    try {
      const preview = await registryProfilesService.buildPreview({
        profileKey: LOCATION_EQUIPMENT_PROFILE_KEY,
        valuesJson: compactPreviewValues(buildLocationEquipmentValues(values)),
      });
      setPreviewResult(preview);
      if (preview.errors.length) {
        message.warning("Equipment preview вернул ошибки");
      } else {
        message.success("Equipment payload собран");
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось собрать equipment preview";
      message.error(msg);
    } finally {
      setPreviewing(false);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Text type="secondary">
          Обновление локаций доступно только администраторам.
        </Text>
        <Button onClick={() => navigate("/locations")}>К списку локаций</Button>
      </Space>
    );
  }

  if (!id) {
    return <Text type="danger">Не указан идентификатор локации.</Text>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Обновить локацию
      </Title>
      <Alert
        type="info"
        showIcon
        message="Слой администратора"
        description="Сохраняются только поля формы. Блоки specs и связи дневников из этой страницы не меняются. Полная семантика «обновления поверх» с provenance — после BK-LOC-2 / BK-LOC-3."
      />
      {loading ? (
        <Spin />
      ) : (
        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: "Укажите название" }]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true, message: "Выберите статус" }]}
            >
              <Select options={LOCATION_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="type" label="Тип">
              <Select
                allowClear
                placeholder="Не задан"
                options={LOCATION_TYPE_OPTIONS}
                onChange={() => form.setFieldValue("subType", undefined)}
              />
            </Form.Item>
            <Form.Item name="subType" label="Подтип">
              <Select
                allowClear
                placeholder={
                  watchedType ? "Выберите подтип" : "Сначала выберите тип"
                }
                disabled={!watchedType}
                options={subTypeOptions}
              />
            </Form.Item>
            <Form.Item name="wateringType" label="Полив">
              <Select
                allowClear
                placeholder="Не задан"
                options={LOCATION_WATERING_OPTIONS}
              />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={4} maxLength={4000} showCount />
            </Form.Item>
            <Form.Item name="capacity" label="Вместимость (слотов)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="occupiedSlots" label="Занято слотов">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Divider />
            <Card
              title="Indoor equipment"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Alert
                type={watchedType === "indoor" ? "info" : "warning"}
                showIcon
                style={{ marginBottom: 16 }}
                message="Location equipment registry profile"
                description={
                  watchedType === "indoor"
                    ? "Профиль location.indoor.equipment.v1 собирает enclosure и lighting payload перед сохранением в specBlocks."
                    : "Выберите type=indoor, чтобы включить сценарий оборудования: лампы и гроубокс."
                }
              />
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Typography.Text strong>Гроубокс / enclosure</Typography.Text>
                <Form.Item name="enclosureProductId" label="Product ID гроубокса">
                  <Input
                    placeholder="Product id"
                    disabled={watchedType !== "indoor"}
                  />
                </Form.Item>
                <Space wrap style={{ width: "100%" }}>
                  <Form.Item name="enclosureWidth" label="Ширина, cm">
                    <InputNumber
                      min={0}
                      precision={1}
                      style={{ width: 160 }}
                      disabled={watchedType !== "indoor"}
                    />
                  </Form.Item>
                  <Form.Item name="enclosureHeight" label="Высота, cm">
                    <InputNumber
                      min={0}
                      precision={1}
                      style={{ width: 160 }}
                      disabled={watchedType !== "indoor"}
                    />
                  </Form.Item>
                  <Form.Item name="enclosureDepth" label="Глубина, cm">
                    <InputNumber
                      min={0}
                      precision={1}
                      style={{ width: 160 }}
                      disabled={watchedType !== "indoor"}
                    />
                  </Form.Item>
                </Space>

                <Typography.Text strong>Vegetation lamps</Typography.Text>
                <Form.List name="vegetationLamps">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      {fields.map(field => (
                        <Space key={field.key} wrap align="baseline">
                          <Form.Item name={[field.name, "label"]} label="Label">
                            <Input
                              placeholder="Veg LED"
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, "productId"]} label="Product ID">
                            <Input
                              placeholder="Product id"
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, "watts"]} label="Watts">
                            <InputNumber
                              min={0}
                              precision={0}
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Button
                            danger
                            onClick={() => remove(field.name)}
                            disabled={watchedType !== "indoor"}
                          >
                            Убрать
                          </Button>
                        </Space>
                      ))}
                      <Button
                        onClick={() => add({})}
                        disabled={watchedType !== "indoor"}
                      >
                        Добавить vegetation lamp
                      </Button>
                    </Space>
                  )}
                </Form.List>

                <Typography.Text strong>Bloom lamps</Typography.Text>
                <Form.List name="bloomLamps">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      {fields.map(field => (
                        <Space key={field.key} wrap align="baseline">
                          <Form.Item name={[field.name, "label"]} label="Label">
                            <Input
                              placeholder="Bloom LED"
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, "productId"]} label="Product ID">
                            <Input
                              placeholder="Product id"
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, "watts"]} label="Watts">
                            <InputNumber
                              min={0}
                              precision={0}
                              disabled={watchedType !== "indoor"}
                            />
                          </Form.Item>
                          <Button
                            danger
                            onClick={() => remove(field.name)}
                            disabled={watchedType !== "indoor"}
                          >
                            Убрать
                          </Button>
                        </Space>
                      ))}
                      <Button
                        onClick={() => add({})}
                        disabled={watchedType !== "indoor"}
                      >
                        Добавить bloom lamp
                      </Button>
                    </Space>
                  )}
                </Form.List>

                <Button
                  onClick={runEquipmentPreview}
                  loading={previewing}
                  disabled={watchedType !== "indoor"}
                >
                  Preview equipment payload
                </Button>

                {previewResult ? (
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Typography.Text strong>Preview payload</Typography.Text>
                    <Input.TextArea
                      readOnly
                      rows={8}
                      value={JSON.stringify(previewResult.payload, null, 2)}
                    />
                    <Table
                      size="small"
                      rowKey={(_, index) => String(index)}
                      pagination={false}
                      dataSource={previewResult.errors}
                      columns={[
                        { title: "Field ID", dataIndex: "fieldId", key: "fieldId" },
                        { title: "Code", dataIndex: "code", key: "code", width: 140 },
                        { title: "Message", dataIndex: "message", key: "message" },
                      ]}
                      locale={{ emptyText: "No preview errors" }}
                    />
                  </Space>
                ) : null}
              </Space>
            </Card>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Сохранить изменения
                </Button>
                <Button onClick={() => navigate("/locations")}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Space>
  );
};
