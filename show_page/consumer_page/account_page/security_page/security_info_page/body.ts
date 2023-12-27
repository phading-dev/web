import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { TextContentButton } from "../../../../../common/text_content_button";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { getAuthSettings } from "@phading/user_service_interface/self/web/client_requests";
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

  private body_: HTMLDivElement;
  private card: HTMLDivElement;
  private username_: TextContentButton;
  private recoveryEmail_: TextContentButton;
  private password_: TextContentButton;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let cardRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "security-info",
        style: PAGE_STYLE,
      },
      E.divRef(cardRef, {
        class: "security-info-card",
        style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 3rem;`,
      })
    );
    this.card = cardRef.val;

    this.load();
  }

  private async load(): Promise<void> {
    let response = await getAuthSettings(this.userServiceClient, {});

    let usernameRef = new Ref<TextContentButton>();
    let recoveryEmailRef = new Ref<TextContentButton>();
    let passwordRef = new Ref<TextContentButton>();
    this.card.append(
      assign(
        usernameRef,
        TextContentButton.create(
          LOCALIZED_TEXT.usernameLabel,
          response.authSettings.username,
          "width: 100%;"
        )
      ).body,
      assign(
        recoveryEmailRef,
        TextContentButton.create(
          LOCALIZED_TEXT.recoveryEmailLabel,
          response.authSettings.recoveryEmail,
          "width: 100%"
        )
      ).body,
      assign(
        passwordRef,
        TextContentButton.create(
          LOCALIZED_TEXT.passwordLabel,
          "Update password",
          "width: 100%"
        )
      ).body
    );
    this.username_ = usernameRef.val;
    this.recoveryEmail_ = recoveryEmailRef.val;
    this.password_ = passwordRef.val;

    this.username_.on("action", () => this.emit("updateUsername"));
    this.recoveryEmail_.on("action", () => this.emit("updateRecoveryEmail"));
    this.password_.on("action", () => this.emit("updatePassword"));
    this.emit("loaded");
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public get username() {
    return this.username_;
  }
  public get password() {
    return this.password_;
  }
  public get recoveryEmail() {
    return this.recoveryEmail_;
  }
}
