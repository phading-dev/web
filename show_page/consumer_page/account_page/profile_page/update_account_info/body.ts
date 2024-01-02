import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { TextAreaInputWithErrorMsg } from "../../../../../common/input_form_page/text_area_input";
import {
  ValidationResult,
  VerticalTextInputWithErrorMsg,
} from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import {
  CONTACT_EMAIL_LENGTH_LIMIT,
  DESCRIPTION_LENGTH_LIMIT,
  NATURAL_NAME_LENGTH_LIMIT,
} from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { Account } from "@phading/user_service_interface/self/web/account";
import { updateAccount } from "@phading/user_service_interface/self/web/client_requests";
import {
  UpdateAccountRequestBody,
  UpdateAccountResponse,
} from "@phading/user_service_interface/self/web/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateAccountInfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateAccountInfoPage extends EventEmitter {
  public static create(account: Account): UpdateAccountInfoPage {
    return new UpdateAccountInfoPage(USER_SERVICE_CLIENT, account);
  }

  private backMenuItem_: MenuItem;
  private naturalNameInput_: VerticalTextInputWithErrorMsg<UpdateAccountRequestBody>;
  private emailInput_: VerticalTextInputWithErrorMsg<UpdateAccountRequestBody>;
  private descriptionInput_: TextAreaInputWithErrorMsg<UpdateAccountRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdateAccountRequestBody,
    UpdateAccountResponse
  >;

  public constructor(
    private userServiceClient: WebServiceClient,
    account: Account
  ) {
    super();
    let naturalNameInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateAccountRequestBody>
    >();
    let emailInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateAccountRequestBody>
    >();
    let descriptionInputRef = new Ref<
      TextAreaInputWithErrorMsg<UpdateAccountRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateAccountInfo,
      [
        assign(
          naturalNameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
              value: account.naturalName ?? "",
            },
            (request, value) => {
              request.naturalName = value;
            },
            (value) => this.checkNaturalNameInput(value)
          )
        ).body,
        assign(
          emailInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.contactEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
              value: account.contactEmail ?? "",
            },
            (request, value) => {
              request.contactEmail = value;
            },
            (value) => this.checkEmailInput(value)
          )
        ).body,
        assign(
          descriptionInputRef,
          TextAreaInputWithErrorMsg.create(
            LOCALIZED_TEXT.accountDescriptionLabel,
            "",
            {},
            account.description ?? "",
            (request, value) => {
              request.description = value;
            },
            (value) => this.checkDescriptionInput(value)
          )
        ).body,
      ],
      [naturalNameInputRef.val, emailInputRef.val, descriptionInputRef.val],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updateAccountInfo(request),
      (response, error) => this.postUpdateAccountInfo(error),
      {}
    );
    this.naturalNameInput_ = naturalNameInputRef.val;
    this.emailInput_ = emailInputRef.val;
    this.descriptionInput_ = descriptionInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > NATURAL_NAME_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.naturalNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private checkEmailInput(value: string): ValidationResult {
    if (value.length > CONTACT_EMAIL_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.contactEmailTooLongError,
      };
    } else {
      return { valid: true };
    }
  }

  private checkDescriptionInput(value: string): ValidationResult {
    if (value.length > DESCRIPTION_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.accountDescrptionTooLongError,
      };
    } else {
      return { valid: true };
    }
  }

  private updateAccountInfo(
    request: UpdateAccountRequestBody
  ): Promise<UpdateAccountResponse> {
    return updateAccount(this.userServiceClient, request);
  }

  private postUpdateAccountInfo(error?: Error): string {
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
  public get naturalNameInput() {
    return this.naturalNameInput_;
  }
  public get emailInput() {
    return this.emailInput_;
  }
  public get descriptionInput() {
    return this.descriptionInput_;
  }
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}
