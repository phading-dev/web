import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { VerticalTextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { USERNAME_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateUsername } from "@phading/user_service_interface/client_requests";
import {
  UpdateUsernameRequestBody,
  UpdateUsernameResponse,
} from "@phading/user_service_interface/interface";
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

  private backMenuItem_: MenuItem;
  private newUsernameInput_: VerticalTextInputWithErrorMsg<UpdateUsernameRequestBody>;
  private currentPasswordInput_: VerticalTextInputWithErrorMsg<UpdateUsernameRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdateUsernameRequestBody,
    UpdateUsernameResponse
  >;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let newUsernameInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateUsernameRequestBody>
    >();
    let currentPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateUsernameRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateUsernameTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          newUsernameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newUsernameLabel,
            "",
            {
              type: "text",
              autocomplete: "username",
            },
            (request, value) => {
              request.newUsername = value;
            },
            (value) => this.checkNewUsername(value)
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
      [newUsernameInputRef.val, currentPasswordInputRef.val],
      (request) => this.updateUsername(request),
      (response, error) => this.postUpdateUsername(response, error),
      {}
    );
    this.newUsernameInput_ = newUsernameInputRef.val;
    this.currentPasswordInput_ = currentPasswordInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
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
    requset: UpdateUsernameRequestBody
  ): Promise<UpdateUsernameResponse> {
    return updateUsername(this.userServiceClient, requset);
  }

  private postUpdateUsername(
    response: UpdateUsernameResponse,
    error?: Error
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailureLabel;
    } else if (response.usernameIsNotAvailable) {
      return LOCALIZED_TEXT.usernameIsUsedError;
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
  public get newUsernameInput() {
    return this.newUsernameInput_;
  }
  public get currentPasswordInput() {
    return this.currentPasswordInput_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}