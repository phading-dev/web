import EventEmitter = require("events");
import { FilledBlockingButton } from "./common/blocking_button";
import { SCHEME } from "./common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { LOCALIZED_TEXT } from "./common/locales/localized_text";
import { VerticalTextInputWithErrorMsg } from "./common/text_input";
import { WEB_SERVICE_CLIENT } from "./common/web_service_client";
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
  private usernameInput: VerticalTextInputWithErrorMsg;
  private passwordInput: VerticalTextInputWithErrorMsg;
  private switcherToSignUpButton: HTMLDivElement;
  private submitButton: FilledBlockingButton;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let usernameInputRef = new Ref<VerticalTextInputWithErrorMsg>();
    let passwordInputRef = new Ref<VerticalTextInputWithErrorMsg>();
    let switcherToSignUpButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    this.body = E.div(
      {
        class: "sign-in",
        style: `flex-flow: column nowrap; width: 100vw; min-height: 100vh;`,
      },
      E.div(
        {
          class: "sign-in-box",
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
              autocomplete: "current-password",
            }
          )
        ).body,
        E.divRef(
          switcherToSignUpButtonRef,
          {
            class: "sign-in-switch-to-sign-up",
            style: `margin: 1rem 5rem; font-size: 1.4rem; color: ${SCHEME.neutral1}; cursor: pointer;`,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink)
        ),
        E.div(
          {
            class: "sign-in-submit-button-wrapper",
            style: `margin: 1rem 5rem; align-self: flex-end;`,
          },
          assign(
            submitButtonRef,
            FilledBlockingButton.create(
              true,
              E.text(LOCALIZED_TEXT.signInButtonLabel)
            )
          ).body
        )
      )
    );
    this.usernameInput = usernameInputRef.val;
    this.passwordInput = passwordInputRef.val;
    this.switcherToSignUpButton = switcherToSignUpButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.hide();

    this.submitButton.on("action", () => this.signIn());
    this.switcherToSignUpButton.addEventListener("click", () =>
      this.switchToSignUp()
    );
  }

  public static create(): SignInPage {
    return new SignInPage(LOCAL_SESSION_STORAGE, WEB_SERVICE_CLIENT);
  }

  private async signIn(): Promise<void> {
    let response = await signIn(this.webServiceClient, {
      username: this.usernameInput.getValue(),
      password: this.passwordInput.getValue(),
    });
    this.localSessionStorage.save(response.signedSession);
    this.emit("signedIn");
  }

  private switchToSignUp(): void {
    this.emit("signUp");
  }

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
