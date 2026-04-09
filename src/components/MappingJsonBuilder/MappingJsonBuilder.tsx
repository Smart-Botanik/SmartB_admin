import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Input,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { copyToClipboard } from "@/utils/helpers";
import { mappingHasNestedBranches } from "./mappingJsonModel";
import { MappingNestedTreeEditor } from "./MappingNestedTreeEditor";

const { Text } = Typography;

export type MappingRow = {
  id: string;
  payloadKey: string;
  kind: "shorthand" | "explicit";
  /** When kind === shorthand: stored JSON value is this string */
  shorthandTarget: string;
  /** When kind === explicit */
  currentKey: string;
  /** Raw JSON for optional `type` field (object or string) */
  typeJson: string;
};

let idSeq = 0;
const nextId = () => `m-${++idSeq}`;

function parseMappingToRows(raw: string): {
  rows: MappingRow[];
  error: string | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return { rows: [], error: "Invalid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { rows: [], error: "Mapping must be a JSON object" };
  }

  const rows: MappingRow[] = [];
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "string") {
      rows.push({
        id: nextId(),
        payloadKey: k,
        kind: "shorthand",
        shorthandTarget: v,
        currentKey: "",
        typeJson: "",
      });
      continue;
    }
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const rec = v as Record<string, unknown>;
      const currentKey =
        typeof rec.currentKey === "string" ? rec.currentKey : "";
      let typeJson = "";
      if (rec.type !== undefined) {
        try {
          typeJson = JSON.stringify(rec.type, null, 2);
        } catch {
          typeJson = "";
        }
      }
      rows.push({
        id: nextId(),
        payloadKey: k,
        kind: "explicit",
        shorthandTarget: "",
        currentKey,
        typeJson,
      });
      continue;
    }
    return {
      rows: [],
      error: "Each value must be a string or { currentKey, type? }",
    };
  }

  return { rows, error: null };
}

