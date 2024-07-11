import EventEmitter = require("events");
import { InputFormPage } from "../../common/input_form_page/body";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { NATURAL_NAME_LENGTH_LIMIT } from "../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../common/web_service_client";
import { AccountType } from "@phading/user_service_interface/account_type";
import { createAccount } from "@phading/user_service_interface/self/frontend/client_requests";
import {
  CreateAccountRequestBody,
  CreateAccountResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface CreateAccountPage {
  on(event: "back", listener: () => void): this;
  on(event: "created", listener: () => void): this;
  on(event: "createError", listener: () => void): this;
}

export class CreateAccountPage extends EventEmitter {
  public static create(accountType: AccountType): CreateAccountPage {
    return new CreateAccountPage(
      LOCAL_SESSION_STORAGE,
      USER_SERVICE_CLIENT,
      accountType,
    );
  }

  public naturalNameInput = new Ref<
    TextInputWithErrorMsg<CreateAccountRequestBody>
  >();
  public inputFormPage: InputFormPage<
    CreateAccountRequestBody,
    CreateAccountResponse
  >;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient,
    private accountType: AccountType,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      this.getCreateAccountTitle(),
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
      ],
      [this.naturalNameInput.val],
      LOCALIZED_TEXT.createAccountButtonLabel,
      (request) => this.createAccount(request),
      (response, error) => this.postCreateAccount(response, error),
      {
        accountType,
      },
    ).addSecondaryNonblockingButton(LOCALIZED_TEXT.cancelButtonLabel, () =>
      this.emit("back"),
    );

    this.inputFormPage.on("submitError", () => this.emit("createError"));
    this.inputFormPage.on("submitted", () => this.emit("created"));
  }

  private getCreateAccountTitle(): string {
    switch (this.accountType) {
      case AccountType.CONSUMER:
        return LOCALIZED_TEXT.createConsumerTitle;
      case AccountType.PUBLISHER:
        return LOCALIZED_TEXT.createPublisherTitle;
      default:
        throw new Error("Unsupported account type for getCreateAccountTitle.");
    }
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
    return createAccount(this.webServiceClient, requset);
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
