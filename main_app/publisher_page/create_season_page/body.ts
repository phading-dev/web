import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eCenteredTitle } from "../../../common/page_elements";
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
    this.inputFormPage = new InputFormPage<CreateSeasonResponse>({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eCenteredTitle(LOCALIZED_TEXT.createSeasonTitle),
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
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.createButtonLabel,
        () => this.create(),
        (error, response) => this.postCreate(error, response),
      )
      .on("primaryDone", () => this.emit("createDone"))
      .addInputs(this.seasonNameInput.val);
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

  private postCreate(error?: Error, response?: CreateSeasonResponse): string {
    if (error) {
      return LOCALIZED_TEXT.createGenericError;
    } else {
      this.emit("viewSeason", response.seasonId);
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
