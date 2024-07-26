import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { RECOVERY_EMAIL_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateRecoveryEmail } from "@phading/user_service_interface/self/frontend/client_requests";
import {
  UpdateRecoveryEmailRequestBody,
  UpdateRecoveryEmailResponse,
} from "@phading/user_service_interface/self/frontend/interface";
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
  public inputFormPage: InputFormPage<
    UpdateRecoveryEmailRequestBody,
    UpdateRecoveryEmailResponse
  >;
  public newRecoveryEmailInput = new Ref<
    TextInputWithErrorMsg<UpdateRecoveryEmailRequestBody>
  >();
  public currentPasswordInput = new Ref<
    TextInputWithErrorMsg<UpdateRecoveryEmailRequestBody>
  >();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.updateRecoveryEmailTitle,
      [
        assign(
          this.newRecoveryEmailInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newRecoveryEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
            },
            (request, value) => {
              request.newEmail = value;
            },
            (value) => this.checkNewEmail(value),
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
      [this.newRecoveryEmailInput.val, this.currentPasswordInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updateRecoveryEmail(request),
      (response, error) => this.postUpdateRecoveryEmail(error),
      {},
    ).addBackButton();

    this.inputFormPage.on("submitError", () => this.emit("updateError"));
    this.inputFormPage.on("submitted", () => this.emit("updated"));
    this.inputFormPage.on("back", () => this.emit("back"));
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
    requset: UpdateRecoveryEmailRequestBody,
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
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
