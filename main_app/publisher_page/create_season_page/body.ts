import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { MAX_SEASON_NAME_LENGTH } from "@phading/constants/show";
import { newCreateSeasonRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  CreateSeasonRequestBody,
  CreateSeasonResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreateSeasonPage {
  on(event: "viewSeason", listener: (seasonId: string) => void): this;
  on(event: "createDone", listener: () => void): this;
}

export class CreateSeasonPage extends EventEmitter {
  public static create(): CreateSeasonPage {
    return new CreateSeasonPage(SERVICE_CLIENT);
  }

  public inputFormPage: InputFormPage<CreateSeasonResponse>;
  public seasonNameInput = new Ref<TextInputWithErrorMsg>();
  private request: CreateSeasonRequestBody = {};

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.inputFormPage = new InputFormPage<CreateSeasonResponse>(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      LOCALIZED_TEXT.createSeasonTitle,
      [
        assign(
          this.seasonNameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.seasonNameLabel,
            "",
            {
              type: "text",
            },
            (value) => this.validateNameAndTake(value),
          ),
        ).body,
      ],
      [this.seasonNameInput.val],
      LOCALIZED_TEXT.createButtonLabel,
    )
      .addPrimaryAction(
        () => this.create(),
        (response, error) => this.postCreate(response, error),
      )
      .on("handlePrimarySuccess", (response) =>
        this.emit("viewSeason", response.seasonId),
      )
      .on("primaryDone", () => this.emit("createDone"));
    this.seasonNameInput.val.validate();
  }

  private validateNameAndTake(value: string): ValidationResult {
    value = value.trim();
    if (!value) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_SEASON_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.seasonNameTooLongError,
      };
    } else {
      this.request.name = value;
      return { valid: true };
    }
  }

  private create(): Promise<CreateSeasonResponse> {
    return this.serviceClient.send(newCreateSeasonRequest(this.request));
  }

  private postCreate(response?: CreateSeasonResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.createGenericError;
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
