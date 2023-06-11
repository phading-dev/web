import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { VerticalTextInputValue } from "../../common/text_input";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { CARD_STYLE, PAGE_STYLE } from "./styles";
import { getUserProfile } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface AccountInfoPage {
  on(event: "loaded", listener: () => void): this;
  on(event: "avatarUpdateHintTransitionEnded", listener: () => void): this;
  on(event: "updateAvatar", listener: () => void): this;
  on(event: "updatePassword", listener: () => void): this;
}

export class AccountInfoPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public avatarContainer: HTMLDivElement;
  public passwordEditable: VerticalTextInputValue;
  private avatarImage: HTMLImageElement;
  private avatarUpdateHint: HTMLDivElement;
  private naturalNameValue: VerticalTextInputValue;
  private usernameValue: VerticalTextInputValue;

  public constructor(private webServiceClient: WebServiceClient) {
    super();
    let avatarContainerRef = new Ref<HTMLDivElement>();
    let avatarImagePef = new Ref<HTMLImageElement>();
    let avatarUpdateHintRef = new Ref<HTMLDivElement>();
    let naturalNameValueRef = new Ref<VerticalTextInputValue>();
    let usernameValueRef = new Ref<VerticalTextInputValue>();
    let passwordEditableRef = new Ref<VerticalTextInputValue>();
    this.body = E.div(
      {
        class: "account-info",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "account-info-card",
          style: CARD_STYLE,
        },
        E.divRef(
          avatarContainerRef,
          {
            class: "account-info-avatar",
            style: `align-self: center; position: relative; height: 10rem; width: 10rem; border-radius: 10rem; overflow: hidden; cursor: pointer;`,
          },
          E.imageRef(avatarImagePef, {
            class: "account-info-avatar-image",
            style: `height: 100%; width: 100%;`,
          }),
          E.divRef(
            avatarUpdateHintRef,
            {
              class: "account-info-avatar-update-hint-background",
              style: `position: absolute; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; bottom: 0; left: 0; height: 0; width: 100%; transition: height .2s; overflow: hidden; background-color: ${SCHEME.neutral1Translucent};`,
            },
            E.div(
              {
                class: `account-info-avatar-update-hint-label`,
                style: `font-size: 1.4rem; color: ${SCHEME.neutral4};`,
              },
              E.text(LOCALIZED_TEXT.changeAvatarLabel)
            )
          )
        ),
        assign(
          naturalNameValueRef,
          VerticalTextInputValue.create(
            LOCALIZED_TEXT.naturalNameLabel,
            "",
            "",
            ""
          )
        ).body,
        assign(
          usernameValueRef,
          VerticalTextInputValue.create(
            LOCALIZED_TEXT.usernameLabel,
            "",
            "",
            ""
          )
        ).body,
        assign(
          passwordEditableRef,
          VerticalTextInputValue.create(
            LOCALIZED_TEXT.passwordLabel,
            "******",
            "",
            `border-bottom: .1rem dashed ${SCHEME.neutral1}; cursor: pointer;`
          )
        ).body
      )
    );
    this.avatarContainer = avatarContainerRef.val;
    this.avatarImage = avatarImagePef.val;
    this.avatarUpdateHint = avatarUpdateHintRef.val;
    this.naturalNameValue = naturalNameValueRef.val;
    this.usernameValue = usernameValueRef.val;
    this.passwordEditable = passwordEditableRef.val;

    this.hideChangeAvatarHint();
    this.loadAccountInfo();
    this.avatarContainer.addEventListener("mouseenter", () =>
      this.showChangeAvatarHint()
    );
    this.avatarContainer.addEventListener("mouseleave", () =>
      this.hideChangeAvatarHint()
    );
    this.avatarContainer.addEventListener("click", () =>
      this.emit("updateAvatar")
    );
    this.avatarUpdateHint.addEventListener("transitionend", () =>
      this.emit("avatarUpdateHintTransitionEnded")
    );
    this.passwordEditable.on("click", () => this.emit("updatePassword"));
  }

  public static create(): AccountInfoPage {
    return new AccountInfoPage(WEB_SERVICE_CLIENT);
  }

  private showChangeAvatarHint(): void {
    this.avatarUpdateHint.style.height = "100%";
  }

  private hideChangeAvatarHint(): void {
    this.avatarUpdateHint.style.height = "0";
  }

  private async loadAccountInfo(): Promise<void> {
    let response = await getUserProfile(this.webServiceClient, {});
    this.usernameValue.setValue(response.username);
    this.naturalNameValue.setValue(response.naturalName);
    this.avatarImage.src = response.avatarLargePath;
    this.emit("loaded");
  }

  public remove(): void {
    this.body.remove();
  }
}
