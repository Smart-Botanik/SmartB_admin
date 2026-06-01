import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";

import { diariesService, type DiaryListItem } from "@/services/diaries";
import {
  registryProfilesService,
  type RegistryBuildPreviewResult,
} from "@/services/registryProfiles";

const { Title, Text } = Typography;

const DIARY_SETUP_CONFIG_PROFILE_KEY = "diary.setup.config.v1";
const DIARY_SETUP_CONFIG_ACTION_PATH = "diary.setup.config";

type FormValues = {
  diaryId: string;
  actionPath: string;
  wateringType?: string;
  roomType?: string;
};

const CreateDiaryEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [diariesLoading, setDiariesLoading] = useState(false);
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [preview, setPreview] = useState<RegistryBuildPreviewResult | null>(
    null,
  );
  const [result, setResult] = useState<DiaryListItem | null>(null);
  const diaryIdValue = Form.useWatch("diaryId", form);

  const diaryIdFromQuery = searchParams.get("diaryId")?.trim() ?? "";

  useEffect(() => {
    if (diaryIdFromQuery) {
      form.setFieldValue("diaryId", diaryIdFromQuery);
    }
  }, [diaryIdFromQuery, form]);

  const selectedDiary = useMemo(() => {
    return diaries.find((diary) => diary.id === diaryIdValue) ?? null;
  }, [diaries, diaryIdValue]);

  const loadLatestDiaries = async () => {
    setDiariesLoading(true);
    try {
      const items = await diariesService.list({ limit: 50, offset: 0 });
      setDiaries(items);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось загрузить дневники";
      message.error(msg);
    } finally {
      setDiariesLoading(false);
    }
  };

  const buildPreview = async (values: FormValues) => {
    const previewResult = await registryProfilesService.buildPreview({
      profileKey: DIARY_SETUP_CONFIG_PROFILE_KEY,
      valuesJson: {
        "diary.setup.watering_type": values.wateringType,
        "diary.setup.room_type": values.roomType,
      },
    });
    setPreview(previewResult);
    return previewResult;
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const previewResult = await buildPreview(values);
      if (previewResult.errors.length) {
        message.error("Preview contains validation errors");
        return;
      }

      const updatedDiary = await diariesService.createDiaryEvent({
        diaryId: values.diaryId,
        actionPath: values.actionPath,
        payloadJson: JSON.stringify(previewResult.payload),
      });
      setResult(updatedDiary);
      message.success("Событие дневника записано");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось записать событие дневника";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Create Diary Event
        </Title>
        <Button onClick={() => navigate("/diaries")}>Back to diaries</Button>
      </Space>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="Pilot profile: diary.setup.config.v1"
          description="Форма собирает payload через registryBuildPreview и отправляет createDiaryEvent с actionPath diary.setup.config."
        />

        <Card>
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              diaryId: diaryIdFromQuery,
              actionPath: DIARY_SETUP_CONFIG_ACTION_PATH,
              wateringType: "manual",
              roomType: "indoor",
            }}
          >
            <Form.Item label="Pick diary (latest)" style={{ marginBottom: 8 }}>
              <Space wrap>
                <Button onClick={loadLatestDiaries} loading={diariesLoading}>
                  Load latest
                </Button>
                <AutoComplete
                  style={{ width: 480 }}
                  options={diaries.map((diary) => ({
                    value: diary.id,
                    label: `${diary.title?.trim() || "Без заголовка"} (${diary.id})`,
                  }))}
                  placeholder="Select diary..."
                  filterOption={(inputValue, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  onSelect={(value) => form.setFieldValue("diaryId", value)}
                />
              </Space>
            </Form.Item>

            <Form.Item
              name="diaryId"
              label="Diary ID"
              rules={[{ required: true, message: "Diary ID is required" }]}
            >
              <Input placeholder="Diary id" />
            </Form.Item>

            <Form.Item
              name="actionPath"
              label="Action path"
              rules={[{ required: true, message: "Action path is required" }]}
            >
              <Input disabled />
            </Form.Item>

            <Form.Item name="wateringType" label="Watering type">
              <Select
                allowClear
                options={[
                  { value: "manual", label: "manual" },
                  { value: "drip", label: "drip" },
                  { value: "hydroponics", label: "hydroponics" },
                  { value: "aeroponics", label: "aeroponics" },
                ]}
              />
            </Form.Item>

            <Form.Item name="roomType" label="Room type">
              <Select
                allowClear
                options={[
                  { value: "indoor", label: "indoor" },
                  { value: "outdoor", label: "outdoor" },
                  { value: "greenhouse", label: "greenhouse" },
                ]}
              />
            </Form.Item>

            {selectedDiary ? (
              <Text type="secondary">
                Selected: {selectedDiary.title?.trim() || "Без заголовка"}
              </Text>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <Space>
                <Button
                  onClick={() => void buildPreview(form.getFieldsValue())}
                >
                  Build preview
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Create event
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        <Card title="Preview payload">
          {preview ? (
            <Space direction="vertical" style={{ width: "100%" }}>
              {preview.errors.length ? (
                <Alert
                  type="error"
                  showIcon
                  message="Preview errors"
                  description={preview.errors
                    .map((error) => `${error.fieldId ?? "field"}: ${error.message}`)
                    .join("; ")}
                />
              ) : null}
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(preview.payload, null, 2)}
              </pre>
            </Space>
          ) : (
            <Text type="secondary">No preview yet</Text>
          )}
        </Card>

        <Card title="Result (Diary)">
          {result ? (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="id">{result.id}</Descriptions.Item>
              <Descriptions.Item label="title">
                {result.title?.trim() || "Без заголовка"}
              </Descriptions.Item>
              <Descriptions.Item label="current">
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(result.current, null, 2)}
                </pre>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">No result yet</Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default CreateDiaryEventPage;
