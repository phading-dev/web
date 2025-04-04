import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { TextAreaInputWithErrorMsg } from "../../../../common/input_form_page/text_area_input";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NATURAL_NAME_LENGTH,
} from "@phading/constants/account";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { newUpdateAccountRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdateAccountRequestBody,
  UpdateAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateAccountInfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateAccountInfoPage extends EventEmitter {
  public static create(account: AccountAndUser): UpdateAccountInfoPage {
    return new UpdateAccountInfoPage(SERVICE_CLIENT, account);
  }

  public naturalNameInput = new Ref<
    TextInputWithErrorMsg<UpdateAccountRequestBody>
  >();
  public emailInput = new Ref<
    TextInputWithErrorMsg<UpdateAccountRequestBody>
  >();
  public descriptionInput = new Ref<
    TextAreaInputWithErrorMsg<UpdateAccountRequestBody>
  >();
  public inputFormPage: InputFormPage<
    UpdateAccountRequestBody,
    UpdateAccountResponse
  >;

  public constructor(
    private serviceClient: WebServiceClient,
    account: AccountAndUser,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.updateAccountInfo,
      [
        assign(
          this.naturalNameInput,
          TextInputWithErrorMsg.create(
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
            (value) => this.checkNaturalNameInput(value),
          ),
        ).body,
        assign(
          this.emailInput,
          TextInputWithErrorMsg.create(
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
            (value) => this.checkEmailInput(value),
          ),
        ).body,
        assign(
          this.descriptionInput,
          TextAreaInputWithErrorMsg.create(
            LOCALIZED_TEXT.accountDescriptionLabel,
            "",
            {},
            account.description ?? "",
            (request, value) => {
              request.description = value;
            },
            (value) => this.checkDescriptionInput(value),
          ),
        ).body,
      ],
      [
        this.naturalNameInput.val,
        this.emailInput.val,
        this.descriptionInput.val,
      ],
      LOCALIZED_TEXT.updateButtonLabel,
      (request) => this.updateAccountInfo(request),
      (response, error) => this.postUpdateAccountInfo(error),
      {},
    ).addBackButton();

    this.inputFormPage.on("submitError", () => this.emit("updateError"));
    this.inputFormPage.on("submitted", () => this.emit("updated"));
    this.inputFormPage.on("back", () => this.emit("back"));
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > MAX_NATURAL_NAME_LENGTH) {
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
    if (value.length > MAX_EMAIL_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.contactEmailTooLongError,
      };
    } else {
      return { valid: true };
    }
  }

  private checkDescriptionInput(value: string): ValidationResult {
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.accountDescrptionTooLongError,
      };
    } else {
      return { valid: true };
    }
  }

  private updateAccountInfo(
    request: UpdateAccountRequestBody,
  ): Promise<UpdateAccountResponse> {
    return this.serviceClient.send(newUpdateAccountRequest(request));
  }

  private postUpdateAccountInfo(error?: Error): string {
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
