import { LOCAL_SESSION_STORAGE } from "./local_session_storage";
import { WebServiceClient } from "@selfage/web_service_client";

export let USER_SERVICE_CLIENT = WebServiceClient.create(LOCAL_SESSION_STORAGE);
export let USER_SESSINO_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let COMMERCE_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let PRODUCT_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let USER_ACIVITY_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let PRODUCT_METER_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let PRODUCT_RECOMMENDATION_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
export let COMMENT_SERVICE_CLIENT = WebServiceClient.create(
  LOCAL_SESSION_STORAGE,
);
