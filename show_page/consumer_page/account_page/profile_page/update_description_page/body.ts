import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import {
  TextAreaInputWithErrorMsg,
  ValidationResult,
} from "../../../../../common/input_form_page/text_area_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { DESCRIPTION_LENGTH_LIMIT } from "../../../../../common/user_limits";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { updateDescription } from "@phading/user_service_interface/client_requests";
import {
  UpdateDescriptionRequestBody,
  UpdateDescriptionResponse,
} from "@phading/user_service_interface/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateDescriptionPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
}

export class UpdateDescriptionPage extends EventEmitter {
  public static create(): UpdateDescriptionPage {
    return new UpdateDescriptionPage(USER_SERVICE_CLIENT);
  }

  private backMenuItem: MenuItem;
  private descriptionInput_: TextAreaInputWithErrorMsg<UpdateDescriptionRequestBody>;
  private inputFormPage_: InputFormPage<
    UpdateDescriptionRequestBody,
    UpdateDescriptionResponse
  >;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let descriptionInputRef = new Ref<
      TextAreaInputWithErrorMsg<UpdateDescriptionRequestBody>
    >();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.updateDescriptionTitle,
      LOCALIZED_TEXT.updateButtonLabel,
      [
        assign(
          descriptionInputRef,
          TextAreaInputWithErrorMsg.create(
            LOCALIZED_TEXT.newDescriptionLabel,
            "",
            {},
            (request, value) => {
              request.description = value;
            },
            (value) => this.checkDescriptionInput(value)
          )
        ).body,
      ],
      [descriptionInputRef.val],
      (request) => this.updateDescription(request),
      (response, error) => this.postUpdateDescription(error),
      {}
    );
    this.descriptionInput_ = descriptionInputRef.val;

    this.backMenuItem = createBackMenuItem();

    this.inputFormPage_.on("submitError", () => this.emit("updateError"));
    this.inputFormPage_.on("submitted", () => this.emit("updated"));
    this.backMenuItem.on("action", () => this.emit("back"));
  }

  private checkDescriptionInput(value: string): ValidationResult {
    if (value.length > DESCRIPTION_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newDescrptionTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private updateDescription(
    requset: UpdateDescriptionRequestBody
  ): Promise<UpdateDescriptionResponse> {
    return updateDescription(this.userServiceClient, requset);
  }

  private postUpdateDescription(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailureLabel;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage_.body;
  }
  public get menuBody() {
    return this.backMenuItem.body;
  }

  public remove(): void {
    this.inputFormPage_.remove();
    this.backMenuItem.remove();
  }

  // Visible for testing
  public get inputFormPage() {
    return this.inputFormPage_;
  }
  public get descriptionInput() {
    return this.descriptionInput_;
  }
}
