import React, { useEffect } from "react";
import { Spin } from "antd";
import { ADMIN_VUE_TAXONOMY_PATH, crossAppLinkHref } from "@growing/admin-shell";

const vueTaxonomyHref = crossAppLinkHref({
  key: "vue-taxonomy",
  label: "Vue — Справочник таксономии",
  path: ADMIN_VUE_TAXONOMY_PATH,
  app: "vue",
});

/**
 * Phase 1: taxonomy UI lives in admin-vue; React routes redirect here.
 */
const RedirectToVueTaxonomy: React.FC = () => {
  useEffect(() => {
    window.location.replace(vueTaxonomyHref);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 240,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Spin size="large" />
      <span>Открываем справочник таксономии (Vue Admin)…</span>
    </div>
  );
};

export default RedirectToVueTaxonomy;
