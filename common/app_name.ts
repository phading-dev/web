import { LOCALIZED_TEXT } from "./locales/localized_text";
import { AppType } from "@phading/product_service_interface/app_type";

export function getAppName(appType: AppType): string {
  switch (appType) {
    case AppType.CHAT:
      return LOCALIZED_TEXT.chatAppName;
    case AppType.SHOW:
      return LOCALIZED_TEXT.showAppName;
    case AppType.MUSIC:
      return LOCALIZED_TEXT.musicAppName;
  }
  throw new Error(`No app name found for the app type ${AppType[appType]}.`);
}
