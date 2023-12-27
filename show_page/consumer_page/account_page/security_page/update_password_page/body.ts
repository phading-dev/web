import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { VerticalTextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { PASSWORD_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updatePassword } from "@phading/user_service_interface/self/web/client_requests";
import {
  UpdatePasswordRequestBody,
  UpdatePasswordResponse,
} from "@phading/user_service_interface/self/web/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePasswordPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdatePasswordPage extends EventEmitter {
  public static create(): UpdatePasswordPage {
    return new UpdatePasswordPage(USER_SERVICE_CLIENT);
  }

  private backMenuItem_: MenuItem;
  private newPasswordInput_: VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>;
  private newPasswordRepeatInput_: VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>;
  private currentPasswordInput_: VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdatePasswordRequestBody,
    UpdatePasswordResponse
  >;
  private newPassword: string;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let newPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>
    >();
    let newPasswordRepeatInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>
    >();
    let currentPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdatePasswordRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updatePasswordTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          newPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            (request, value) => {
              request.newPassword = value;
            },
            (value) => this.checkNewPassword(value)
          )
        ).body,
        assign(
          newPasswordRepeatInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.repeatNewPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            () => {},
            (value) => this.checkNewPasswordRepeat(value)
          )
        ).body,
        assign(
          currentPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            (request, value) => {
              request.currentPassword = value;
            },
            (value) => this.checkCurrentPassword(value)
          )
        ).body,
      ],
      [
        newPasswordInputRef.val,
        newPasswordRepeatInputRef.val,
        currentPasswordInputRef.val,
      ],
      (request) => this.updatePassword(request),
      (response, error) => this.postUpdatePassword(error),
      {}
    );
    this.newPasswordInput_ = newPasswordInputRef.val;
    this.newPasswordRepeatInput_ = newPasswordRepeatInputRef.val;
    this.currentPasswordInput_ = currentPasswordInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private checkNewPassword(value: string): ValidationResult {
    this.newPassword = value;
    if (value.length > PASSWORD_LENGTH_LIMIT) {
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
    requset: UpdatePasswordRequestBody
  ): Promise<UpdatePasswordResponse> {
    return updatePassword(this.userServiceClient, requset);
  }

  private postUpdatePassword(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage_.body;
  }
  public get menuBody() {
    return this.backMenuItem_.body;
  }

  public remove(): void {
    this.inputFormPage_.remove();
    this.backMenuItem_.remove();
  }

  // Visible for testing
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get newPasswordInput() {
    return this.newPasswordInput_;
  }
  public get newPasswordRepeatInput() {
    return this.newPasswordRepeatInput_;
  }
  public get currentPasswordInput() {
    return this.currentPasswordInput_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}
