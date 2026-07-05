import { useEffect } from "react";
import { Spin } from "antd";
import {
  ADMIN_VUE_HOME_PAGE_PATH,
  ADMIN_VUE_TAXONOMY_PATH,
  ADMIN_VUE_TELEGRAM_PATH,
  resolveAdminAppHref,
} from "@growing/admin-shell";

function RedirectToVueRoute({ path }: { path: string }) {
  useEffect(() => {
    window.location.replace(resolveAdminAppHref("vue", path));
  }, [path]);

  return <Spin fullscreen tip="Переход в Vue Admin…" />;
}

export function RedirectToVueTaxonomy() {
  return <RedirectToVueRoute path={ADMIN_VUE_TAXONOMY_PATH} />;
}

export function RedirectToVueTelegram() {
  return <RedirectToVueRoute path={ADMIN_VUE_TELEGRAM_PATH} />;
}

export function RedirectToVueHomePage() {
  return <RedirectToVueRoute path={ADMIN_VUE_HOME_PAGE_PATH} />;
}
