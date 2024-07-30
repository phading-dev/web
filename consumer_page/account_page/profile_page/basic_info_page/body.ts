import EventEmitter = require("events");
import { OUTLINE_BUTTON_STYLE } from "../../../../common/button_styles";
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../../common/page_style";
import { AVATAR_M, FONT_M } from "../../../../common/sizes";
import { TextValuesGroup } from "../../../../common/text_values_group";
import { USER_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { AccountAndUser } from "@phading/user_service_interface/self/frontend/account";
import { getAccountAndUser } from "@phading/user_service_interface/self/frontend/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface BasicInfoPage {
  on(event: "loaded", listener: () => void): this;
  on(event: "avatarUpdateHintTransitionEnded", listener: () => void): this;
  on(event: "updateAvatar", listener: () => void): this;
  on(
    event: "updateAccountInfo",
    listener: (account: AccountAndUser) => void,
  ): this;
  on(event: "updateUsername", listener: () => void): this;
  on(event: "updatePassword", listener: () => void): this;
  on(event: "updateRecoveryEmail", listener: () => void): this;
  on(event: "switchAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class BasicInfoPage extends EventEmitter {
  public static create(): BasicInfoPage {
    return new BasicInfoPage(USER_SERVICE_CLIENT);
  }

  public body: HTMLDivElement;
  public avatarContainer = new Ref<HTMLDivElement>();
  private avatarUpdateHint = new Ref<HTMLDivElement>();
  public accountInfo = new Ref<TextValuesGroup>();
  public username = new Ref<TextValuesGroup>();
  public recoveryEmail = new Ref<TextValuesGroup>();
  public password = new Ref<TextValuesGroup>();
  public switchAccountButton = new Ref<HTMLDivElement>();
  public signOutButton = new Ref<HTMLDivElement>();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.body = E.div({
      class: "basic-info",
      style: PAGE_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await getAccountAndUser(this.userServiceClient, {});

    this.body.append(
      E.div(
        {
          class: "basic-info-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        E.divRef(
          this.avatarContainer,
          {
            class: "basic-info-avatar",
            style: `align-self: center; position: relative; height: ${AVATAR_M}rem; width: ${AVATAR_M}rem; border-radius: ${AVATAR_M}rem; overflow: hidden; cursor: pointer;`,
          },
          E.image({
            class: "basic-info-avatar-image",
            style: `height: 100%; width: 100%;`,
            src: response.account.avatarLargePath,
          }),
          E.divRef(
            this.avatarUpdateHint,
            {
              class: "basic-info-avatar-update-hint-background",
              style: `position: absolute; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; bottom: 0; left: 0; height: 0; width: 100%; transition: height .2s; overflow: hidden; background-color: ${SCHEME.neutral4Translucent};`,
            },
            E.div(
              {
                class: `basic-info-avatar-update-hint-label`,
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.changeAvatarLabel),
            ),
          ),
        ),
        assign(
          this.accountInfo,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.naturalNameLabel,
              value: response.account.naturalName,
            },
            {
              label: LOCALIZED_TEXT.contactEmailLabel,
              value: response.account.contactEmail,
            },
            {
              label: LOCALIZED_TEXT.accountDescriptionLabel,
              value: response.account.description,
            },
          ]),
        ).body,
        assign(
          this.username,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.usernameLabel,
              value: response.account.username,
            },
          ]),
        ).body,
        assign(
          this.recoveryEmail,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.recoveryEmailLabel,
              value: response.account.recoveryEmail,
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
        E.div(
          {
            class: "basic-info-buttons",
            style: `width: 100%; display: flex; flex-flow: row; justify-content: center; align-items: center; gap: 3rem;`,
          },
          E.divRef(
            this.switchAccountButton,
            {
              class: "basic-info-switch-account",
              style: `${OUTLINE_BUTTON_STYLE} color: ${SCHEME.neutral0}; border-color: ${SCHEME.neutral1};`,
            },
            E.text(LOCALIZED_TEXT.switchAccountButtonLabel),
          ),
          E.divRef(
            this.signOutButton,
            {
              class: "basic-info-sign-out",
              style: `${OUTLINE_BUTTON_STYLE} color: ${SCHEME.neutral0}; border-color: ${SCHEME.neutral1};`,
            },
            E.text(LOCALIZED_TEXT.signOutButtonLabel),
          ),
        ),
      ),
    );

    this.hideChangeAvatarHint();
    this.avatarContainer.val.addEventListener("mouseenter", () =>
      this.showChangeAvatarHint(),
    );
    this.avatarContainer.val.addEventListener("mouseleave", () =>
      this.hideChangeAvatarHint(),
    );
    this.avatarContainer.val.addEventListener("click", () =>
      this.emit("updateAvatar"),
    );
    this.avatarUpdateHint.val.addEventListener("transitionend", () =>
      this.emit("avatarUpdateHintTransitionEnded"),
    );
    this.accountInfo.val.on("action", () =>
      this.emit("updateAccountInfo", response.account),
    );
    this.username.val.on("action", () => this.emit("updateUsername"));
    this.recoveryEmail.val.on("action", () => this.emit("updateRecoveryEmail"));
    this.password.val.on("action", () => this.emit("updatePassword"));
    this.switchAccountButton.val.addEventListener("click", () =>
      this.emit("switchAccount"),
    );
    this.signOutButton.val.addEventListener("click", () =>
      this.emit("signOut"),
    );
    this.emit("loaded");
  }

  private showChangeAvatarHint(): void {
    this.avatarUpdateHint.val.style.height = "100%";
  }

  private hideChangeAvatarHint(): void {
    this.avatarUpdateHint.val.style.height = "0";
  }

  public remove(): void {
    this.body.remove();
  }
}
