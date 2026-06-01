import React from "react";
import { Typography } from "antd";
import { UxRegistryFieldValueInput } from "@growing/ui";
import type { FieldPattern } from "@/services/fieldPatterns";
import type { RegistrySemanticKind } from "@/services/registryFieldSpecs";
import { unitPolicyFromPattern } from "@growing/contracts";
import type { TNumericConstraintFields, TNumericFormatFields } from "../fieldSpecFormUtils";

const { Text } = Typography;

type FieldSpecControllerPreviewProps = {
  label: string;
  semanticKind?: RegistrySemanticKind;
  unit?: string | null;
  pattern: FieldPattern | null;
  format: TNumericFormatFields;
  constraints: TNumericConstraintFields;
};

export const FieldSpecControllerPreview: React.FC<FieldSpecControllerPreviewProps> = ({
  label,
  semanticKind,
  unit,
  pattern,
  format,
  constraints,
}) => (
  <div
    style={{
      padding: 12,
      border: "1px solid #f0f0f0",
      borderRadius: 8,
      background: "#fafafa",
      marginBottom: 16,
    }}
  >
    <Text strong>Controller preview</Text>
    <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
      Как поле будет выглядеть в profile/event builder (read-only demo).
    </Text>

    <UxRegistryFieldValueInput
      label={label || "Field label"}
      semanticKind={semanticKind}
      unit={unit}
      unitPolicy={unitPolicyFromPattern(pattern, unit)}
      format={format}
      constraints={constraints}
      disabled
    />
  </div>
);
