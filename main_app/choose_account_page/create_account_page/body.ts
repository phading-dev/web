import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import {
  OptionButton,
  OptionInput,
} from "../../../common/input_form_page/option_input";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { NATURAL_NAME_LENGTH_LIMIT } from "../../../common/user_limits";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newCreateAccountRequest } from "@phading/user_service_interface/web/self/client";
import {
  CreateAccountRequestBody,
  CreateAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface CreateAccountPage {
  on(event: "back", listener: () => void): this;
  on(event: "created", listener: () => void): this;
  on(event: "createError", listener: () => void): this;
}

export class CreateAccountPage extends EventEmitter {
  public static create(): CreateAccountPage {
    return new CreateAccountPage(LOCAL_SESSION_STORAGE, SERVICE_CLIENT);
  }

  public naturalNameInput = new Ref<
    TextInputWithErrorMsg<CreateAccountRequestBody>
  >();
  public accountTypeInput = new Ref<
    OptionInput<AccountType, CreateAccountRequestBody>
  >();
  public inputFormPage: InputFormPage<
    CreateAccountRequestBody,
    CreateAccountResponse
  >;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.createAccountTitle,
      [
        assign(
          this.naturalNameInput,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
            },
            (request, value) => {
              request.naturalName = value;
            },
            (value) => this.checkNaturalNameInput(value),
          ),
        ).body,
        assign(
          this.accountTypeInput,
          OptionInput.create(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              OptionButton.create(
                LOCALIZED_TEXT.userTypeConsumerLabel,
                AccountType.CONSUMER,
                "",
              ),
              OptionButton.create(
                LOCALIZED_TEXT.userTypePublisherLabel,
                AccountType.PUBLISHER,
                "",
              ),
            ],
            AccountType.CONSUMER,
            (request, value) => {
              request.accountType = value;
            },
          ),
        ).body,
      ],
      [this.naturalNameInput.val, this.accountTypeInput.val],
      LOCALIZED_TEXT.createAccountButtonLabel,
      (request) => this.createAccount(request),
      (response, error) => this.postCreateAccount(response, error),
      {},
    ).addBackButton();

    this.inputFormPage.on("submitError", () => this.emit("createError"));
    this.inputFormPage.on("submitted", () => this.emit("created"));
    this.inputFormPage.on("back", () => this.emit("back"));
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

  private createAccount(
    requset: CreateAccountRequestBody,
  ): Promise<CreateAccountResponse> {
    return this.serviceClient.send(newCreateAccountRequest(requset));
  }

  private postCreateAccount(
    response: CreateAccountResponse,
    error?: Error,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.createAccountError;
    } else {
      this.localSessionStorage.save(response.signedSession);
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
