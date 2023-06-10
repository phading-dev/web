import EventEmitter = require("events");
import { FilledBlockingButton } from "../common/blocking_button";
import { SCHEME } from "../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { VerticalTextInputWithErrorMsg } from "../common/text_input";
import { WEB_SERVICE_CLIENT } from "../common/web_service_client";
import {
  CARD_STYLE,
  PAGE_STYLE,
  SWITCH_TEXT_STYLE,
  TITLE_STYLE,
} from "./styles";
import { signIn } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

enum InputField {
  USERNAME,
  PASSWORD,
}

export interface SignInPage {
  on(event: "signUp", listener: () => void): this;
  on(event: "signedIn", listener: () => void): this;
}

export class SignInPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public usernameInput: VerticalTextInputWithErrorMsg<InputField>;
  public passwordInput: VerticalTextInputWithErrorMsg<InputField>;
  public switchToSignUpButton: HTMLDivElement;
  public submitButton: FilledBlockingButton;
  private submitError: HTMLDivElement;
  private validInputs = new Set<InputField>();

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let usernameInputRef = new Ref<VerticalTextInputWithErrorMsg<InputField>>();
    let passwordInputRef = new Ref<VerticalTextInputWithErrorMsg<InputField>>();
    let switchToSignUpButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let submitErrorRef = new Ref<HTMLDivElement>();
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
        assign(
          usernameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.usernameLabel,
            "",
            {
              type: "text",
              autocomplete: "username",
            },
            this.validInputs,
            InputField.USERNAME
          )
        ).body,
        assign(
          passwordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            this.validInputs,
            InputField.PASSWORD
          )
        ).body,
        E.divRef(
          switchToSignUpButtonRef,
          {
            class: "sign-in-switch-to-sign-up",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink)
        ),
        assign(
          submitButtonRef,
          FilledBlockingButton.create(
            `align-self: flex-end;`,
            E.text(LOCALIZED_TEXT.signInButtonLabel)
          )
        ).body,
        E.divRef(
          submitErrorRef,
          {
            class: "sign-in-error",
            style: `visibility: hidden; align-self: flex-end; font-size: 1.2rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.usernameInput = usernameInputRef.val;
    this.passwordInput = passwordInputRef.val;
    this.switchToSignUpButton = switchToSignUpButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.submitError = submitErrorRef.val;

    this.refreshSubmitButton();
    this.usernameInput.on("input", () => this.checkUsernameInput());
    this.usernameInput.on("enter", () => this.submitButton.click());
    this.passwordInput.on("input", () => this.checkPasswordInput());
    this.passwordInput.on("enter", () => this.submitButton.click());
    this.submitButton.on("action", () => this.signIn());
    this.submitButton.on("postAction", (error) => this.postSignIn(error));
    this.switchToSignUpButton.addEventListener("click", () =>
      this.emit("signUp")
    );
  }

  public static create(): SignInPage {
    return new SignInPage(LOCAL_SESSION_STORAGE, WEB_SERVICE_CLIENT);
  }

  private refreshSubmitButton(): void {
    if (
      this.validInputs.has(InputField.USERNAME) &&
      this.validInputs.has(InputField.PASSWORD)
    ) {
      this.submitButton.enable();
    } else {
      this.submitButton.disable();
    }
  }

  private checkUsernameInput(): void {
    if (this.usernameInput.value.length > 0) {
      this.usernameInput.setAsValid();
    } else {
      this.usernameInput.setAsInvalid();
    }
    this.refreshSubmitButton();
  }

  private checkPasswordInput(): void {
    if (this.passwordInput.value.length > 0) {
      this.passwordInput.setAsValid();
    } else {
      this.passwordInput.setAsInvalid();
    }
    this.refreshSubmitButton();
  }

  private async signIn(): Promise<void> {
    this.submitError.style.visibility = "hidden";
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
      this.submitError.style.visibility = "visible";
      this.submitError.textContent = LOCALIZED_TEXT.signInError;
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
