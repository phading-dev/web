import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { MandatoryCheckboxInput } from "../../../common/input_form_page/mandatory_checkbox_input";
import { RadioOptionInput } from "../../../common/input_form_page/option_input";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill } from "../../../common/option_buttons";
import { eFormTitle } from "../../../common/page_elements";
import { FONT_M, GAP_2X, GAP_0_5X, LINE_HEIGHT_M } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { MAX_NAME_LENGTH } from "@phading/constants/account";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newCreateAccountRequest } from "@phading/user_service_interface/web/self/client";
import {
  CreateAccountRequestBody,
  CreateAccountResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
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

  public accountNameInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeInput = new Ref<RadioOptionInput<AccountType>>();
  private acceptTerms = new Ref<HTMLDivElement>();
  public acceptPublisherTermsCheckbox = new Ref<MandatoryCheckboxInput>();
  public inputFormPage: InputFormPage<CreateAccountResponse>;
  private request: CreateAccountRequestBody = {};

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.inputFormPage = new InputFormPage<CreateAccountResponse>()
      .addLines(
        eFormTitle(LOCALIZED_TEXT.createAccountTitle),
        assign(
          this.accountNameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.accountNameLabel,
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
          new RadioOptionInput(
            LOCALIZED_TEXT.chooseAccountTypeLabel,
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
                ),
              ),
            ],
            (value) => this.changeAccountType(value),
          ),
        ).body,
        E.divRef(
          this.acceptTerms,
          {
            class: "create-account-terms",
          },
          assign(
            this.acceptPublisherTermsCheckbox,
            new MandatoryCheckboxInput("", LOCALIZED_TEXT.acceptTerms),
          ).body,
          E.div(
            {},
            E.div(
              {
                style: `display: inline; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; margin: 0 ${GAP_0_5X}rem 0 ${GAP_2X}rem;`,
              },
              E.text("•"),
            ),
            E.a(
              {
                class: "create-account-publisher-agreement-link",
                href: "/publisher",
                target: "_blank",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.publisherAgreement),
            ),
          ),
        ),
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.createAccountButtonLabel,
        () => this.createAccount(),
        (error, response) => this.postCreateAccount(error, response),
      )
      .addBackButton()
      .addInputs(this.accountNameInput.val)
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("chosen"));
    this.accountTypeInput.val.setValue(AccountType.CONSUMER);
  }

  private validateOrTakeNaturalNameInput(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.accountNameTooLongError,
      };
    } else {
      this.request.name = value;
      return { valid: true };
    }
  }

  private changeAccountType(value: AccountType): void {
    this.request.accountType = value;
    if (value === AccountType.CONSUMER) {
      this.acceptTerms.val.style.display = "none";
      this.inputFormPage.removeInputs(this.acceptPublisherTermsCheckbox.val);
    } else {
      this.acceptTerms.val.style.display = "block";
      this.inputFormPage.addInputs(this.acceptPublisherTermsCheckbox.val);
    }
  }

  private createAccount(): Promise<CreateAccountResponse> {
    return this.serviceClient.send(newCreateAccountRequest(this.request));
  }

  private postCreateAccount(
    error?: Error,
    response?: CreateAccountResponse,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.createAccountError;
    } else {
      this.emit("choose", response.signedSession);
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
