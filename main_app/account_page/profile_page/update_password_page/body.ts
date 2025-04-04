import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
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
  on(event: "updateError", listener: () => void): this;
}

export class UpdatePasswordPage extends EventEmitter {
  public static create(username: string): UpdatePasswordPage {
    return new UpdatePasswordPage(SERVICE_CLIENT, username);
  }

  public inputFormPage: InputFormPage<
    UpdatePasswordRequestBody,
    UpdatePasswordResponse
  >;
  public newPasswordInput = new Ref<
    TextInputWithErrorMsg<UpdatePasswordRequestBody>
  >();
  public newPasswordRepeatInput = new Ref<
    TextInputWithErrorMsg<UpdatePasswordRequestBody>
  >();
  public currentPasswordInput = new Ref<
    TextInputWithErrorMsg<UpdatePasswordRequestBody>
  >();
  private newPassword: string;

  public constructor(
    private serviceClient: WebServiceClient,
    username: string,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.updatePasswordTitle,
      [
        E.input({
          name: "update-password-username",
          style: `display: none;`,
          autocomplete: "username",
          value: username,
        }),
        assign(
          this.newPasswordInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            (request, value) => {
              request.newPassword = value;
            },
            (value) => this.checkNewPassword(value),
          ),
        ).body,
        assign(
          this.newPasswordRepeatInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.repeatNewPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            () => {},
            (value) => this.checkNewPasswordRepeat(value),
          ),
        ).body,
        assign(
          this.currentPasswordInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            (request, value) => {
              request.currentPassword = value;
            },
            (value) => this.checkCurrentPassword(value),
          ),
        ).body,
      ],
      [
        this.newPasswordInput.val,
        this.newPasswordRepeatInput.val,
        this.currentPasswordInput.val,
      ],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updatePassword(request),
      (response, error) => this.postUpdatePassword(error),
      {},
    ).addBackButton();

    this.inputFormPage.on("submitError", () => this.emit("updateError"));
    this.inputFormPage.on("submitted", () => this.emit("updated"));
    this.inputFormPage.on("back", () => this.emit("back"));
  }

  private checkNewPassword(value: string): ValidationResult {
    this.newPassword = value;
    if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newPasswordTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private checkNewPasswordRepeat(value: string): ValidationResult {
    if (value === this.newPassword) {
      return { valid: true };
    } else {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatNewPasswordNotMatchError,
      };
    }
  }

  private checkCurrentPassword(value: string): ValidationResult {
    if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private updatePassword(
    requset: UpdatePasswordRequestBody,
  ): Promise<UpdatePasswordResponse> {
    return this.serviceClient.send(newUpdatePasswordRequest(requset));
  }

  private postUpdatePassword(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
