import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { getUserInfo } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

let INPUT_LINE_STYLE = `display: flex; flex-flow: row nowrap; box-sizing: border-box; width: 100%; padding: 0 10% 2.5rem; line-height: 2rem;`;
let LABEL_STYLE = `flex: 0 0 12rem; font-size: 1.4rem; color: ${SCHEME.neutral0};`;
let VALUE_TEXT_STYLE = `flex: 1 0 0; font-size: 1.4rem; color: ${SCHEME.neutral0};`;

export interface AccountBasicTab {
  on(event: "avatarChangeHintTransitionEnded", listener: () => void): this;
  on(event: "changeAvatar", listener: () => void): this;
}

export class AccountBasicTab extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public avatarContainer: HTMLDivElement;
  private avatarImage: HTMLImageElement;
  private avatarChangeHint: HTMLDivElement;
  private usernameValue: HTMLDivElement;
  private naturalNameValue: HTMLDivElement;
  private emailValue: HTMLDivElement;

  public constructor(protected webServiceClient: WebServiceClient) {
    super();
    let avatarContainerRef = new Ref<HTMLDivElement>();
    let avatarImagePef = new Ref<HTMLImageElement>();
    let avatarChangeHintRef = new Ref<HTMLDivElement>();
    let usernameValueRef = new Ref<HTMLDivElement>();
    let naturalNameValueRef = new Ref<HTMLDivElement>();
    let emailValueRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "account-basic",
        style: `display: flex; flex-flow: column nowrap; align-items: center; width: 100%; padding-bottom: 5rem;`,
      },
      E.divRef(
        avatarContainerRef,
        {
          class: "account-basic-avatar",
          style: `position: relative; height: 10rem; width: 10rem; border-radius: 10rem; margin: 5rem; overflow: hidden; cursor: pointer;`,
        },
        E.imageRef(avatarImagePef, {
          class: "account-basic-avatar-image",
          style: `height: 100%; width: 100%;`,
        }),
        E.divRef(
          avatarChangeHintRef,
          {
            class: "account-basic-avatar-change-hint-background",
            style: `position: absolute; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; bottom: 0; left: 0; height: 0; width: 100%; transition: height .2s; overflow: hidden; background-color: ${SCHEME.neutral1Translucent};`,
          },
          E.div(
            {
              class: `account-basic-avatar-change-hint-label`,
              style: `font-size: 1.4rem; color: ${SCHEME.neutral4};`,
            },
            E.text(LOCALIZED_TEXT.changeAvatarLabel)
          )
        )
      ),
      E.div(
        {
          class: "account-basic-username",
          style: INPUT_LINE_STYLE,
        },
        E.div(
          {
            class: "account-basic-username-label",
            style: LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.usernameLabel)
        ),
        E.divRef(usernameValueRef, {
          class: "account-basic-username-value",
          style: VALUE_TEXT_STYLE,
        })
      ),
      E.div(
        {
          class: "account-basic-natural-name",
          style: INPUT_LINE_STYLE,
        },
        E.div(
          {
            class: "account-basic-natural-name-label",
            style: LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.naturalNameLabel)
        ),
        E.divRef(naturalNameValueRef, {
          class: "account-basic-natural-name-value",
          style: VALUE_TEXT_STYLE,
        })
      ),
      E.div(
        {
          class: "account-basic-email",
          style: INPUT_LINE_STYLE,
        },
        E.div(
          {
            class: "account-basic-email-label",
            style: LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.emailLabel)
        ),
        E.divRef(emailValueRef, {
          class: "account-basic-email-value",
          style: VALUE_TEXT_STYLE,
        })
      )
    );
    this.avatarContainer = avatarContainerRef.val;
    this.avatarImage = avatarImagePef.val;
    this.avatarChangeHint = avatarChangeHintRef.val;
    this.usernameValue = usernameValueRef.val;
    this.naturalNameValue = naturalNameValueRef.val;
    this.emailValue = emailValueRef.val;

    this.hideChangeAvatarHint();
    this.avatarContainer.addEventListener("mouseenter", () =>
      this.showChangeAvatarHint()
    );
    this.avatarContainer.addEventListener("mouseleave", () =>
      this.hideChangeAvatarHint()
    );
    this.avatarContainer.addEventListener("click", () =>
      this.switchToChangeAvatar()
    );
    this.avatarChangeHint.addEventListener("transitionend", () =>
      this.emit("avatarChangeHintTransitionEnded")
    );
  }

  public static create(): AccountBasicTab {
    return new AccountBasicTab(WEB_SERVICE_CLIENT);
  }

  private showChangeAvatarHint(): void {
    this.avatarChangeHint.style.height = "100%";
  }

  private hideChangeAvatarHint(): void {
    this.avatarChangeHint.style.height = "0";
  }

  private switchToChangeAvatar(): void {
    this.emit("changeAvatar");
  }

  public async show(): Promise<void> {
    this.body.style.display = "flex";
    let response = await getUserInfo(this.webServiceClient, {});
    this.usernameValue.textContent = response.username;
    this.naturalNameValue.textContent = response.naturalName;
    this.emailValue.textContent = response.email;
    this.avatarImage.src = response.avatarLargePath;
  }

  public hide(): this {
    this.body.style.display = "none";
    return this;
  }
}
