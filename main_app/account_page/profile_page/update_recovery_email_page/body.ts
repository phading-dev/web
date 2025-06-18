import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_EMAIL_LENGTH } from "@phading/constants/account";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { newUpdateRecoveryEmailRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdateRecoveryEmailRequestBody,
  UpdateRecoveryEmailResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateRecoveryEmailPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateRecoveryEmailPage extends EventEmitter {
  public static create(account: AccountAndUser): UpdateRecoveryEmailPage {
    return new UpdateRecoveryEmailPage(SERVICE_CLIENT, account);
  }

  public inputFormPage: InputFormPage<UpdateRecoveryEmailResponse>;
  public newRecoveryEmailInput = new Ref<TextInputWithErrorMsg>();
  public currentPasswordInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateRecoveryEmailRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    account: AccountAndUser,
  ) {
    super();
    this.inputFormPage = new InputFormPage(
      LOCALIZED_TEXT.updateRecoveryEmailTitle,
      [
        E.input({
          name: "update-password-username",
          style: `display: none;`,
          autocomplete: "username",
          value: account.username,
        }),
        assign(
          this.newRecoveryEmailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.emailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
              value: account.recoveryEmail,
            },
            (value) => this.validateOrTakeNewEmail(value),
          ),
        ).body,
        assign(
          this.currentPasswordInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            (value) => this.validateOrTakeCurrentPassword(value),
          ),
        ).body,
      ],
      [this.newRecoveryEmailInput.val, this.currentPasswordInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    )
      .addBackButton()
      .addPrimaryAction(
        () => this.updateRecoveryEmail(),
        (response, error) => this.postUpdateRecoveryEmail(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"))
      .on("back", () => this.emit("back"));
    this.newRecoveryEmailInput.val.validate();
    this.currentPasswordInput.val.validate();
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

  private validateOrTakeCurrentPassword(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else {
      this.request.currentPassword = value;
      return { valid: true };
    }
  }

  private updateRecoveryEmail(): Promise<UpdateRecoveryEmailResponse> {
    return this.serviceClient.send(newUpdateRecoveryEmailRequest(this.request));
  }

  private postUpdateRecoveryEmail(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
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
