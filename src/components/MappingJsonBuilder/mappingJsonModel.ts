/**
 * Registry `mapping` JSON model: nested objects for payload shape, leaves map to entity `currentKey`
 * with optional `type` metadata for filters / future TS & JSON Schema codegen.
 *
 * Leaf: string (shorthand) or { currentKey: string, type?: unknown }
 * Branch: plain object whose values are further leaves or branches (no `currentKey` on the same object as nested keys).
 */

export type MappingLeafExplicit = { currentKey: string; type?: unknown };

export function isStrictMappingLeafObject(
  value: unknown,
): value is Record<string, unknown> & { currentKey: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.currentKey !== "string" || o.currentKey.trim() === "") {
    return false;
  }
  for (const key of Object.keys(o)) {
    if (key !== "currentKey" && key !== "type") return false;
  }
  return true;
}

function validateTypeField(type: unknown): string | null {
  if (type === undefined) return null;
  if (typeof type === "string") return null;
  if (typeof type !== "object" || type === null || Array.isArray(type)) {
    return "Mapping.type must be a string or an object (e.g. { enum: [...] })";
  }
  const tt = type as Record<string, unknown>;
  if (tt.enum !== undefined) {
    if (
      !Array.isArray(tt.enum) ||
      !tt.enum.every((x) => typeof x === "string")
    ) {
      return "Mapping.type.enum must be an array of strings";
    }
  }
  return null;
}

/** Recursive validation for mapping JSON (nested branches allowed). */
export function validateMappingJsonDeep(mappingJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(mappingJson);
  } catch {
    return "Invalid JSON";
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "Mapping must be a JSON object";
  }

  return validateMappingObject(parsed as Record<string, unknown>);
}

export function validateMappingObject(obj: Record<string, unknown>): string | null {
  for (const [, value] of Object.entries(obj)) {
    const err = validateMappingValue(value);
    if (err) return err;
  }
  return null;
}

function validateMappingValue(value: unknown): string | null {
  if (typeof value === "string") return null;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "Mapping values must be strings, leaf objects, or nested objects";
  }

  const o = value as Record<string, unknown>;
  if (o.currentKey !== undefined) {
    if (typeof o.currentKey !== "string" || o.currentKey.trim() === "") {
      return "currentKey must be a non-empty string when present";
    }
  }
  const hasCk =
    typeof o.currentKey === "string" && o.currentKey.trim() !== "";
  const structuralKeys = Object.keys(o).filter(
    (k) => k !== "currentKey" && k !== "type",
  );

  if (hasCk && structuralKeys.length > 0) {
    return "Mapping object cannot combine currentKey with nested keys under the same object";
  }

  if (hasCk) {
    return validateTypeField(o.type);
  }

  for (const k of structuralKeys) {
    const err = validateMappingValue(o[k]);
    if (err) return err;
  }
  return null;
}

/** True if any value is a non-leaf object (nested namespace). */
export function mappingHasNestedBranches(obj: Record<string, unknown>): boolean {
  for (const [, value] of Object.entries(obj)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue;
    }
    const o = value as Record<string, unknown>;
    const hasCk =
      typeof o.currentKey === "string" && o.currentKey.trim() !== "";
    const structuralKeys = Object.keys(o).filter(
      (k) => k !== "currentKey" && k !== "type",
    );
    if (hasCk) continue;
    if (structuralKeys.length > 0) return true;
    if (Object.keys(o).length === 0) return true;
  }
  return false;
}

/** Dot-separated payload paths to each leaf (for conditions / filters UI). */
export function collectMappingLeafPaths(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const paths: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      paths.push(path);
      continue;
    }
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const hasCk =
        typeof o.currentKey === "string" && o.currentKey.trim() !== "";
      const structuralKeys = Object.keys(o).filter(
        (x) => x !== "currentKey" && x !== "type",
      );
      if (hasCk && structuralKeys.length === 0) {
        paths.push(path);
        continue;
      }
      if (!hasCk) {
        paths.push(...collectMappingLeafPaths(o, path));
      }
    }
  }
  return paths.sort((a, b) => a.localeCompare(b));
}

export function countMappingStructure(obj: Record<string, unknown>): {
  leaves: number;
  branches: number;
  maxDepth: number;
  typedLeaves: number;
} {
  let leaves = 0;
  let branches = 0;
  let typedLeaves = 0;
  let maxDepth = 0;

  const walkValue = (v: unknown, depth: number) => {
    if (typeof v === "string") {
      leaves += 1;
      maxDepth = Math.max(maxDepth, depth);
      return;
    }
    if (typeof v !== "object" || v === null || Array.isArray(v)) return;

    const o = v as Record<string, unknown>;
    if (isStrictMappingLeafObject(o)) {
      leaves += 1;
      if (o.type !== undefined) typedLeaves += 1;
      maxDepth = Math.max(maxDepth, depth);
      return;
    }

    const structuralKeys = Object.keys(o).filter(
      (k) => k !== "currentKey" && k !== "type",
    );
    if (structuralKeys.length === 0) {
      branches += 1;
      maxDepth = Math.max(maxDepth, depth);
      return;
    }

    branches += 1;
    for (const k of structuralKeys) {
      walkValue(o[k], depth + 1);
    }
  };

  for (const v of Object.values(obj)) {
    walkValue(v, 1);
  }

  return { leaves, branches, maxDepth, typedLeaves };
}

