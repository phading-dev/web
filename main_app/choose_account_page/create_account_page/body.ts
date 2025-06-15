import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { RadioOptionInput } from "../../../common/input_form_page/option_input";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill } from "../../../common/option_pills";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  MAX_EMAIL_LENGTH,
  MAX_NATURAL_NAME_LENGTH,
} from "@phading/constants/account";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newCreateAccountRequest } from "@phading/user_service_interface/web/self/client";
import {
  CreateAccountRequestBody,
  CreateAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreateAccountPage {
  on(event: "back", listener: () => void): this;
  on(event: "choose", listener: (signedSession: string) => void): this;
  on(event: "chosen", listener: () => void): this;
}

export class CreateAccountPage extends EventEmitter {
  public static create(): CreateAccountPage {
    return new CreateAccountPage(SERVICE_CLIENT);
  }

  public naturalNameInput = new Ref<TextInputWithErrorMsg>();
  public emailInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeInput = new Ref<RadioOptionInput<AccountType>>();
  public inputFormPage: InputFormPage<CreateAccountResponse>;
  private request: CreateAccountRequestBody = {};

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.inputFormPage = new InputFormPage<CreateAccountResponse>(
      LOCALIZED_TEXT.createAccountTitle,
      [
        assign(
          this.naturalNameInput,
          new TextInputWithErrorMsg(
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
          this.emailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.contactEmailLabel,
            "",
            {
              type: "email",
              autocomplete: "email",
            },
            (value) => this.validateOrTakeEmailInput(value),
          ),
        ).body,
        assign(
          this.accountTypeInput,
          new RadioOptionInput(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              assign(
                this.consumerOption,
                new OptionPill(
                  LOCALIZED_TEXT.userTypeConsumerLabel,
                  AccountType.CONSUMER,
                ),
              ),
              assign(
                this.publisherOption,
                new OptionPill(
                  LOCALIZED_TEXT.userTypePublisherLabel,
                  AccountType.PUBLISHER,
                  "",
                ),
              ),
            ],
            (value) => {
              this.request.accountType = value;
            },
          ),
        ).body,
      ],
      [this.naturalNameInput.val, this.emailInput.val],
      LOCALIZED_TEXT.createAccountButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.createAccount(),
        (response, error) => this.postCreateAccount(response, error),
      )
      .on("handlePrimarySuccess", (response) =>
        this.emit("choose", response.signedSession),
      )
      .on("primaryDone", () => this.emit("chosen"));
    this.naturalNameInput.val.validate();
    this.emailInput.val.validate();
    this.accountTypeInput.val.setValue(AccountType.CONSUMER);
  }

  private validateOrTakeNaturalNameInput(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_NATURAL_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.naturalNameTooLongError,
      };
    } else {
      this.request.naturalName = value;
      return { valid: true };
    }
  }

  private validateOrTakeEmailInput(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_EMAIL_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.emailTooLongError,
      };
    } else {
      this.request.contactEmail = value;
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
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
