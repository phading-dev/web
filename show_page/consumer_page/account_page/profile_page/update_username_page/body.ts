import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { USERNAME_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateUsername } from "@phading/user_service_interface/self/frontend/client_requests";
import {
  UpdateUsernameRequestBody,
  UpdateUsernameResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateUsernamePage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateUsernamePage extends EventEmitter {
  public static create(): UpdateUsernamePage {
    return new UpdateUsernamePage(USER_SERVICE_CLIENT);
  }

  public inputFormPage: InputFormPage<
    UpdateUsernameRequestBody,
    UpdateUsernameResponse
  >;
  public newUsernameInput = new Ref<
    TextInputWithErrorMsg<UpdateUsernameRequestBody>
  >();
  public currentPasswordInput = new Ref<
    TextInputWithErrorMsg<UpdateUsernameRequestBody>
  >();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.updateUsernameTitle,
      [
        assign(
          this.newUsernameInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newUsernameLabel,
            "",
            {
              type: "text",
              autocomplete: "username",
            },
            (request, value) => {
              request.newUsername = value;
            },
            (value) => this.checkNewUsername(value),
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
      [this.newUsernameInput.val, this.currentPasswordInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updateUsername(request),
      (response, error) => this.postUpdateUsername(response, error),
      {},
    ).addBackButton();

    this.inputFormPage.on("submitError", () => this.emit("updateError"));
    this.inputFormPage.on("submitted", () => this.emit("updated"));
    this.inputFormPage.on("back", () => this.emit("back"));
  }

  private checkNewUsername(value: string): ValidationResult {
    if (value.length > USERNAME_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.usernameTooLongError,
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

  private updateUsername(
    requset: UpdateUsernameRequestBody,
  ): Promise<UpdateUsernameResponse> {
    return updateUsername(this.userServiceClient, requset);
  }

  private postUpdateUsername(
    response: UpdateUsernameResponse,
    error?: Error,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else if (response.usernameIsNotAvailable) {
      return LOCALIZED_TEXT.usernameIsUsedError;
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
