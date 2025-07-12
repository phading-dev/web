import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../../../common/input_form_page/password_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_PASSWORD_LENGTH } from "@phading/constants/account";
import { newUpdatePasswordRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdatePasswordRequestBody,
  UpdatePasswordResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePasswordPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdatePasswordPage extends EventEmitter {
  public static create(username: string): UpdatePasswordPage {
    return new UpdatePasswordPage(SERVICE_CLIENT, username);
  }

  public inputFormPage: InputFormPage<UpdatePasswordResponse>;
  public newPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public newPasswordRepeatInput = new Ref<PasswordInputWithErrorMsg>();
  public currentPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  private request: UpdatePasswordRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    username: string,
  ) {
    super();
    this.inputFormPage = new InputFormPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      [
        eFormTitle(LOCALIZED_TEXT.updatePasswordTitle),
        E.input({
          name: "update-password-username",
          style: `display: none;`,
          autocomplete: "username",
          value: username,
        }),
        assign(
          this.newPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateOrTakeNewPassword(value),
          ),
        ).body,
        assign(
          this.newPasswordRepeatInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.repeatNewPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateNewPasswordRepeat(value),
          ),
        ).body,
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
      ],
      LOCALIZED_TEXT.updateButtonLabel,
    )
      .addBackButton()
      .addPrimaryAction(
        () => this.updatePassword(),
        (response, error) => this.postUpdatePassword(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"))
      .on("back", () => this.emit("back"))
      .addInputs(
        this.newPasswordInput.val,
        this.newPasswordRepeatInput.val,
        this.currentPasswordInput.val,
      );
  }

  private validateOrTakeNewPassword(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newPasswordTooLongError,
      };
    } else {
      this.request.newPassword = value;
      return { valid: true };
    }
  }

  private validateNewPasswordRepeat(value: string): ValidationResult {
    if (!this.request.newPassword || !value) {
      return { valid: false };
    }
    if (value === this.request.newPassword) {
      return { valid: true };
    } else {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatPasswordNotMatchError,
      };
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

  private updatePassword(): Promise<UpdatePasswordResponse> {
    return this.serviceClient.send(newUpdatePasswordRequest(this.request));
  }

  private postUpdatePassword(error?: Error): string {
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
