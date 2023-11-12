import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import {
  ValidationResult,
  VerticalTextInputWithErrorMsg,
} from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { CONTACT_EMAIL_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { updateContactEmail } from "@phading/user_service_interface/client_requests";
import {
  UpdateContactEmailRequestBody,
  UpdateContactEmailResponse,
} from "@phading/user_service_interface/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";

export interface UpdateContactEmailPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateContactEmailPage extends EventEmitter {
  public static create(): UpdateContactEmailPage {
    return new UpdateContactEmailPage(USER_SERVICE_CLIENT);
  }

  private backMenuItem_: MenuItem;
  private emailInput_: VerticalTextInputWithErrorMsg<UpdateContactEmailRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdateContactEmailRequestBody,
    UpdateContactEmailResponse
  >;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let emailInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateContactEmailRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateContactEmailTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          emailInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newContactEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
            },
            (request, value) => {
              request.contactEmail = value;
            },
            (value) => this.checkEmailInput(value)
          )
        ).body,
      ],
      [emailInputRef.val],
      (request) => this.updateContactEmail(request),
      (response, error) => this.postUpdateContactEmail(error),
      {}
    );
    this.emailInput_ = emailInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private checkEmailInput(value: string): ValidationResult {
    if (value.length > CONTACT_EMAIL_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newContactEmailTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private updateContactEmail(
    request: UpdateContactEmailRequestBody
  ): Promise<UpdateContactEmailResponse> {
    return updateContactEmail(this.userServiceClient, request);
  }

  private postUpdateContactEmail(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailureLabel;
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
  public get emailInput() {
    return this.emailInput_;
  }
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}
