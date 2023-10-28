import { UpdateContactEmailPage } from "./body";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateContactEmailPageMock extends UpdateContactEmailPage {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {};
        }
      })()
    );
  }
}
