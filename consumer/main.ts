import { BodyContainer } from "./body_container";
import { normalizeBody } from "./common/normalize_body";
import { WEB_SERVICE_CLIENT } from "./common/web_service_client";
import { CONTENT_PAGE_STATE } from "./content_page/state";
import { HistoryTracker } from "./history_tracker";
import { ORIGIN_DEV, ORIGIN_PROD } from "@phading/constants/origin";
import "../environment";

async function main(): Promise<void> {
  normalizeBody();
  let viewPortMeta = document.createElement("meta");
  viewPortMeta.name = "viewport";
  viewPortMeta.content = "width=device-width, initial-scale=1";
  document.head.appendChild(viewPortMeta);

  if (globalThis.ENVIRONMENT === "prod") {
    WEB_SERVICE_CLIENT.baseUrl = ORIGIN_PROD;
  } else if (globalThis.ENVIRONMENT === "dev") {
    WEB_SERVICE_CLIENT.baseUrl = ORIGIN_DEV;
  } else if (globalThis.ENVIRONMENT === "local") {
    WEB_SERVICE_CLIENT.baseUrl = ORIGIN_DEV;
  } else {
    throw new Error(`Not supported environment ${globalThis.ENVIRONMENT}.`);
  }

  let bodyContainer = BodyContainer.create(document.body);
  let queryParamKey = "s";
  let historyTracker = HistoryTracker.create(CONTENT_PAGE_STATE, queryParamKey);
  historyTracker.on("update", (newState) =>
    bodyContainer.updateState(newState)
  );
  historyTracker.parse();
  bodyContainer.on("newState", (newState) => historyTracker.push(newState));
  bodyContainer.show();
}

main();
