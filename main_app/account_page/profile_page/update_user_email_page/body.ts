import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../../../common/input_form_page/password_input";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { FONT_S } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_EMAIL_LENGTH } from "@phading/constants/account";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { newUpdateUserEmailRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdateUserEmailRequestBody,
  UpdateUserEmailResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateUserEmailPage {
  on(event: "back", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateUserEmailPage extends EventEmitter {
  public static create(account: AccountAndUser): UpdateUserEmailPage {
    return new UpdateUserEmailPage(SERVICE_CLIENT, account);
  }

  public inputFormPage: InputFormPage<UpdateUserEmailResponse>;
  public currentPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public newUserEmailInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateUserEmailRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    account: AccountAndUser,
  ) {
    super();
    this.inputFormPage = new InputFormPage({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eFormTitle(LOCALIZED_TEXT.updateEmailTitle),
        E.input({
          name: "update-password-user-email",
          style: `display: none;`,
          autocomplete: "username email",
          value: account.userEmail,
        }),
        assign(
          this.currentPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              autocomplete: "current-password",
            },
            (value) => this.validateOrTakeCurrentPassword(value),
          ),
        ).body,
        assign(
          this.newUserEmailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.newEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "username email",
            },
            (value) => this.validateOrTakeNewEmail(value),
          ),
        ).body,
        E.div(
          {
            class: "update-email-tip",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.updateEmailTip),
        ),
      )
      .addBackButton()
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.updateButtonLabel,
        () => this.updateRecoveryEmail(),
        (error, response) => this.postUpdateUserEmail(error, response),
      )
      .addInputs(this.currentPasswordInput.val, this.newUserEmailInput.val)
      .on("primaryDone", () => this.emit("updated"))
      .on("back", () => this.emit("back"));
  }

  private validateOrTakeCurrentPassword(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else {
      this.request.password = value;
      return { valid: true };
    }
  }

  private validateOrTakeNewEmail(value: string): ValidationResult {
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

  private updateRecoveryEmail(): Promise<UpdateUserEmailResponse> {
    return this.serviceClient.send(newUpdateUserEmailRequest(this.request));
  }

  private postUpdateUserEmail(
    error?: Error,
    response?: UpdateUserEmailResponse,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else if (response.notAuthenticated) {
      return LOCALIZED_TEXT.incorrectPasswordError;
    } else if (response.userEmailUnavailable) {
      return LOCALIZED_TEXT.userEmailNotAvailableError;
    } else {
      this.emit("signOut");
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
