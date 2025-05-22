import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/text_area_input";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { newUpdateEpisodeIndexRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  UpdateEpisodeIndexRequestBody,
  UpdateEpisodeIndexResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateIndexPage {
  on(event: "back", listener: () => void): this;
}

// Assumptions:
//  - Index always starts from 1.
export class UpdateIndexPage extends EventEmitter {
  public inputFormPage: InputFormPage<UpdateEpisodeIndexResponse>;
  public episodeIndexInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateEpisodeIndexRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    seasonId: string,
    episodeId: string,
    private episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<UpdateEpisodeIndexResponse>(
      LOCALIZED_TEXT.updateEpisodeIndexTitle,
      [
        assign(
          this.episodeIndexInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.updateEpisodeIndexLabel[0]}1${LOCALIZED_TEXT.updateEpisodeIndexLabel[1]}${episode.totalPublishedEpisodes}${LOCALIZED_TEXT.updateEpisodeIndexLabel[2]}`,
            "",
            {
              type: "text",
              value: `${episode.episodeIndex}`,
            },
            (value) => this.validateIndexAndTake(value),
          ),
        ).body,
      ],
      [this.episodeIndexInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
    ).addBackButton();
    this.inputFormPage.on("back", () => this.emit("back"));
    this.inputFormPage.addPrimaryAction(
      () => this.update(),
      (response, error) => this.postUpdate(error),
    );
    this.inputFormPage.on("handlePrimarySuccess", () => this.emit("back"));
  }

  private validateIndexAndTake(value: string): ValidationResult {
    let newIndex = parseInt(value);
    if (isNaN(newIndex)) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateEpisodeIndexError,
      };
    } else if (newIndex < 1 || newIndex > this.episode.totalPublishedEpisodes) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.updateEpisodeIndexOutOfRangeError,
      };
    } else {
      this.request.toIndex = newIndex;
      return {
        valid: true,
      };
    }
  }

  private update(): Promise<UpdateEpisodeIndexResponse> {
    return this.serviceClient.send(newUpdateEpisodeIndexRequest(this.request));
  }

  private postUpdate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  public get body(): HTMLDivElement {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
