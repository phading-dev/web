import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { createBrandIcon } from "../../../common/icons";
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { MandatoryCheckboxInput } from "../../../common/input_form_page/mandatory_checkbox_input";
import { RadioOptionInput } from "../../../common/input_form_page/option_input";
import { PasswordInputWithErrorMsg } from "../../../common/input_form_page/password_input";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill } from "../../../common/option_buttons";
import { FONT_L, FONT_S, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "../common/styles";
import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@phading/constants/account";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newSignUpRequest } from "@phading/user_service_interface/web/self/client";
import {
  SignUpRequestBody,
  SignUpResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SignUpPage {
  on(event: "verifyEmail", listener: (email: string) => void): this;
  on(event: "signIn", listener: () => void): this;
  on(event: "signUpDone", listener: () => void): this;
}

export class SignUpPage extends EventEmitter {
  public static create(initAccountType?: AccountType): SignUpPage {
    return new SignUpPage(SERVICE_CLIENT, initAccountType);
  }

  private subtitle = new Ref<HTMLDivElement>();
  public emailInput = new Ref<TextInputWithErrorMsg>();
  public passwordInput = new Ref<PasswordInputWithErrorMsg>();
  public repeatPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public accountNameInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeInput = new Ref<RadioOptionInput<AccountType>>();
  public switchToSignInButton = new Ref<HTMLDivElement>();
  public acceptTermsCheckbox = new Ref<MandatoryCheckboxInput>();
  public acceptPublisherTermsCheckbox = new Ref<MandatoryCheckboxInput>();
  public inputFormPage: InputFormPage<SignUpResponse>;
  private request: SignUpRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    initAccountType?: AccountType,
  ) {
    super();
    this.inputFormPage = new InputFormPage<SignUpResponse>(
      "",
      [
        createBrandIcon(),
        assign(
          this.subtitle,
          E.div({
            class: "sign-up-subtitle",
            style: `align-self: center; text-align: center; font-size: ${FONT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
          }),
        ),
        assign(
          this.emailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.emailLabel,
            "",
            {
              type: "email",
              autocomplete: "username email",
            },
            (value) => this.validateOrTakeEmailInput(value),
          ),
        ).body,
        assign(
          this.passwordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateOrTakePasswordInput(value),
          ),
        ).body,
        assign(
          this.repeatPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.repeatPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateRepeatPasswordInput(value),
          ),
        ).body,
        assign(
          this.accountNameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.accountNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
            },
            (value) => this.validateOrTakeAccountNameLabel(value),
          ),
        ).body,
        assign(
          this.accountTypeInput,
          new RadioOptionInput(
            LOCALIZED_TEXT.chooseAccountTypeLabel,
            "",
            [
              assign(
                this.consumerOption,
                new OptionPill(
                  LOCALIZED_TEXT.userTypeConsumerLabel,
                  AccountType.CONSUMER,
                  "",
                ),
              ),
              assign(
                this.publisherOption,
                new OptionPill(
                  LOCALIZED_TEXT.userTypePublisherLabel,
                  AccountType.PUBLISHER,
                  "",
                ),
              ),
            ],
            (value) => this.changeAccountType(value),
          ),
        ).body,
        E.div(
          {
            class: "sign-up-account-tip",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.addMoreAccountsTip),
        ),
        assign(
          this.acceptTermsCheckbox,
          new MandatoryCheckboxInput(
            "",
            E.text(LOCALIZED_TEXT.acceptTerms[0]),
            E.a(
              {
                href: "/terms",
                target: "_blank",
                style: CLICKABLE_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.acceptTerms[1]),
            ),
            E.text(LOCALIZED_TEXT.acceptTerms[2]),
            E.a(
              {
                href: "/privacy",
                target: "_blank",
                style: CLICKABLE_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.acceptTerms[3]),
            ),
            E.text(LOCALIZED_TEXT.acceptTerms[4]),
          ),
        ).body,
        assign(
          this.acceptPublisherTermsCheckbox,
          new MandatoryCheckboxInput(
            "",
            E.text(LOCALIZED_TEXT.acceptPublisherTerms[0]),
            E.a(
              {
                href: "/terms",
                target: "_blank",
                style: CLICKABLE_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.acceptPublisherTerms[1]),
            ),
            E.text(LOCALIZED_TEXT.acceptPublisherTerms[2]),
            E.a(
              {
                href: "/privacy",
                target: "_blank",
                style: CLICKABLE_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.acceptPublisherTerms[3]),
            ),
            E.text(LOCALIZED_TEXT.acceptPublisherTerms[4]),
            E.a(
              {
                href: "/publisher",
                target: "_blank",
                style: CLICKABLE_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.acceptPublisherTerms[5]),
            ),
            E.text(LOCALIZED_TEXT.acceptPublisherTerms[6]),
          ),
        ).body,
        E.divRef(
          this.switchToSignInButton,
          {
            class: "sign-up-switch-to-sign-in",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink),
        ),
      ],
      LOCALIZED_TEXT.signUpButtonLabel,
    )
      .addPrimaryAction(
        () => this.signUp(),
        (response, error) => this.postSignUp(response, error),
      )
      .on("handlePrimarySuccess", (response) =>
        this.emit("verifyEmail", this.request.userEmail),
      )
      .on("primaryDone", () => this.emit("signUpDone"))
      .addInputs(
        this.emailInput.val,
        this.passwordInput.val,
        this.repeatPasswordInput.val,
        this.accountNameInput.val,
        this.acceptTermsCheckbox.val,
      );
    this.accountTypeInput.val.setValue(initAccountType ?? AccountType.CONSUMER);
    this.switchToSignInButton.val.addEventListener("click", () =>
      this.emit("signIn"),
    );
  }

  private validateOrTakeEmailInput(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_EMAIL_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.emailTooLongError,
      };
    } else {
      this.request.userEmail = value;
      return { valid: true };
    }
  }

  private validateOrTakePasswordInput(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.passwordTooLongError,
      };
    } else {
      this.request.password = value;
      return { valid: true };
    }
  }

  private validateRepeatPasswordInput(value: string): ValidationResult {
    if (!this.request.password || !value) {
      return {
        valid: false,
      };
    } else if (value !== this.request.password) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatPasswordNotMatchError,
      };
    } else {
      return { valid: true };
    }
  }

  private validateOrTakeAccountNameLabel(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return { valid: false };
    } else if (value.length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.accountNameTooLongError,
      };
    } else {
      this.request.name = value;
      return { valid: true };
    }
  }

  private changeAccountType(value: AccountType): void {
    this.request.accountType = value;
    if (value === AccountType.CONSUMER) {
      this.subtitle.val.textContent = LOCALIZED_TEXT.signUpViewerSubtitle;
      this.acceptTermsCheckbox.val.show();
      this.inputFormPage.addInputs(this.acceptTermsCheckbox.val);
      this.acceptPublisherTermsCheckbox.val.hide();
      this.inputFormPage.removeInputs(this.acceptPublisherTermsCheckbox.val);
    } else if (value === AccountType.PUBLISHER) {
      this.subtitle.val.textContent = LOCALIZED_TEXT.signUpPublisherSubtitle;
      this.acceptTermsCheckbox.val.hide();
      this.inputFormPage.removeInputs(this.acceptTermsCheckbox.val);
      this.acceptPublisherTermsCheckbox.val.show();
      this.inputFormPage.addInputs(this.acceptPublisherTermsCheckbox.val);
    }
  }

  private signUp(): Promise<SignUpResponse> {
    return this.serviceClient.send(newSignUpRequest(this.request));
  }

  private postSignUp(response: SignUpResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.signUpError;
    } else if (response.userEmailUnavailable) {
      return LOCALIZED_TEXT.userEmailAlreadyExists;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
