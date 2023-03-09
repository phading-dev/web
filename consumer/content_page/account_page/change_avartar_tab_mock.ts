import { AvatarCanvas } from "./avatar_canvas";
import { ChangeAvatarTab } from "./change_avatar_tab";
import { WebServiceClient } from "@selfage/web_service_client";

export class ChangeAvatarTabMock extends ChangeAvatarTab {
  public constructor() {
    super(
      new AvatarCanvas(),
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
      })()
    );
    this.serviceClient.send = (request: any): any => {};
  }
}
