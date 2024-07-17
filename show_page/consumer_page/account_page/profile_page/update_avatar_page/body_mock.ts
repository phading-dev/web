import { UpdateAvatarPage } from "./body";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class UpdateAvatarPageMock extends UpdateAvatarPage {
  public constructor() {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          return {};
        }
      })(),
    );
  }
}
