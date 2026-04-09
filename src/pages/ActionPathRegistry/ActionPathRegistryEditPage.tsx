import React, { useEffect, useMemo, useState } from "react";
import { Button, Space, Typography, message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionPathRegistryForm } from "./ActionPathRegistryForm";
import { actionPathRegistryService } from "@/services/actionPathRegistry";

const { Title } = Typography;

type LocationState = {
  item?: {
    actionPath: string;
    description?: string | null;
    targetType: string;
    mapping: Record<string, unknown>;
    conditions?: Array<{
      field: string;
      operator: "lt" | "gt" | "eq" | "lte" | "gte";
      value: string;
      tagId: string;
    }> | null;
    tagId?: string | null;
  };
};

const ActionPathRegistryEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadedItem, setLoadedItem] = useState<LocationState["item"] | null>(
    null,
  );

  const state = (location.state ?? {}) as LocationState;

  const resolvedActionPath = useMemo(() => {
    const raw = params.actionPath;
    if (!raw) return "";
    try {
      return decodeURIComponent(String(raw));
    } catch {
      return String(raw);
    }
  }, [params.actionPath]);

  const item = state.item ?? loadedItem;

  const initialValues = useMemo(() => {
    if (!item) return null;

    return {
      actionPath: item.actionPath,
      description: item.description ?? "",
      targetType: item.targetType,
      mappingJson: JSON.stringify(item.mapping ?? {}, null, 2),
      conditionsJson: JSON.stringify(item.conditions ?? [], null, 2),
      tagId: item.tagId ?? null,
    };
  }, [item]);

  useEffect(() => {
    if (state.item) return;
    if (!resolvedActionPath) return;

    let cancelled = false;
    setNotFound(false);
    setLoading(true);
    void (async () => {
      try {
        type RegistryListResponse = Awaited<
          ReturnType<typeof actionPathRegistryService.list>
        >;
        type RegistryListItem = RegistryListResponse["items"][number];

        const limit = 200;
        let offset = 0;
        let found: RegistryListItem | undefined;
        let total = Infinity;

        while (!cancelled && offset < total) {
          const resp = await actionPathRegistryService.list({
            limit,
            offset,
          });
          total = resp.total;
          found = resp.items.find((x) => x.actionPath === resolvedActionPath);
          if (found) break;
          offset += limit;
          if (resp.items.length === 0) break;
        }

        if (!found) {
          setNotFound(true);
          return;
        }
        if (cancelled) return;
        setLoadedItem(found);
      } catch (e: any) {
        message.error(e?.message ?? "Failed to load registry");
        navigate("/registry", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, resolvedActionPath, state.item]);

  useEffect(() => {
    if (!initialValues && !loading && notFound) {
      message.error("Missing registry data. Please open edit from the list.");
      navigate("/registry", { replace: true });
    }
  }, [initialValues, loading, navigate, notFound]);

  if (!initialValues) return null;

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
          Edit Registry
        </Title>
        <Button onClick={() => navigate("/registry")}>Back to list</Button>
      </Space>

      <ActionPathRegistryForm
        title={`Edit: ${initialValues.actionPath}`}
        initialValues={initialValues}
        onSaved={() => navigate("/registry")}
      />
    </div>
  );
};

export default ActionPathRegistryEditPage;
