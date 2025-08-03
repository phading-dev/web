import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button";
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
import {
  FONT_L,
  FONT_M,
  FONT_WEIGHT_600,
  GAP_1X,
  GAP_2X,
  GAP_d_5X,
  LINE_HEIGHT_L,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
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

  public inputFormPage: InputFormPage<SignUpResponse>;
  private subtitleViewer = new Ref<HTMLDivElement>();
  private subtitlePublisher = new Ref<HTMLDivElement>();
  public emailInput = new Ref<TextInputWithErrorMsg>();
  public passwordInput = new Ref<PasswordInputWithErrorMsg>();
  public repeatPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public accountNameInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeOptionsInput = new Ref<RadioOptionInput<AccountType>>();
  public acceptTermsCheckbox = new Ref<MandatoryCheckboxInput>();
  public acceptPublisherTermsCheckbox = new Ref<MandatoryCheckboxInput>();
  private publisherAgreementLink = new Ref<HTMLDivElement>();
  public switchToSignInButton = new Ref<HTMLDivElement>();
  private request: SignUpRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    initAccountType?: AccountType,
  ) {
    super();
    this.inputFormPage = new InputFormPage<SignUpResponse>()
      .addLines(
        E.div(
          {
            class: "sign-up-header",
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          createBrandIcon(),
          assign(
            this.subtitleViewer,
            E.div(
              {
                class: "sign-up-subtitle-viewer",
                style: `align-self: center; text-align: center;`,
              },
              E.div(
                {
                  style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.signUpViewerSubtitle[0]),
              ),
              E.div(
                {
                  style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.signUpViewerSubtitle[1]),
              ),
            ),
          ),
          assign(
            this.subtitlePublisher,
            E.div(
              {
                class: "sign-up-subtitle-publisher",
                style: `align-self: center; text-align: center;`,
              },
              E.div(
                {
                  style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.signUpPublisherSubtitle[0]),
              ),
              E.div(
                {
                  style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.signUpPublisherSubtitle[1]),
              ),
            ),
          ),
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
        E.div(
          {
            class: "sign-up-account-type-with-tips",
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          assign(
            this.accountTypeOptionsInput,
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
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.addMoreAccountsTip),
          ),
        ),
        E.div(
          {
            class: "sign-up-terms",
          },
          assign(
            this.acceptTermsCheckbox,
            new MandatoryCheckboxInput("", LOCALIZED_TEXT.acceptTerms),
          ).body,
          assign(
            this.acceptPublisherTermsCheckbox,
            new MandatoryCheckboxInput("", LOCALIZED_TEXT.acceptTerms),
          ).body,
          E.div(
            {},
            E.div(
              {
                style: `display: inline; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; margin: 0 ${GAP_d_5X}rem 0 ${GAP_2X}rem;`,
              },
              E.text("•"),
            ),
            E.a(
              {
                class: "sign-up-terms-link",
                href: "/terms",
                target: "_blank",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.termsOfService),
            ),
          ),
          E.div(
            {},
            E.div(
              {
                style: `display: inline; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; margin: 0 ${GAP_d_5X}rem 0 ${GAP_2X}rem;`,
              },
              E.text("•"),
            ),
            E.a(
              {
                class: "sign-up-privacy-link",
                href: "/privacy",
                target: "_blank",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.privacyPolicy),
            ),
          ),
          E.divRef(
            this.publisherAgreementLink,
            {},
            E.div(
              {
                style: `display: inline; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; margin: 0 ${GAP_d_5X}rem 0 ${GAP_2X}rem;`,
              },
              E.text("•"),
            ),
            E.a(
              {
                class: "sign-up-publisher-agreement-link",
                href: "/publisher",
                target: "_blank",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.publisherAgreement),
            ),
          ),
        ),
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.signUpButtonLabel,
        () => this.signUp(),
        (error, response) => this.postSignUp(error, response),
      )
      .addLines(
        E.divRef(
          this.switchToSignInButton,
          {
            class: "sign-up-switch-to-sign-in",
            style: `${CLICKABLE_TEXT_STYLE} align-self: flex-end; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink),
        ),
      )
      .on("primaryDone", () => this.emit("signUpDone"))
      .addInputs(
        this.emailInput.val,
        this.passwordInput.val,
        this.repeatPasswordInput.val,
        this.accountNameInput.val,
      );
    this.accountTypeOptionsInput.val.setValue(
      initAccountType ?? AccountType.CONSUMER,
    );
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
      this.subtitleViewer.val.style.display = "block";
      this.subtitlePublisher.val.style.display = "none";
      this.acceptTermsCheckbox.val.show();
      this.inputFormPage.addInputs(this.acceptTermsCheckbox.val);
      this.acceptPublisherTermsCheckbox.val.hide();
      this.inputFormPage.removeInputs(this.acceptPublisherTermsCheckbox.val);
      this.publisherAgreementLink.val.style.display = "none";
    } else if (value === AccountType.PUBLISHER) {
      this.subtitleViewer.val.style.display = "none";
      this.subtitlePublisher.val.style.display = "block";
      this.acceptTermsCheckbox.val.hide();
      this.inputFormPage.removeInputs(this.acceptTermsCheckbox.val);
      this.acceptPublisherTermsCheckbox.val.show();
      this.inputFormPage.addInputs(this.acceptPublisherTermsCheckbox.val);
      this.publisherAgreementLink.val.style.display = "inline";
    }
  }

  private signUp(): Promise<SignUpResponse> {
    return this.serviceClient.send(newSignUpRequest(this.request));
  }

  private postSignUp(error?: Error, response?: SignUpResponse): string {
    if (error) {
      return LOCALIZED_TEXT.signUpError;
    } else if (response.userEmailUnavailable) {
      return LOCALIZED_TEXT.userEmailAlreadyExists;
    } else {
      this.emit("verifyEmail", this.request.userEmail);
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