/** Heuristic TS-like preview for operators (not a full code generator). */
/** Remove one leaf (or branch) by dot path from a mapping object. */
export function removeMappingPath(
  obj: Record<string, unknown>,
  path: string,
): Record<string, unknown> {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return { ...obj };
  if (parts.length === 1) {
    const next = { ...obj };
    delete next[parts[0]];
    return next;
  }
  const [head, ...tail] = parts;
  const child = obj[head];
  if (typeof child !== "object" || child === null || Array.isArray(child)) {
    return { ...obj };
  }
  const nextChild = removeMappingPath(
    child as Record<string, unknown>,
    tail.join("."),
  );
  const next = { ...obj };
  if (Object.keys(nextChild).length === 0) {
    delete next[head];
  } else {
    next[head] = nextChild;
  }
  return next;
}

export function previewPayloadTypescript(obj: Record<string, unknown>): string {
  const rec = (o: Record<string, unknown>, ind: number): string => {
    const pad = "  ".repeat(ind);
    const parts: string[] = [];
    for (const [k, v] of Object.entries(o)) {
      const key = /^[a-zA-Z_]\w*$/.test(k) ? k : JSON.stringify(k);
      if (typeof v === "string") {
        parts.push(`${pad}${key}: unknown; // → ${JSON.stringify(v)}`);
      } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        const ob = v as Record<string, unknown>;
        if (isStrictMappingLeafObject(ob)) {
          const t =
            ob.type !== undefined ? JSON.stringify(ob.type) : "unknown";
          parts.push(
            `${pad}${key}: ${t}; // currentKey ${JSON.stringify(ob.currentKey)}`,
          );
        } else {
          parts.push(`${pad}${key}: {\n${rec(ob, ind + 1)}\n${pad}}`);
        }
      }
    }
    return parts.join("\n");
  };
  return `{\n${rec(obj, 1)}\n}`;
}

let treeIdSeq = 0;
const nextTreeId = () => `mt-${++treeIdSeq}`;

export type MappingTreeNode = {
  id: string;
  segment: string;
  role: "branch" | "leaf";
  children: MappingTreeNode[];
  leafKind?: "shorthand" | "explicit";
  shorthandTarget?: string;
  currentKey?: string;
  typeJson?: string;
};

export function jsonToMappingTree(obj: Record<string, unknown>): {
  roots: MappingTreeNode[];
  error: string | null;
} {
  const err = validateMappingObject(obj);
  if (err) return { roots: [], error: err };

  const valueToNode = (segment: string, value: unknown): MappingTreeNode => {
    if (typeof value === "string") {
      return {
        id: nextTreeId(),
        segment,
        role: "leaf",
        children: [],
        leafKind: "shorthand",
        shorthandTarget: value,
      };
    }
    const o = value as Record<string, unknown>;
    if (isStrictMappingLeafObject(o)) {
      let typeJson = "";
      if (o.type !== undefined) {
        try {
          typeJson = JSON.stringify(o.type, null, 2);
        } catch {
          typeJson = "";
        }
      }
      return {
        id: nextTreeId(),
        segment,
        role: "leaf",
        children: [],
        leafKind: "explicit",
        currentKey: o.currentKey,
        typeJson,
      };
    }
    const children: MappingTreeNode[] = Object.entries(o).map(([k, v]) =>
      valueToNode(k, v),
    );
    return {
      id: nextTreeId(),
      segment,
      role: "branch",
      children,
    };
  };

  const roots = Object.entries(obj).map(([k, v]) => valueToNode(k, v));
  return { roots, error: null };
}

export function mappingTreeToJson(roots: MappingTreeNode[]): {
  json: string;
  nodeErrors: Record<string, string>;
} {
  const nodeErrors: Record<string, string> = {};

  const serializeLeaf = (node: MappingTreeNode): unknown => {
    if (node.leafKind === "shorthand") {
      const t = (node.shorthandTarget ?? "").trim();
      return t || node.segment.trim() || "";
    }
    const ck = (node.currentKey ?? "").trim();
    if (!ck) {
      nodeErrors[node.id] = "currentKey is required";
      return null;
    }
    const rec: Record<string, unknown> = { currentKey: ck };
    const tj = (node.typeJson ?? "").trim();
    if (tj) {
      try {
        rec.type = JSON.parse(tj);
      } catch {
        nodeErrors[node.id] = "Invalid type JSON";
        return null;
      }
    }
    return rec;
  };

  const nodeToValue = (node: MappingTreeNode): unknown | null => {
    if (node.role === "leaf") {
      return serializeLeaf(node);
    }
    const inner: Record<string, unknown> = {};
    for (const ch of node.children) {
      const seg = ch.segment.trim();
      if (!seg) continue;
      const v = nodeToValue(ch);
      if (v !== null) inner[seg] = v;
    }
    return inner;
  };

  const out: Record<string, unknown> = {};
  for (const root of roots) {
    const seg = root.segment.trim();
    if (!seg) continue;
    const v = nodeToValue(root);
    if (v !== null) out[seg] = v;
  }

  return { json: JSON.stringify(out, null, 2), nodeErrors };
}
