import { UpdateAvatarPage } from "./update_avatar_page";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateAvatarPageMock extends UpdateAvatarPage {
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
