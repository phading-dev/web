import { UpdateUsernamePage } from "./body";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateUsernamePageMock extends UpdateUsernamePage {
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
