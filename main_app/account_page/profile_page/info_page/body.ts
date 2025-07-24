import EventEmitter = require("events");
import { OUTLINE_BUTTON_STYLE } from "../../../../common/button_styles";
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import { AVATAR_M, FONT_M } from "../../../../common/sizes";
import {
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { newGetAccountAndUserRequest } from "@phading/user_service_interface/web/self/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoPage {
  on(event: "updateAvatar", listener: (account: AccountAndUser) => void): this;
  on(
    event: "updateAccountInfo",
    listener: (account: AccountAndUser) => void,
  ): this;
  on(
    event: "updatePassword",
    listener: (account: AccountAndUser) => void,
  ): this;
  on(
    event: "updateUserEmail",
    listener: (account: AccountAndUser) => void,
  ): this;
  on(event: "chooseAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "avatarUpdateHintTransitionEnded", listener: () => void): this;
}

export class InfoPage extends EventEmitter {
  public static create(): InfoPage {
    return new InfoPage(SERVICE_CLIENT);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public avatarContainer = new Ref<HTMLDivElement>();
  private avatarUpdateHint = new Ref<HTMLDivElement>();
  public accountInfo = new Ref<HTMLDivElement>();
  public password = new Ref<HTMLDivElement>();
  public userEmail = new Ref<HTMLDivElement>();
  public chooseAccountButton = new Ref<HTMLDivElement>();
  public signOutButton = new Ref<HTMLDivElement>();

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: 2rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap; gap: 2rem;`,
    );
    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetAccountAndUserRequest({}),
    );

    this.card.val.append(
      E.divRef(
        this.avatarContainer,
        {
          class: "account-info-avatar",
          style: `align-self: center; position: relative; height: ${AVATAR_M}rem; width: ${AVATAR_M}rem; border-radius: ${AVATAR_M}rem; overflow: hidden; cursor: pointer;`,
        },
        E.image({
          class: "account-info-avatar-image",
          style: `height: 100%; width: 100%;`,
          src: response.account.avatarLargeUrl,
        }),
        E.divRef(
          this.avatarUpdateHint,
          {
            class: "account-info-avatar-update-hint-background",
            style: `position: absolute; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; bottom: 0; left: 0; height: 0; width: 100%; transition: height .2s; overflow: hidden; background-color: ${SCHEME.neutral4Translucent};`,
          },
          E.div(
            {
              class: `account-info-avatar-update-hint-label`,
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.changeAvatarLabel),
          ),
        ),
      ),
      assign(
        this.accountInfo,
        eColumnBoxWithArrow([
          eLabelAndText(LOCALIZED_TEXT.accountNameLabel, response.account.name),
          eLabelAndText(
            LOCALIZED_TEXT.accountDescriptionLabel,
            response.account.description,
          ),
        ]),
      ),
      assign(
        this.password,
        eColumnBoxWithArrow([
          eLabelAndText(LOCALIZED_TEXT.passwordLabel, "********"),
        ]),
      ),
      assign(
        this.userEmail,
        eColumnBoxWithArrow([
          eLabelAndText(LOCALIZED_TEXT.emailLabel, response.account.userEmail),
        ]),
      ),
      E.div(
        {
          class: "account-info-buttons",
          style: `width: 100%; box-sizing: border-box; padding: 0 2rem; display: flex; flex-flow: wrap row; justify-content: center; align-items: center; column-gap: 10rem; row-gap: 2rem;`,
        },
        E.divRef(
          this.chooseAccountButton,
          {
            class: "account-info-switch-account",
            style: `${OUTLINE_BUTTON_STYLE} color: ${SCHEME.neutral0}; border-color: ${SCHEME.neutral1};`,
          },
          E.text(LOCALIZED_TEXT.chooseAccountButtonLabel),
        ),
        E.divRef(
          this.signOutButton,
          {
            class: "account-info-sign-out",
            style: `${OUTLINE_BUTTON_STYLE} color: ${SCHEME.neutral0}; border-color: ${SCHEME.neutral1};`,
          },
          E.text(LOCALIZED_TEXT.signOutButtonLabel),
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
      this.emit("updateAvatar", response.account),
    );
    this.avatarUpdateHint.val.addEventListener("transitionend", () =>
      this.emit("avatarUpdateHintTransitionEnded"),
    );
    this.accountInfo.val.addEventListener("click", () =>
      this.emit("updateAccountInfo", response.account),
    );
    this.password.val.addEventListener("click", () =>
      this.emit("updatePassword", response.account),
    );
    this.userEmail.val.addEventListener("click", () =>
      this.emit("updateUserEmail", response.account),
    );
    this.chooseAccountButton.val.addEventListener("click", () =>
      this.emit("chooseAccount"),
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
    this.removeAllListeners();
  }
}
