import { UpdatePasswordPage } from "./body";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdatePasswordPageMock extends UpdatePasswordPage {
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
