import { BodyContainer } from "./body_container";
import { BODY_STATE } from "./body_state";
import { USER_SERVICE_CLIENT } from "./common/user_service_client";
import { HistoryTracker } from "./history_tracker";
import { ORIGIN_DEV, ORIGIN_PROD } from "@phading/constants/origin";
import "./common/normalize_body";
import "./environment";

let USER_SERVICE_PATH = "/user";

async function main(): Promise<void> {
  let viewPortMeta = document.createElement("meta");
  viewPortMeta.name = "viewport";
  viewPortMeta.content = "width=device-width, initial-scale=1";
  document.head.appendChild(viewPortMeta);

  if (globalThis.ENVIRONMENT === "prod") {
    USER_SERVICE_CLIENT.baseUrl = ORIGIN_PROD + USER_SERVICE_PATH;
  } else if (globalThis.ENVIRONMENT === "dev") {
    USER_SERVICE_CLIENT.baseUrl = ORIGIN_DEV + USER_SERVICE_PATH;
  } else if (globalThis.ENVIRONMENT === "local") {
    USER_SERVICE_CLIENT.baseUrl = ORIGIN_DEV + USER_SERVICE_PATH;
  } else {
    throw new Error(`Not supported environment ${globalThis.ENVIRONMENT}.`);
  }

  let bodyContainer = BodyContainer.create(document.body);
  let queryParamKey = "s";
  let historyTracker = HistoryTracker.create(BODY_STATE, queryParamKey);
  historyTracker.on("update", (newState) =>
    bodyContainer.updateState(newState)
  );
  bodyContainer.on("newState", (newState) => historyTracker.push(newState));
  historyTracker.parse();
}

main();
