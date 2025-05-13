import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import { RadioOptionInput } from "../../../common/input_form_page/option_input";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill } from "../../../common/option_pills";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { MAX_NATURAL_NAME_LENGTH } from "@phading/constants/account";
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
  on(event: "chosen", listener: () => void): this;
}

export class CreateAccountPage extends EventEmitter {
  public static create(): CreateAccountPage {
    return new CreateAccountPage(LOCAL_SESSION_STORAGE, SERVICE_CLIENT);
  }

  public naturalNameInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeInput = new Ref<RadioOptionInput<AccountType>>();
  public inputFormPage: InputFormPage<CreateAccountResponse>;
  private request: CreateAccountRequestBody = {};

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
            (value) => this.validateOrTakeNaturalNameInput(value),
          ),
        ).body,
        assign(
          this.accountTypeInput,
          RadioOptionInput.create(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              assign(
                this.consumerOption,
                OptionPill.create(
                  LOCALIZED_TEXT.userTypeConsumerLabel,
                  AccountType.CONSUMER,
                ),
              ),
              assign(
                this.publisherOption,
                OptionPill.create(
                  LOCALIZED_TEXT.userTypePublisherLabel,
                  AccountType.PUBLISHER,
                  "",
                ),
              ),
            ],
            AccountType.CONSUMER,
            (value) => {
              this.request.accountType = value;
            },
          ),
        ).body,
      ],
      [this.naturalNameInput.val],
      LOCALIZED_TEXT.createAccountButtonLabel,
    ).addBackButton();

    this.inputFormPage.addPrimaryAction(
      () => this.createAccount(),
      (response, error) => this.postCreateAccount(response, error),
    );
    this.inputFormPage.on("handlePrimarySuccess", () => this.emit("chosen"));
    this.inputFormPage.on("back", () => this.emit("back"));
  }

  private validateOrTakeNaturalNameInput(value: string): ValidationResult {
    if (value.length > MAX_NATURAL_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.naturalNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      this.request.naturalName = value;
      return { valid: true };
    }
  }

  private createAccount(): Promise<CreateAccountResponse> {
    return this.serviceClient.send(newCreateAccountRequest(this.request));
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
