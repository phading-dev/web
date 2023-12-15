import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import {
  ValidationResult,
  VerticalTextInputWithErrorMsg,
} from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { NATURAL_NAME_LENGTH_LIMIT } from "../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../common/web_service_client";
import { AccountType } from "@phading/user_service_interface/account_type";
import { createAccount } from "@phading/user_service_interface/client_requests";
import {
  CreateAccountRequestBody,
  CreateAccountResponse,
} from "@phading/user_service_interface/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ConsumerCreationPage {
  on(event: "created", listener: (signedSession: string) => void): this;
  on(event: "createError", listener: () => void): this;
}

export class ConsumerCreationPage extends EventEmitter {
  public static create(): ConsumerCreationPage {
    return new ConsumerCreationPage(USER_SERVICE_CLIENT);
  }

  private nameInput_: VerticalTextInputWithErrorMsg<CreateAccountRequestBody>;
  private inputFormPage_: InputFormPage<
    CreateAccountRequestBody,
    CreateAccountResponse
  >;
  private signedSession: string;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let nameInputRef = new Ref<
      VerticalTextInputWithErrorMsg<CreateAccountRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.createConsumerTitle,
      LOCALIZED_TEXT.createConsumerButtonLabel,
      [
        assign(
          nameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            ``,
            {
              type: "text",
              autocomplete: "name",
            },
            (request, value) => {
              request.naturalName = value;
            },
            (value) => this.checkNaturalNameInput(value)
          )
        ).body,
      ],
      [nameInputRef.val],
      (request) => this.createConsumer(request),
      (response, error) => this.postCreateConsumer(response, error),
      {}
    );
    this.nameInput_ = nameInputRef.val;

    this.inputFormPage_.on("submitError", () => this.emit("createError"));
    this.inputFormPage_.on("submitted", () =>
      this.emit("created", this.signedSession)
    );
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > NATURAL_NAME_LENGTH_LIMIT) {
      return { valid: false, errorMsg: LOCALIZED_TEXT.naturalNameTooLongError };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private async createConsumer(
    request: CreateAccountRequestBody
  ): Promise<CreateAccountResponse> {
    request.accountType = AccountType.CONSUMER;
    return await createAccount(this.userServiceClient, request);
  }

  private postCreateConsumer(
    response: CreateAccountResponse,
    error?: Error
  ): string {
    if (error) {
      return LOCALIZED_TEXT.createConsumerError;
    } else {
      this.signedSession = response.signedSession;
      return "";
    }
  }

  public get body() {
    return this.inputFormPage_.body;
  }

  public remove(): void {
    this.inputFormPage_.remove();
  }

  // Visible for testing
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get nameInput() {
    return this.nameInput_;
  }
}
