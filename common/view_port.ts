import { setViewport } from "@selfage/puppeteer_test_executor_api";

export async function setPhoneView(): Promise<void> {
  await setViewport(360, 600);
}

export async function setTabletView(): Promise<void> {
  await setViewport(700, 800);
}

export async function setDesktopView(): Promise<void> {
  await setViewport(1200, 800);
}
