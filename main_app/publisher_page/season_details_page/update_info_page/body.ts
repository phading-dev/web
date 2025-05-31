import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_with_error_msg";
import { TextAreaInputWithErrorMsg } from "../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  MAX_EPISODE_NAME_LENGTH,
  MAX_SEASON_DESCRIPTION_LENGTH,
} from "@phading/constants/show";
import { newUpdateSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  UpdateSeasonRequestBody,
  UpdateSeasonResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateInfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateInfoPage extends EventEmitter {
  public inputFormPage: InputFormPage<UpdateSeasonResponse>;
  public nameInput = new Ref<TextInputWithErrorMsg>();
  public descriptionInput = new Ref<TextAreaInputWithErrorMsg>();
  private request: UpdateSeasonRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    seasonId: string,
    season: SeasonDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.inputFormPage = new InputFormPage<UpdateSeasonResponse>(
      LOCALIZED_TEXT.updateSeasonInfoTitle,
      [
        assign(
          this.nameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.seasonNameLabel,
            "",
            {
              type: "text",
              value: season.name,
            },
            (value) => this.validateNameAndTake(value),
          ),
        ).body,
        assign(
          this.descriptionInput,
          new TextAreaInputWithErrorMsg(
            LOCALIZED_TEXT.seasonDescriptionLabel,
            "",
            {},
            season.description ?? "",
            (value) => this.validateDescriptionAndTake(value),
          ),
        ).body,
      ],
      [this.nameInput.val, this.descriptionInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.update(),
        (response, error) => this.postUpdate(response, error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"));
    this.nameInput.val.validate();
    this.descriptionInput.val.validate();
  }

  private validateNameAndTake(value: string): ValidationResult {
    value = value.trim();
    if (value.length === 0) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_EPISODE_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.seasonNameTooLongError,
      };
    } else {
      this.request.name = value;
      return {
        valid: true,
      };
    }
  }

  private validateDescriptionAndTake(value: string): ValidationResult {
    value = value.trim();
    if (value.length > MAX_SEASON_DESCRIPTION_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.seasonDescriptionTooLongError,
      };
    } else {
      this.request.description = value;
      return {
        valid: true,
      };
    }
  }

  private update(): Promise<UpdateSeasonResponse> {
    return this.serviceClient.send(newUpdateSeasonRequest(this.request));
  }

  private postUpdate(response?: UpdateSeasonResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else {
      return "";
    }
  }

  public get body(): HTMLElement {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
