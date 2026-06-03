import React, { useEffect, useMemo, useState } from "react";

import {
  cropRoots,
  globalTopicTags,
  taxonomyTagIdsToSelection,
  selectionToTaxonomyTagIds,
  variantsUnderRoot,
  type FlatTaxonomyTag,
} from "@growing/contracts";
import { Select, Typography } from "antd";

import type { TaxonomyTag, TaxonomyTagNamespace, CropKind } from "@/types/content";
import { taxonomyTagNamespaceLabel } from "@/types/content";

type ContentTaxonomyFieldsProps = {
  cropKind: CropKind;
  tags: TaxonomyTag[];
  value: string[];
  onChange: (taxonomyTagIds: string[]) => void;
  disabled?: boolean;
};

function toFlat(tags: TaxonomyTag[]): FlatTaxonomyTag[] {
  return tags.map(tag => ({
    id: tag.id,
    key: tag.key,
    namespace: tag.namespace,
    label: tag.label,
    sortOrder: tag.sortOrder,
    parentId: tag.parentId,
    cropKind: tag.cropKind,
    variantAxis: tag.variantAxis,
    status: tag.status,
  }));
}

export const ContentTaxonomyFields: React.FC<ContentTaxonomyFieldsProps> = ({
  cropKind,
  tags,
  value,
  onChange,
  disabled = false,
}) => {
  const flat = useMemo(() => toFlat(tags), [tags]);
  const [selection, setSelection] = useState(() => taxonomyTagIdsToSelection(flat, value));

  useEffect(() => {
    setSelection(taxonomyTagIdsToSelection(flat, value));
  }, [flat, value]);

  const cropOptions = useMemo(
    () =>
      cropRoots(flat)
        .filter(tag => tag.cropKind === cropKind)
        .map(tag => ({ value: tag.id, label: tag.label })),
    [flat, cropKind],
  );

  const variantOptions = useMemo(() => {
    if (!selection.cropRootId) {
      return [];
    }
    return variantsUnderRoot(flat, selection.cropRootId).map(tag => ({
      value: tag.id,
      label: tag.label,
    }));
  }, [flat, selection.cropRootId]);

  const topicOptions = useMemo(
    () =>
      globalTopicTags(flat).map(tag => ({
        value: tag.id,
        label: `${tag.label} (${taxonomyTagNamespaceLabel(tag.namespace as TaxonomyTagNamespace)})`,
      })),
    [flat],
  );

  const emit = (next: ReturnType<typeof taxonomyTagIdsToSelection>) => {
    setSelection(next);
    onChange(selectionToTaxonomyTagIds(next));
  };

  return (
    <div>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Сначала культура, затем подтеги для этой культуры
      </Typography.Text>
      <Select
        allowClear
        placeholder="Культура (CROP)"
        style={{ width: "100%", marginBottom: 8 }}
        disabled={disabled}
        value={selection.cropRootId ?? undefined}
        options={cropOptions}
        onChange={cropRootId => {
          emit({
            cropRootId: cropRootId ?? null,
            variantIds: [],
            topicIds: selection.topicIds,
            otherIds: selection.otherIds,
          });
        }}
      />
      <Select
        mode="multiple"
        allowClear
        placeholder="Подвид / тип (CROP_VARIANT)"
        style={{ width: "100%", marginBottom: 8 }}
        disabled={disabled || !selection.cropRootId}
        value={selection.variantIds}
        options={variantOptions}
        onChange={variantIds => {
          emit({
            ...selection,
            variantIds,
          });
        }}
      />
      <Select
        mode="multiple"
        allowClear
        placeholder="Темы (TOPIC, PRODUCT_USE)"
        style={{ width: "100%" }}
        disabled={disabled}
        value={[...selection.topicIds, ...selection.otherIds]}
        options={topicOptions}
        onChange={ids => {
          const topicSet = new Set(globalTopicTags(flat).map(tag => tag.id));
          emit({
            ...selection,
            topicIds: ids.filter(id => topicSet.has(id)),
            otherIds: ids.filter(id => !topicSet.has(id)),
          });
        }}
      />
    </div>
  );
};
