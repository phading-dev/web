import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createAccountOutlineIcon } from "../../../common/icons";
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../../common/input_form_page/password_input";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eFormTitle } from "../../../common/page_elements";
import {
  FONT_M,
  FONT_WEIGHT_600,
  GAP_1X,
  ICON_XXL,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { MAX_EMAIL_LENGTH } from "@phading/constants/account";
import { newUpdateUserEmailWithPasswordRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdateUserEmailWithPasswordRequestBody,
  UpdateUserEmailWithPasswordResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ChangeEmailPage {
  on(event: "back", listener: () => void): this;
  on(event: "verifyEmail", listener: (email: string) => void): this;
  on(event: "updated", listener: () => void): this;
}

export class ChangeEmailPage extends EventEmitter {
  public static create(email: string): ChangeEmailPage {
    return new ChangeEmailPage(SERVICE_CLIENT, email);
  }

  public inputFormPage: InputFormPage<UpdateUserEmailWithPasswordResponse>;
  public passwordInput = new Ref<PasswordInputWithErrorMsg>();
  public emailInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateUserEmailWithPasswordRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    currentEmail: string,
  ) {
    super();
    this.request.currentEmail = currentEmail;
    this.inputFormPage = new InputFormPage()
      .addLines(
        E.div(
          {
            class: "change-email-page",
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "change-email-icon",
              style: `align-self: center; height: ${ICON_XXL}rem;`,
            },
            createAccountOutlineIcon(SCHEME.primary1),
          ),
          eFormTitle(LOCALIZED_TEXT.changeEmailTitle),
          E.div(
            {
              class: "change-email-current-email",
              style: `align-self: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
            },
            E.text(LOCALIZED_TEXT.currentEmail[0]),
            E.div(
              {
                style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
              },
              E.text(currentEmail),
            ),
            E.text(LOCALIZED_TEXT.currentEmail[1]),
          ),
        ),
        E.input({
          name: "change-email-current-email-hidden",
          style: `display: none;`,
          autocomplete: "username email",
          value: currentEmail,
        }),
        assign(
          this.passwordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              autocomplete: "current-password",
            },
            (value) => this.validateOrTakePasswordInput(value),
          ),
        ).body,
        assign(
          this.emailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.newEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "username email",
            },
            (value) => this.validateOrTakeEmailInput(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.updateButtonLabel,
        () => this.update(),
        (error, response) => this.postUpdate(error, response),
      )
      .addBackButton()
      .addInputs(this.passwordInput.val, this.emailInput.val)
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"));
  }

  private validateOrTakePasswordInput(value: string): ValidationResult {
    if (value) {
      this.request.password = value;
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
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
      this.request.newEmail = value;
      return { valid: true };
    }
  }

  private update(): Promise<UpdateUserEmailWithPasswordResponse> {
    return this.serviceClient.send(
      newUpdateUserEmailWithPasswordRequest(this.request),
    );
  }

  private postUpdate(
    error?: Error,
    response?: UpdateUserEmailWithPasswordResponse,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else if (response.notAuthenticated) {
      return LOCALIZED_TEXT.incorrectPasswordError;
    } else if (response.userEmailUnavailable) {
      return LOCALIZED_TEXT.userEmailNotAvailableError;
    } else {
      this.emit("verifyEmail", this.request.newEmail);
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
