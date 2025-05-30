import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { MAX_EPISODE_NAME_LENGTH } from "@phading/constants/show";
import { newCreateEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import {
  CreateEpisodeRequestBody,
  CreateEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreateEpisodePage {
  on(event: "back", listener: () => void): this;
  on(event: "showEpisode", listener: (episodeId: string) => void): this;
  on(event: "created", listener: () => void): this;
}

export class CreateEpisodePage extends EventEmitter {
  public inputFormPage: InputFormPage<CreateEpisodeResponse>;
  public nameInput = new Ref<TextInputWithErrorMsg>();
  private request: CreateEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    seasonId: string,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.inputFormPage = new InputFormPage<CreateEpisodeResponse>(
      LOCALIZED_TEXT.createEpisodeTitle,
      [
        assign(
          this.nameInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.createEpisodeNameLabel,
            "",
            {
              type: "text",
            },
            (value) => this.validateNameAndTake(value),
          ),
        ).body,
      ],
      [this.nameInput.val],
      LOCALIZED_TEXT.createButtonLabel,
    ).addBackButton();
    this.inputFormPage.on("back", () => this.emit("back"));
    this.inputFormPage.addPrimaryAction(
      () => this.create(),
      (response, error) => this.postCreate(error),
    );
    this.inputFormPage.on("handlePrimarySuccess", (response) =>
      this.emit("showEpisode", response.episodeId),
    );
    this.inputFormPage.on("primaryDone", () => this.emit("created"));
  }

  private validateNameAndTake(value: string): ValidationResult {
    if (value.length === 0) {
      return {
        valid: false,
      };
    } else if (value.length > MAX_EPISODE_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.createEpisodeNameTooLongError,
      };
    } else {
      this.request.episodeName = value;
      return {
        valid: true,
      };
    }
  }

  private create(): Promise<CreateEpisodeResponse> {
    return this.serviceClient.send(newCreateEpisodeRequest(this.request));
  }

  private postCreate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.createGenericError;
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
