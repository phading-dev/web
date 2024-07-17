import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../../../common/page_style";
import { TextValuesGroup } from "../../../../../common/text_values_group";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { getUser } from "@phading/user_service_interface/self/frontend/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SecurityInfoPage {
  on(event: "loaded", listener: () => void): this;
  on(event: "updateUsername", listener: () => void): this;
  on(event: "updatePassword", listener: () => void): this;
  on(event: "updateRecoveryEmail", listener: () => void): this;
}

export class SecurityInfoPage extends EventEmitter {
  public static create(): SecurityInfoPage {
    return new SecurityInfoPage(USER_SERVICE_CLIENT);
  }

  public body: HTMLDivElement;
  public username = new Ref<TextValuesGroup>();
  public recoveryEmail = new Ref<TextValuesGroup>();
  public password = new Ref<TextValuesGroup>();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.body = E.div({
      class: "security-info",
      style: PAGE_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await getUser(this.userServiceClient, {});

    this.body.append(
      E.div(
        {
          class: "security-info-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        assign(
          this.username,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.usernameLabel,
              value: response.user.username,
            },
          ]),
        ).body,
        assign(
          this.recoveryEmail,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.recoveryEmailLabel,
              value: response.user.recoveryEmail,
            },
          ]),
        ).body,
        assign(
          this.password,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.passwordLabel,
              value: "Update password",
            },
          ]),
        ).body,
      ),
    );

    this.username.val.on("action", () => this.emit("updateUsername"));
    this.recoveryEmail.val.on("action", () => this.emit("updateRecoveryEmail"));
    this.password.val.on("action", () => this.emit("updatePassword"));
    this.emit("loaded");
  }

  public remove(): void {
    this.body.remove();
  }
}
