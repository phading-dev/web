import { LOCAL_SESSION_STORAGE } from "./local_session_storage";
import { WebServiceClient } from "@selfage/web_service_client";

export let WEB_SERVICE_CLIENT = WebServiceClient.create(LOCAL_SESSION_STORAGE);
