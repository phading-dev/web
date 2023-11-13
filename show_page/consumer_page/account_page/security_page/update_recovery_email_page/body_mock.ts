import { UpdateRecoveryEmailPage } from "./body";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateRecoveryEmailPageMock extends UpdateRecoveryEmailPage {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
      })()
    );
  }
}
