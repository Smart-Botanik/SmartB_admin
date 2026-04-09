import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Statistic,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOpenOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";
import { copyToClipboard } from "@/utils/helpers";
import {
  type MappingTreeNode,
  countMappingStructure,
  jsonToMappingTree,
  mappingTreeToJson,
  previewPayloadTypescript,
  collectMappingLeafPaths,
} from "./mappingJsonModel";

const { Text } = Typography;

function updateNodeById(
  roots: MappingTreeNode[],
  id: string,
  updater: (n: MappingTreeNode) => MappingTreeNode,
): MappingTreeNode[] {
  return roots.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children.length === 0) return n;
    return {
      ...n,
      children: updateNodeById(n.children, id, updater),
    };
  });
}

function removeNodeById(roots: MappingTreeNode[], id: string): MappingTreeNode[] {
  return roots
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: removeNodeById(n.children, id),
    }));
}

function addChildToBranch(
  roots: MappingTreeNode[],
  parentId: string,
  child: MappingTreeNode,
): MappingTreeNode[] {
  return roots.map((n) => {
    if (n.id === parentId && n.role === "branch") {
      return { ...n, children: [...n.children, child] };
    }
    if (n.children.length === 0) return n;
    return {
      ...n,
      children: addChildToBranch(n.children, parentId, child),
    };
  });
}

let idSeq = 0;
const newLeaf = (): MappingTreeNode => ({
  id: `nl-${++idSeq}`,
  segment: "",
  role: "leaf",
  children: [],
  leafKind: "shorthand",
  shorthandTarget: "",
});

export type MappingNestedTreeEditorProps = {
  value?: string;
  onChange?: (json: string) => void;
  disabled?: boolean;
};

