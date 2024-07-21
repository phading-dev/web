import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../../../common/page_style";
import { AVATAR_M, FONT_M } from "../../../../../common/sizes";
import { TextValuesGroup } from "../../../../../common/text_values_group";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { Account } from "@phading/user_service_interface/self/frontend/account";
import { getAccount } from "@phading/user_service_interface/self/frontend/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface BasicInfoPag {
  on(event: "loaded", listener: () => void): this;
  on(event: "avatarUpdateHintTransitionEnded", listener: () => void): this;
  on(event: "updateAvatar", listener: () => void): this;
  on(event: "updateAccountInfo", listener: (account: Account) => void): this;
}

export class BasicInfoPag extends EventEmitter {
  public static create(): BasicInfoPag {
    return new BasicInfoPag(USER_SERVICE_CLIENT);
  }

  public body: HTMLDivElement;
  public avatarContainer = new Ref<HTMLDivElement>();
  private avatarUpdateHint = new Ref<HTMLDivElement>();
  public infoValuesGroup = new Ref<TextValuesGroup>();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.body = E.div({
      class: "basic-info",
      style: PAGE_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let account = (await getAccount(this.userServiceClient, {})).account;

    this.body.append(
      E.div(
        {
          class: "basic-info-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 3rem;`,
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
            src: account.avatarLargePath,
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
          this.infoValuesGroup,
          TextValuesGroup.create([
            {
              label: LOCALIZED_TEXT.naturalNameLabel,
              value: account.naturalName,
            },
            {
              label: LOCALIZED_TEXT.contactEmailLabel,
              value: account.contactEmail,
            },
            {
              label: LOCALIZED_TEXT.accountDescriptionLabel,
              value: account.description,
            },
          ]),
        ).body,
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
    this.infoValuesGroup.val.on("action", () =>
      this.emit("updateAccountInfo", account),
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
