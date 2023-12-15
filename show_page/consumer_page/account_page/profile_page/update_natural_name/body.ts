import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import {
  ValidationResult,
  VerticalTextInputWithErrorMsg,
} from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { NATURAL_NAME_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateNaturalName } from "@phading/user_service_interface/client_requests";
import {
  UpdateNaturalNameRequestBody,
  UpdateNaturalNameResponse,
} from "@phading/user_service_interface/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateNaturalNamePage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateNaturalNamePage extends EventEmitter {
  public static create(): UpdateNaturalNamePage {
    return new UpdateNaturalNamePage(USER_SERVICE_CLIENT);
  }

  private backMenuItem_: MenuItem;
  private naturalNameInput_: VerticalTextInputWithErrorMsg<UpdateNaturalNameRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdateNaturalNameRequestBody,
    UpdateNaturalNameResponse
  >;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let naturalNameInputRef = new Ref<
      VerticalTextInputWithErrorMsg<UpdateNaturalNameRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateNaturalNameTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          naturalNameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newNaturalNameLabel,
            "",
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
      [naturalNameInputRef.val],
      (request) => this.updateNaturalName(request),
      (response, error) => this.postUpdateNaturalName(error),
      {}
    );
    this.naturalNameInput_ = naturalNameInputRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem_.on("action", () => this.emit("back"));
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > NATURAL_NAME_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newNaturalNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private updateNaturalName(
    request: UpdateNaturalNameRequestBody
  ): Promise<UpdateNaturalNameResponse> {
    return updateNaturalName(this.userServiceClient, request);
  }

  private postUpdateNaturalName(error?: Error): string {
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
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get backMenuItem() {
    return this.backMenuItem_;
  }
}
