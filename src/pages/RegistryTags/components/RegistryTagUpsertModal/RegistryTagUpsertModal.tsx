import React, { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";

import type { TagItem } from "@/services/tags";

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
          <Input placeholder="e.g. #52c41a" />
        </Form.Item>
        <Form.Item name="icon" label="Icon">
          <Input placeholder="e.g. leaf" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegistryTagUpsertModal;
