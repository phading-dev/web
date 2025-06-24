import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createLoadingIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ICON_XXL } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { newSwitchAccountRequest } from "@phading/user_service_interface/web/self/client";
import { SwitchAccountResponse } from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SwitchAccountPage {
  on(event: "choose", listener: (signedSession: string) => void): this;
  on(event: "error", listener: (message: string) => void): this;
}

export class SwitchAccountPage extends EventEmitter {
  public static create(accountId: string): SwitchAccountPage {
    return new SwitchAccountPage(SERVICE_CLIENT, accountId);
  }

  public body: HTMLDivElement;

  public constructor(
    protected serviceClient: WebServiceClient,
    public accountId: string,
    withAnimation: boolean = true,
  ) {
    super();
    this.body = E.div(
      {
        class: "switching-account-page",
        style: `width: 100%; height: 100%; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center;`,
      },
      E.div(
        {
          class: "switching-account-page-loading",
          style: `width: ${ICON_XXL}rem; height: ${ICON_XXL}rem;`,
        },
        createLoadingIcon(SCHEME.neutral1, withAnimation),
      ),
    );
    this.switchAccount();
  }

  private async switchAccount(): Promise<void> {
    let response: SwitchAccountResponse;
    try {
      response = await this.serviceClient.send(
        newSwitchAccountRequest({
          accountId: this.accountId,
        }),
      );
    } catch (e) {
      this.emit("error", LOCALIZED_TEXT.switchAccountFailedError);
      return;
    }
    if (response.notFound) {
      this.emit("error", LOCALIZED_TEXT.accountNotFoundError);
    } else {
      this.emit("choose", response.signedSession);
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