function duplicatePayloadKeys(rows: MappingRow[]): string[] {
  const seen = new Map<string, number>();
  for (const r of rows) {
    const k = r.payloadKey.trim();
    if (!k) continue;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

function serializeRows(rows: MappingRow[]): {
  json: string;
  rowErrors: Record<string, string>;
} {
  const rowErrors: Record<string, string> = {};
  const obj: Record<string, unknown> = {};

  for (const row of rows) {
    const key = row.payloadKey.trim();
    if (!key) continue;

    if (row.kind === "shorthand") {
      const t = row.shorthandTarget.trim();
      obj[key] = t || key;
      continue;
    }

    const ck = row.currentKey.trim();
    if (!ck) {
      rowErrors[row.id] = "currentKey is required for explicit mapping";
      continue;
    }

    const out: Record<string, unknown> = { currentKey: ck };
    const tj = row.typeJson.trim();
    if (tj) {
      try {
        out.type = JSON.parse(tj);
      } catch {
        rowErrors[row.id] = "Invalid type JSON";
        continue;
      }
    }
    obj[key] = out;
  }

  return { json: JSON.stringify(obj, null, 2), rowErrors };
}

function mappingStats(rows: MappingRow[]) {
  const active = rows.filter((r) => r.payloadKey.trim());
  const dotted = active.filter((r) => r.payloadKey.includes("."));
  const maxDepth = active.reduce((acc, r) => {
    const d = r.payloadKey.split(".").filter(Boolean).length;
    return Math.max(acc, d);
  }, 0);
  return {
    total: active.length,
    nestedPathKeys: dotted.length,
    maxDepth,
  };
}

export type MappingJsonBuilderProps = {
  value?: string;
  onChange?: (json: string) => void;
  disabled?: boolean;
};

export const MappingJsonBuilder: React.FC<MappingJsonBuilderProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [editorMode, setEditorMode] = useState<"flat" | "nested">("flat");
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [rawOpen, setRawOpen] = useState<string[]>([]);
  const lastEmittedRef = useRef<string | null>(null);

  const nestedStructureInValue = useMemo(() => {
    try {
      const o = JSON.parse(value ?? "{}");
      return (
        typeof o === "object" &&
        o !== null &&
        !Array.isArray(o) &&
        mappingHasNestedBranches(o as Record<string, unknown>)
      );
    } catch {
      return false;
    }
  }, [value]);

  useEffect(() => {
    if (nestedStructureInValue) setEditorMode("nested");
  }, [nestedStructureInValue]);

  const applyParsedRows = useCallback((next: MappingRow[], error: string | null) => {
    if (error) {
      setParseError(error);
      setRows((prev) => (prev.length ? prev : next));
    } else {
      setParseError(null);
      setRows(
        next.length
          ? next
          : [
              {
                id: nextId(),
                payloadKey: "",
                kind: "shorthand",
                shorthandTarget: "",
                currentKey: "",
                typeJson: "",
              },
            ],
      );
    }
    setRowErrors({});
  }, []);

  useEffect(() => {
    if (value === lastEmittedRef.current) {
      lastEmittedRef.current = null;
      return;
    }
    const { rows: next, error } = parseMappingToRows(value ?? "{}");
    applyParsedRows(next, error);
  }, [value, applyParsedRows]);

  const emit = useCallback(
    (next: MappingRow[]) => {
      setRows(next);
      const { json, rowErrors: re } = serializeRows(next);
      if (Object.keys(re).length > 0) {
        setRowErrors(re);
        return;
      }
      setRowErrors({});
      lastEmittedRef.current = json;
      onChange?.(json);
    },
    [onChange],
  );

  const stats = useMemo(() => mappingStats(rows), [rows]);

  const duplicateKeys = useMemo(() => duplicatePayloadKeys(rows), [rows]);

  const updateRow = (id: string, patch: Partial<MappingRow>) => {
    emit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    emit([
      ...rows,
      {
        id: nextId(),
        payloadKey: "",
        kind: "shorthand",
        shorthandTarget: "",
        currentKey: "",
        typeJson: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    emit(next.length ? next : [
      {
        id: nextId(),
        payloadKey: "",
        kind: "shorthand",
        shorthandTarget: "",
        currentKey: "",
        typeJson: "",
      },
    ]);
  };

  const duplicateRow = (row: MappingRow) => {
    emit([
      ...rows,
      {
        ...row,
        id: nextId(),
        payloadKey: row.payloadKey ? `${row.payloadKey}_copy` : "",
      },
    ]);
  };

  const columns: ColumnsType<MappingRow> = [
    {
      title: (
        <Space size={4}>
          <span>Payload key</span>
          <Tooltip title="Event payload path; use dots for nested paths (e.g. watering.solution).">
            <BranchesOutlined style={{ color: "#8c8c8c" }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: "payloadKey",
      width: "28%",
      render: (_, row) => (
        <Input
          disabled={disabled}
          placeholder="e.g. watering.solution"
          value={row.payloadKey}
          onChange={(e) => updateRow(row.id, { payloadKey: e.target.value })}
        />
      ),
    },
    {
      title: "Mode",
      width: 120,
      render: (_, row) => (
        <Select
          disabled={disabled}
          style={{ width: "100%" }}
          value={row.kind}
          options={[
            { value: "shorthand", label: "String" },
            { value: "explicit", label: "Object" },
          ]}
          onChange={(kind) =>
            updateRow(row.id, {
              kind: kind as MappingRow["kind"],
            })
          }
        />
      ),
    },
    {
      title: "Maps to (current)",
      render: (_, row) =>
        row.kind === "shorthand" ? (
          <Input
            disabled={disabled}
            placeholder="Entity field / currentKey"
            value={row.shorthandTarget}
            onChange={(e) =>
              updateRow(row.id, { shorthandTarget: e.target.value })
            }
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={4}>
            <Input
              disabled={disabled}
              placeholder="currentKey (required)"
              value={row.currentKey}
              onChange={(e) =>
                updateRow(row.id, { currentKey: e.target.value })
              }
            />
            <Input.TextArea
              disabled={disabled}
              placeholder='Optional type JSON, e.g. { "enum": ["a","b"] }'
              autoSize={{ minRows: 1, maxRows: 4 }}
              value={row.typeJson}
              onChange={(e) =>
                updateRow(row.id, { typeJson: e.target.value })
              }
            />
          </Space>
        ),
    },
    {
      title: "",
      width: 100,
      align: "right",
      render: (_, row) => (
        <Space size={0}>
          <Tooltip title="Copy payload key">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              disabled={disabled || !row.payloadKey.trim()}
              onClick={async () => {
                const ok = await copyToClipboard(row.payloadKey);
                if (ok) message.success("Payload key copied");
                else message.error("Copy failed");
              }}
            />
          </Tooltip>
          <Tooltip title="Duplicate row">
            <Button
              type="text"
              size="small"
              icon={<FileAddOutlined />}
              onClick={() => duplicateRow(row)}
              disabled={disabled}
            />
          </Tooltip>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={disabled}
            onClick={() => removeRow(row.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Segmented
        block
        value={nestedStructureInValue ? "nested" : editorMode}
        onChange={(v) => {
          if (nestedStructureInValue) return;
          setEditorMode(v as "flat" | "nested");
        }}
        options={[
          {
            label: "Flat keys",
            value: "flat",
            disabled: nestedStructureInValue,
          },
          { label: "Nested + types", value: "nested" },
        ]}
      />

      {nestedStructureInValue ? (
        <Alert
          type="info"
          showIcon
          message="This mapping uses nested JSON objects"
          description="Edit it in Nested + types (or Raw JSON). Flat table is disabled until structure is only one level of keys."
        />
      ) : null}

      {editorMode === "nested" && !nestedStructureInValue ? (
        <Alert
          type="info"
          showIcon
          message="Nested shape for payload + filter types"
          description="Groups become nested objects; leaves map to entity currentKey. Typed leaves set optional type metadata for future codegen."
        />
      ) : null}

      {editorMode === "nested" || nestedStructureInValue ? (
        <MappingNestedTreeEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <>
          <Card
            size="small"
            styles={{
              body: {
                background: "linear-gradient(135deg, #f6f8fc 0%, #fafbfe 100%)",
                borderRadius: 8,
              },
            }}
          >
            <Space
              wrap
              size={[24, 8]}
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <Space size={24} wrap>
                <Statistic title="Mappings" value={stats.total} />
                <Statistic
                  title="Dot-path keys"
                  value={stats.nestedPathKeys}
                  valueStyle={{ color: "#1677ff" }}
                />
                <Statistic
                  title="Max depth"
                  value={stats.maxDepth}
                  suffix={<Text type="secondary">segments</Text>}
                />
              </Space>
              <Text type="secondary" style={{ maxWidth: 280 }}>
                Dot notation counts keys that contain &quot;.&quot;; depth is the
                number of segments in the payload key.
              </Text>
            </Space>
          </Card>

          {parseError ? (
            <Alert type="warning" showIcon message={parseError} />
          ) : null}

          {duplicateKeys.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Duplicate payload keys"
              description={`Later rows win when serializing to JSON: ${duplicateKeys.join(", ")}`}
            />
          ) : null}

          {Object.keys(rowErrors).length > 0 ? (
            <Alert
              type="error"
              showIcon
              message="Fix row errors before the mapping JSON updates (invalid type JSON or empty currentKey on Object rows)."
            />
          ) : null}

          <Table<MappingRow>
            size="small"
            pagination={false}
            rowKey="id"
            columns={columns}
            dataSource={rows}
            locale={{ emptyText: "No rows" }}
            scroll={{ x: true }}
          />

          <Button
            type="dashed"
            onClick={addRow}
            disabled={disabled}
            icon={<PlusOutlined />}
            block
          >
            Add mapping
          </Button>
        </>
      )}

      <Collapse
        activeKey={rawOpen}
        onChange={(k) => setRawOpen(Array.isArray(k) ? k : [k])}
        items={[
          {
            key: "raw",
            label: "Raw JSON",
            children: (
              <Input.TextArea
                rows={8}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: 13 }}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};