export const MappingNestedTreeEditor: React.FC<MappingNestedTreeEditorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [roots, setRoots] = useState<MappingTreeNode[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [nodeErrors, setNodeErrors] = useState<Record<string, string>>({});
  const lastEmittedRef = useRef<string | null>(null);

  const applyRoots = useCallback((next: MappingTreeNode[], error: string | null) => {
    if (error) {
      setParseError(error);
      setRoots((prev) => (prev.length ? prev : []));
    } else {
      setParseError(null);
      setRoots(next.length ? next : [newLeaf()]);
    }
    setNodeErrors({});
  }, []);

  useEffect(() => {
    if (value === lastEmittedRef.current) {
      lastEmittedRef.current = null;
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(value ?? "{}");
    } catch {
      applyRoots([], "Invalid JSON");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      applyRoots([], "Mapping must be a JSON object");
      return;
    }
    const { roots: treeRoots, error } = jsonToMappingTree(
      parsed as Record<string, unknown>,
    );
    applyRoots(treeRoots, error);
  }, [value, applyRoots]);

  const emit = useCallback(
    (next: MappingTreeNode[]) => {
      setRoots(next);
      const { json, nodeErrors: ne } = mappingTreeToJson(next);
      if (Object.keys(ne).length > 0) {
        setNodeErrors(ne);
        return;
      }
      setNodeErrors({});
      lastEmittedRef.current = json;
      onChange?.(json);
    },
    [onChange],
  );

  const stats = useMemo(() => {
    try {
      const o = JSON.parse(value ?? "{}");
      if (typeof o !== "object" || o === null || Array.isArray(o)) {
        return { leaves: 0, branches: 0, maxDepth: 0, typedLeaves: 0, paths: 0 };
      }
      const c = countMappingStructure(o as Record<string, unknown>);
      const paths = collectMappingLeafPaths(o as Record<string, unknown>).length;
      return { ...c, paths };
    } catch {
      return { leaves: 0, branches: 0, maxDepth: 0, typedLeaves: 0, paths: 0 };
    }
  }, [value]);

  const tsPreview = useMemo(() => {
    try {
      const o = JSON.parse(value ?? "{}");
      if (typeof o !== "object" || o === null || Array.isArray(o)) return "";
      return previewPayloadTypescript(o as Record<string, unknown>);
    } catch {
      return "";
    }
  }, [value]);

  const patchNode = (id: string, patch: Partial<MappingTreeNode>) => {
    emit(
      updateNodeById(roots, id, (n) => ({
        ...n,
        ...patch,
      })),
    );
  };

  const setRole = (id: string, role: "branch" | "leaf") => {
    emit(
      updateNodeById(roots, id, (n) =>
        role === "branch"
          ? {
              ...n,
              role: "branch",
              children: n.children.length ? n.children : [newLeaf()],
              leafKind: undefined,
              shorthandTarget: undefined,
              currentKey: undefined,
              typeJson: undefined,
            }
          : {
              ...n,
              role: "leaf",
              children: [],
              leafKind: "shorthand",
              shorthandTarget: "",
              currentKey: "",
              typeJson: "",
            },
      ),
    );
  };

  const addRoot = () => emit([...roots, newLeaf()]);
  const addChild = (parentId: string) =>
    emit(addChildToBranch(roots, parentId, newLeaf()));
  const remove = (id: string) => {
    const next = removeNodeById(roots, id);
    emit(next.length ? next : [newLeaf()]);
  };

  const renderNode = (node: MappingTreeNode, depth: number): React.ReactNode => {
    const borderLeft = depth > 0 ? "2px solid #e6f0ff" : undefined;
    const marginLeft = depth > 0 ? 12 : 0;

    return (
      <Card
        key={node.id}
        size="small"
        style={{
          marginBottom: 8,
          marginLeft,
          borderLeft,
        }}
        styles={{ body: { padding: 10 } }}
      >
        <Space wrap style={{ width: "100%" }} align="start">
          <Input
            disabled={disabled}
            placeholder="Key segment"
            value={node.segment}
            onChange={(e) => patchNode(node.id, { segment: e.target.value })}
            style={{ width: 176 }}
            prefix={
              node.role === "branch" ? (
                <FolderOpenOutlined style={{ color: "#1677ff" }} />
              ) : (
                <NodeIndexOutlined style={{ color: "#52c41a" }} />
              )
            }
          />
          <Select
            disabled={disabled}
            value={node.role}
            style={{ width: 100 }}
            options={[
              { value: "branch", label: "Group" },
              { value: "leaf", label: "Leaf" },
            ]}
            onChange={(r) => setRole(node.id, r as "branch" | "leaf")}
          />

          {node.role === "leaf" ? (
            <>
              <Select
                disabled={disabled}
                value={node.leafKind ?? "shorthand"}
                style={{ width: 110 }}
                options={[
                  { value: "shorthand", label: "String" },
                  { value: "explicit", label: "Typed" },
                ]}
                onChange={(k) =>
                  patchNode(node.id, {
                    leafKind: k as MappingTreeNode["leafKind"],
                  })
                }
              />
              {node.leafKind === "explicit" ? (
                <Space direction="vertical" style={{ minWidth: 220 }}>
                  <Input
                    disabled={disabled}
                    placeholder="currentKey"
                    value={node.currentKey ?? ""}
                    onChange={(e) =>
                      patchNode(node.id, { currentKey: e.target.value })
                    }
                  />
                  <Input.TextArea
                    disabled={disabled}
                    placeholder='type JSON (e.g. "number" or {"enum":["a"]})'
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    value={node.typeJson ?? ""}
                    onChange={(e) =>
                      patchNode(node.id, { typeJson: e.target.value })
                    }
                  />
                </Space>
              ) : (
                <Input
                  disabled={disabled}
                  placeholder="→ entity field"
                  value={node.shorthandTarget ?? ""}
                  onChange={(e) =>
                    patchNode(node.id, { shorthandTarget: e.target.value })
                  }
                  style={{ width: 200 }}
                />
              )}
            </>
          ) : null}

          <Space>
            {node.role === "branch" ? (
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                disabled={disabled}
                onClick={() => addChild(node.id)}
              >
                Field
              </Button>
            ) : null}
            <Tooltip title="Copy segment">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                disabled={disabled || !node.segment.trim()}
                onClick={async () => {
                  const ok = await copyToClipboard(node.segment);
                  if (ok) message.success("Segment copied");
                  else message.error("Copy failed");
                }}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={disabled}
              onClick={() => remove(node.id)}
            />
          </Space>
        </Space>

        {node.role === "branch" && node.children.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {node.children.map((ch) => renderNode(ch, depth + 1))}
          </div>
        ) : null}
      </Card>
    );
  };

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Card
        size="small"
        styles={{
          body: {
            background: "linear-gradient(135deg, #f0f7ff 0%, #fafcfe 100%)",
            borderRadius: 8,
          },
        }}
      >
        <Space wrap size={[20, 8]}>
          <Statistic title="Leaf mappings" value={stats.leaves} />
          <Statistic title="Nested groups" value={stats.branches} />
          <Statistic title="Max depth" value={stats.maxDepth} />
          <Statistic
            title="Typed leaves"
            value={stats.typedLeaves}
            valueStyle={{ color: "#722ed1" }}
          />
          <Statistic
            title="Payload paths"
            value={stats.paths}
            valueStyle={{ color: "#1677ff" }}
          />
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          Payload paths are dot paths for filters (e.g.{" "}
          <Text code>watering.solution</Text>). Typed leaves carry{" "}
          <Text code>type</Text> for future JSON Schema / TS codegen.
        </Text>
      </Card>

      {parseError ? (
        <Alert type="warning" showIcon message={parseError} />
      ) : null}

      {Object.keys(nodeErrors).length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="Fix leaf errors before JSON updates"
        />
      ) : null}

      {roots.map((n) => renderNode(n, 0))}

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={disabled}
        onClick={addRoot}
      >
        Add root field
      </Button>

      {tsPreview ? (
        <Card size="small" title="Filter / codegen preview (TypeScript-style)">
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.45,
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            {tsPreview}
          </pre>
          <Text type="secondary" style={{ fontSize: 12 }}>
            This is a readable view derived from mapping +{" "}
            <Text code>type</Text>; wire packages/codegen to the saved JSON in a
            follow-up.
          </Text>
        </Card>
      ) : null}
    </Space>
  );
};
