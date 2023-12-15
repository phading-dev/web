import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { VerticalTextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { RECOVERY_EMAIL_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateRecoveryEmail } from "@phading/user_service_interface/client_requests";
import {
  UpdateRecoveryEmailRequestBody,
  UpdateRecoveryEmailResponse,
} from "@phading/user_service_interface/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateRecoveryEmailPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateRecoveryEmailPage extends EventEmitter {
  public static create(): UpdateRecoveryEmailPage {
    return new UpdateRecoveryEmailPage(USER_SERVICE_CLIENT);
  }

  private backMenuItem_: MenuItem;
  private newRecoveryEmailInput_: VerticalTextInputWithErrorMsg<UpdateRecoveryEmailRequestBody>;
  private currentPasswordInput_: VerticalTextInputWithErrorMsg<UpdateRecoveryEmailResponse>;
  private inputFormPage_: InputFormPage<
    UpdateRecoveryEmailRequestBody,
    UpdateRecoveryEmailResponse
  >;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let newRecoveryEmailInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateRecoveryEmailRequestBody>
    >();
    let currentPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateRecoveryEmailRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateRecoveryEmailTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          newRecoveryEmailInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newRecoveryEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
            },
            (request, value) => {
              request.newEmail = value;
            },
            (value) => this.checkNewEmail(value)
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
      [newRecoveryEmailInputRef.val, currentPasswordInputRef.val],
      (request) => this.updateRecoveryEmail(request),
      (response, error) => this.postUpdateRecoveryEmail(error),
      {}
    );
    this.newRecoveryEmailInput_ = newRecoveryEmailInputRef.val;
    this.currentPasswordInput_ = currentPasswordInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private checkNewEmail(value: string): ValidationResult {
    if (value.length > RECOVERY_EMAIL_LENGTH_LIMIT) {
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

  private checkCurrentPassword(value: string): ValidationResult {
    if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private updateRecoveryEmail(
    requset: UpdateRecoveryEmailRequestBody
  ): Promise<UpdateRecoveryEmailResponse> {
    return updateRecoveryEmail(this.userServiceClient, requset);
  }

  private postUpdateRecoveryEmail(error?: Error): string {
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
  public get newRecoveryEmailInput() {
    return this.newRecoveryEmailInput_;
  }
  public get currentPasswordInput() {
    return this.currentPasswordInput_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}
