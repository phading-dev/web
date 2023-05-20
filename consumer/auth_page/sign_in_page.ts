import EventEmitter = require("events");
import { FilledBlockingButton } from "../common/blocking_button";
import { SCHEME } from "../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { BASIC_INPUT_STYLE } from "../common/text_input_styles";
import { WEB_SERVICE_CLIENT } from "../common/web_service_client";
import {
  CARD_STYLE,
  ERROR_LABEL_STYLE,
  INPUT_LABEL_STYLE,
  PAGE_STYLE,
  SWITCH_TEXT_STYLE,
  TITLE_STYLE,
} from "./styles";
import { signIn } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface SignInPage {
  on(event: "signUp", listener: () => void): this;
  on(event: "signedIn", listener: () => void): this;
}

export class SignInPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public usernameInput: HTMLInputElement;
  public passwordInput: HTMLInputElement;
  public switchToSignUpButton: HTMLDivElement;
  public submitButton: FilledBlockingButton;
  private signInError: HTMLDivElement;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let usernameInputRef = new Ref<HTMLInputElement>();
    let passwordInputRef = new Ref<HTMLInputElement>();
    let switchToSignUpButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let signInErrorRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "sign-in",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "sign-in-box",
          style: `${CARD_STYLE} gap: 2rem;`,
        },
        E.div(
          {
            class: "sign-in-title",
            style: TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.signInTitle)
        ),
        E.div(
          {
            class: "sign-in-username-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.usernameLabel)
        ),
        E.inputRef(usernameInputRef, {
          class: "sign-in-username-input",
          style: `${BASIC_INPUT_STYLE} border-color: ${SCHEME.neutral1};`,
          type: "text",
          autocomplete: "username",
        }),
        E.div(
          {
            class: "sign-in-password-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.passwordLabel)
        ),
        E.inputRef(passwordInputRef, {
          class: "sign-in-password-input",
          style: `${BASIC_INPUT_STYLE} border-color: ${SCHEME.neutral1};`,
          type: "text",
          autocomplete: "current-password",
        }),
        E.divRef(
          switchToSignUpButtonRef,
          {
            class: "sign-in-switch-to-sign-up",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink)
        ),
        E.div(
          {
            class: "sign-in-submit-button-wrapper",
            style: `align-self: flex-end;`,
          },
          assign(
            submitButtonRef,
            FilledBlockingButton.create(
              E.text(LOCALIZED_TEXT.signInButtonLabel)
            ).enable()
          ).body
        ),
        E.divRef(
          signInErrorRef,
          {
            class: "sign-in-error",
            style: `visibility: hidden; ${ERROR_LABEL_STYLE}`,
          },
          E.text("1")
        )
      )
    );
    this.usernameInput = usernameInputRef.val;
    this.passwordInput = passwordInputRef.val;
    this.switchToSignUpButton = switchToSignUpButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.signInError = signInErrorRef.val;

    this.submitButton.on("action", () => this.signIn());
    this.submitButton.on("postAction", (error) => this.postSignIn(error));
    this.switchToSignUpButton.addEventListener("click", () =>
      this.emit("signUp")
    );
  }

  public static create(): SignInPage {
    return new SignInPage(LOCAL_SESSION_STORAGE, WEB_SERVICE_CLIENT);
  }

  private async signIn(): Promise<void> {
    this.signInError.style.visibility = "hidden";
    let response = await signIn(this.webServiceClient, {
      username: this.usernameInput.value,
      password: this.passwordInput.value,
    });
    this.localSessionStorage.save(response.signedSession);
    this.emit("signedIn");
  }

  private postSignIn(error?: Error): void {
    if (error) {
      console.error(error);
      this.signInError.style.visibility = "visible";
      this.signInError.textContent = LOCALIZED_TEXT.signInError;
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
