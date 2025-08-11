import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextAreaInputWithErrorMsg } from "../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eCenteredTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
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
}

export class UpdateAccountInfoPage extends EventEmitter {
  public static create(account: AccountAndUser): UpdateAccountInfoPage {
    return new UpdateAccountInfoPage(SERVICE_CLIENT, account);
  }

  public accountNameInput = new Ref<TextInputWithErrorMsg>();
  public descriptionInput = new Ref<TextAreaInputWithErrorMsg>();
  public inputFormPage: InputFormPage<UpdateAccountResponse>;
  private request: UpdateAccountRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    account: AccountAndUser,
  ) {
    super();
    this.inputFormPage = new InputFormPage({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.updateAccountInfoTitle),
        assign(
          this.accountNameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.accountNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
              value: account.name ?? "",
            },
            (value) => this.validateOrTakeAccountNameInput(value),
          ),
        ).body,
        assign(
          this.descriptionInput,
          new TextAreaInputWithErrorMsg(
            LOCALIZED_TEXT.accountDescriptionLabel,
            "",
            {},
            account.description ?? "",
            (value) => this.validateOrTakeDescriptionInput(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.updateButtonLabel,
        () => this.updateAccountInfo(),
        (error) => this.postUpdateAccountInfo(error),
      )
      .addBackButton()
      .addInputs(this.accountNameInput.val, this.descriptionInput.val)
      .on("primaryDone", () => this.emit("updated"))
      .on("back", () => this.emit("back"));
  }

  private validateOrTakeAccountNameInput(value: string): ValidationResult {
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

  private validateOrTakeDescriptionInput(value: string): ValidationResult {
    value = value.trim();
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.accountDescriptionTooLongError,
      };
    } else {
      this.request.description = value;
      return { valid: true };
    }
  }

  private updateAccountInfo(): Promise<UpdateAccountResponse> {
    return this.serviceClient.send(newUpdateAccountRequest(this.request));
  }

  private postUpdateAccountInfo(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else {
      this.emit("back");
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
