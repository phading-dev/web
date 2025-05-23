import EventEmitter = require("events");
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
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
  on(event: "showDetails", listener: (seasonId: string) => void): this;
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
    this.inputFormPage = new InputFormPage(
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
            (value) => this.validateOrTakeNaturalNameInput(value),
          ),
        ).body,
      ],
      [this.seasonNameInput.val],
      LOCALIZED_TEXT.createSeasonButtonLabel,
    );

    this.inputFormPage.addPrimaryAction(
      () => this.create(),
      (response, error) => this.postCreate(response, error),
    );
    this.inputFormPage.on("handlePrimarySuccess", (response) =>
      this.emit("showDetails", response.seasonId),
    );
  }

  private validateOrTakeNaturalNameInput(value: string): ValidationResult {
    if (value.length > MAX_SEASON_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.seasonNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
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
      return LOCALIZED_TEXT.createSeasonError;
    } else {
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
