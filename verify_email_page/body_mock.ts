import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { VerifyEmailPage } from "./body";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebClientOptions } from "@selfage/web_service_client";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class VerifyEmailPageMock extends VerifyEmailPage {
  public constructor(tokenId: string) {
    super(
      LOCAL_SESSION_STORAGE,
      new (class extends WebServiceClientMock {
        public async send(
          request: ClientRequestInterface<any>,
          options?: WebClientOptions,
        ): Promise<any> {
          return {};
        }
      })(),
      tokenId,
    );
  }
}
