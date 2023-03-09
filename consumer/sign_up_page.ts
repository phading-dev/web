import EventEmitter = require("events");
import { FilledBlockingButton } from "./common/blocking_button";
import { SCHEME } from "./common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { LOCALIZED_TEXT } from "./common/locales/localized_text";
import { VerticalTextInputWithErrorMsg } from "./common/text_input";
import { WEB_SERVICE_CLIENT } from "./common/web_service_client";
import { signUp } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface SignUpPage {
  on(event: "signIn", listener: () => void): this;
  on(event: "signedUp", listener: () => void): this;
}

export class SignUpPage extends EventEmitter {
  public body: HTMLDivElement;
  private usernameInput: VerticalTextInputWithErrorMsg;
  private passwordInput: VerticalTextInputWithErrorMsg;
  private switcherToSignInButton: HTMLDivElement;
  private submitButton: FilledBlockingButton;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let usernameInputRef = new Ref<VerticalTextInputWithErrorMsg>();
    let passwordInputRef = new Ref<VerticalTextInputWithErrorMsg>();
    let switcherToSignInButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    this.body = E.div(
      {
        class: "sign-up",
        style: `flex-flow: column nowrap; width: 100vw; min-height: 100vh;`,
      },
      E.div(
        {
          class: "sign-up-box",
          style: `display: flex; flex-flow: column nowrap; width: 50rem; margin: auto;`,
        },
        assign(
          usernameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.usernameLabel,
            `margin: 1rem 5rem;`,
            {
              type: "text",
              autocomplete: "username",
            }
          )
        ).body,
        assign(
          passwordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.passwordLabel,
            `margin: 1rem 5rem;`,
            {
              type: "password",
              autocomplete: "new-password",
            }
          )
        ).body,
        E.divRef(
          switcherToSignInButtonRef,
          {
            class: "sign-up-switch-to-sign-in",
            style: `margin: 1rem 5rem; font-size: 1.4rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink)
        ),
        E.div(
          {
            class: "sign-up-submit-button-wrapper",
            style: `margin: 1rem 5rem; align-self: flex-end;`,
          },
          assign(
            submitButtonRef,
            FilledBlockingButton.create(
              true,
              E.text(LOCALIZED_TEXT.signUpButtonLabel)
            )
          ).body
        )
      )
    );
    this.usernameInput = usernameInputRef.val;
    this.passwordInput = passwordInputRef.val;
    this.switcherToSignInButton = switcherToSignInButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.hide();

    this.submitButton.on("action", () => this.signUp());
    this.switcherToSignInButton.addEventListener("click", () =>
      this.switchToSignIn()
    );
  }

  public static create(): SignUpPage {
    return new SignUpPage(LOCAL_SESSION_STORAGE, WEB_SERVICE_CLIENT);
  }

  private async signUp(): Promise<void> {
    let response = await signUp(this.webServiceClient, {
      username: this.usernameInput.getValue(),
      password: this.passwordInput.getValue(),
    });
    this.localSessionStorage.save(response.signedSession);
    this.emit("signedUp");
  }

  private switchToSignIn(): void {
    this.emit("signIn");
  }

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
