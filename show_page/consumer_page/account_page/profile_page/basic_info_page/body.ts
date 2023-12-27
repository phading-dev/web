import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { TextContentButton } from "../../../../../common/text_content_button";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { getAccount } from "@phading/user_service_interface/self/web/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface BasicInfoPag {
  on(event: "loaded", listener: () => void): this;
  on(event: "avatarUpdateHintTransitionEnded", listener: () => void): this;
  on(event: "updateAvatar", listener: () => void): this;
  on(event: "updateNaturalName", listener: () => void): this;
  on(event: "updateContactEmail", listener: () => void): this;
  on(event: "updateDescription", listener: () => void): this;
}

export class BasicInfoPag extends EventEmitter {
  public static create(): BasicInfoPag {
    return new BasicInfoPag(USER_SERVICE_CLIENT);
  }

  private body_: HTMLDivElement;
  private avatarContainer_: HTMLDivElement;
  private naturalName_: TextContentButton;
  private contactEmail_: TextContentButton;
  private description_: TextContentButton;
  private card: HTMLDivElement;
  private avatarUpdateHint: HTMLDivElement;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let cardRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "basic-info",
        style: PAGE_STYLE,
      },
      E.divRef(cardRef, {
        class: "basic-info-card",
        style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 3rem;`,
      })
    );
    this.card = cardRef.val;

    this.load();
  }

  private async load(): Promise<void> {
    let account = (await getAccount(this.userServiceClient, {})).account;

    let avatarContainerRef = new Ref<HTMLDivElement>();
    let avatarUpdateHintRef = new Ref<HTMLDivElement>();
    let naturalNameRef = new Ref<TextContentButton>();
    let contactEmailRef = new Ref<TextContentButton>();
    let descriptionRef = new Ref<TextContentButton>();
    this.card.append(
      E.divRef(
        avatarContainerRef,
        {
          class: "basic-info-avatar",
          style: `align-self: center; position: relative; height: 10rem; width: 10rem; border-radius: 10rem; overflow: hidden; cursor: pointer;`,
        },
        E.image({
          class: "basic-info-avatar-image",
          style: `height: 100%; width: 100%;`,
          src: account.avatarLargePath,
        }),
        E.divRef(
          avatarUpdateHintRef,
          {
            class: "basic-info-avatar-update-hint-background",
            style: `position: absolute; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; bottom: 0; left: 0; height: 0; width: 100%; transition: height .2s; overflow: hidden; background-color: ${SCHEME.neutral1Translucent};`,
          },
          E.div(
            {
              class: `basic-info-avatar-update-hint-label`,
              style: `font-size: 1.4rem; color: ${SCHEME.neutral4};`,
            },
            E.text(LOCALIZED_TEXT.changeAvatarLabel)
          )
        )
      ),
      assign(
        naturalNameRef,
        TextContentButton.create(
          LOCALIZED_TEXT.naturalNameLabel,
          account.naturalName,
          "width: 100%;"
        )
      ).body,
      assign(
        contactEmailRef,
        TextContentButton.create(
          LOCALIZED_TEXT.contactEmailLabel,
          account.contactEmail,
          "width: 100%;"
        )
      ).body,
      assign(
        descriptionRef,
        TextContentButton.create(
          LOCALIZED_TEXT.accountDescriptionLabel,
          account.description,
          "width: 100%;"
        )
      ).body
    );
    this.avatarContainer_ = avatarContainerRef.val;
    this.avatarUpdateHint = avatarUpdateHintRef.val;
    this.naturalName_ = naturalNameRef.val;
    this.contactEmail_ = contactEmailRef.val;
    this.description_ = descriptionRef.val;

    this.hideChangeAvatarHint();
    this.avatarContainer_.addEventListener("mouseenter", () =>
      this.showChangeAvatarHint()
    );
    this.avatarContainer_.addEventListener("mouseleave", () =>
      this.hideChangeAvatarHint()
    );
    this.avatarContainer_.addEventListener("click", () =>
      this.emit("updateAvatar")
    );
    this.avatarUpdateHint.addEventListener("transitionend", () =>
      this.emit("avatarUpdateHintTransitionEnded")
    );
    this.naturalName_.on("action", () => this.emit("updateNaturalName"));
    this.contactEmail_.on("action", () => this.emit("updateContactEmail"));
    this.description_.on("action", () => this.emit("updateDescription"));
    this.emit("loaded");
  }

  private showChangeAvatarHint(): void {
    this.avatarUpdateHint.style.height = "100%";
  }

  private hideChangeAvatarHint(): void {
    this.avatarUpdateHint.style.height = "0";
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public get avatarContainer() {
    return this.avatarContainer_;
  }
  public get naturalName() {
    return this.naturalName_;
  }
  public get contactEmail() {
    return this.contactEmail_;
  }
  public get description() {
    return this.description_;
  }
}
