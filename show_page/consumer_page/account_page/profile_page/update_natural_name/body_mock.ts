import { UpdateNaturalNamePage } from "./body";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateNaturalNamePageMock extends UpdateNaturalNamePage {
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
