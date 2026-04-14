import React, { useEffect } from "react";
import { AutoComplete, ColorPicker, Form, Input, Modal, Select, Space } from "antd";

import type { TagItem } from "@/services/tags";
import { renderTagIcon, TAG_ICON_OPTIONS } from "@/pages/RegistryTags/iconRegistry";

export type TagFormValues = {
  label: string;
  targetType?: string;
  category?: string;
  color?: string;
  icon?: string;
};

type TargetTypeOption = {
  value: string;
  label: string;
};

type RegistryTagUpsertModalProps = {
  open: boolean;
  saving: boolean;
  editingTag: TagItem | null;
  targetTypeOptions: TargetTypeOption[];
  onCancel: () => void;
  onSubmit: (values: TagFormValues) => Promise<void>;
};

const RegistryTagUpsertModal: React.FC<RegistryTagUpsertModalProps> = ({
  open,
  saving,
  editingTag,
  targetTypeOptions,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<TagFormValues>();
  const colorValue = Form.useWatch("color", form);
  const iconValue = Form.useWatch("icon", form);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      label: editingTag?.label ?? "",
      targetType: editingTag?.targetType ?? undefined,
      category: editingTag?.category ?? "",
      color: editingTag?.color ?? "",
      icon: editingTag?.icon ?? "",
    });
  }, [editingTag, form, open]);

  return (
    <Modal
      title={editingTag ? "Edit Tag" : "Create Tag"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form<TagFormValues> form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="label"
          label="Label"
          rules={[{ required: true, message: "Label is required" }]}
        >
          <Input placeholder="e.g. Repotting" />
        </Form.Item>
        <Form.Item name="targetType" label="Target type">
          <Select
            allowClear
            placeholder="Select target type"
            options={targetTypeOptions}
          />
        </Form.Item>
        <Form.Item name="category" label="Category">
          <Input placeholder="e.g. Growth" />
        </Form.Item>
        <Form.Item name="color" label="Color">
          <Space>
            <ColorPicker
              value={colorValue || "#1677ff"}
              onChange={(value) => {
                form.setFieldValue("color", value.toHexString());
              }}
            />
            <Input
              placeholder="e.g. #52c41a"
              value={colorValue}
              onChange={(event) =>
                form.setFieldValue("color", event.target.value)
              }
              style={{ width: 150 }}
            />
          </Space>
        </Form.Item>
        <Form.Item
          name="icon"
          label={
            <Space size={6}>
              <span>Icon</span>
              <a href="/tags/icons" target="_blank" rel="noreferrer">
                Browse icons
              </a>
            </Space>
          }
        >
          <Space>
            <AutoComplete
              options={TAG_ICON_OPTIONS}
              value={iconValue}
              onChange={(nextValue) => form.setFieldValue("icon", nextValue)}
              placeholder="e.g. leaf"
              style={{ width: 220 }}
              filterOption={(input, option) =>
                String(option?.value ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <span style={{ fontSize: 18, lineHeight: 1 }}>
              {renderTagIcon(iconValue)}
            </span>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegistryTagUpsertModal;
