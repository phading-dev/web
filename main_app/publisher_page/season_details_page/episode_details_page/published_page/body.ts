import EventEmitter = require("events");
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../../common/input_form_page/input_with_error_msg";
import { TextInputWithErrorMsg } from "../../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  newUnpublishEpisodeRequest,
  newUpdateEpisodePremiereTimeRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  UnpublishEpisodeRequestBody,
  UnpublishEpisodeResponse,
  UpdateEpisodePremiereTimeRequestBody,
  UpdateEpisodePremiereTimeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface PublishedPage {
  on(event: "back", listener: () => void): this;
}

// TODO: Let user select time zone. Also need TzDate to be flexible in converting timezones.
export class PublishedPage extends EventEmitter {
  public inputFormPage: InputFormPage<
    UpdateEpisodePremiereTimeResponse,
    UnpublishEpisodeResponse
  >;
  public premiereTimeInput = new Ref<TextInputWithErrorMsg>();
  private request: UpdateEpisodePremiereTimeRequestBody = {};
  private unpublishRequest: UnpublishEpisodeRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    private getNow: () => number,
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;
    this.unpublishRequest.seasonId = seasonId;
    this.unpublishRequest.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<
      UpdateEpisodePremiereTimeResponse,
      UnpublishEpisodeResponse
    >(
      LOCALIZED_TEXT.publishedEpisodeTitle,
      [
        assign(
          this.premiereTimeInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.publishedEpisodeUpdatePremiereTimeLabel[0]}${Intl.DateTimeFormat().resolvedOptions().timeZone}${LOCALIZED_TEXT.publishedEpisodeUpdatePremiereTimeLabel[1]}`,
            "",
            {
              type: "datetime-local",
              value: this.toLocalISOStringUntilMinutes(
                new Date(episode.premiereTimeMs),
              ),
            },
            (value: string) => this.validatePremiereTimeAndTake(value),
          ),
        ).body,
      ],
      [this.premiereTimeInput.val],
      LOCALIZED_TEXT.updateButtonLabel,
    ).addBackButton();
    this.inputFormPage.on("back", () => this.emit("back"));
    this.inputFormPage.addPrimaryAction(
      () => this.update(),
      (response, error) => this.postUpdate(error),
    );
    this.inputFormPage.on("handlePrimarySuccess", () => this.emit("back"));
    this.inputFormPage.addSecondaryButton(
      LOCALIZED_TEXT.unpublishButtonLabel,
      () => this.unpublish(),
      (response, error) => this.postUnpublish(error),
    );
    this.inputFormPage.on("handleSecondarySuccess", () => this.emit("back"));
  }

  private toLocalISOStringUntilMinutes(date: Date): string {
    let year = date.getFullYear().toString().padStart(4, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = date.getDate().toString().padStart(2, "0");
    let hour = date.getHours().toString().padStart(2, "0");
    let minute = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  private validatePremiereTimeAndTake(value: string): ValidationResult {
    if (value === "") {
      return {
        valid: false,
      };
    } else if (new Date(value).getTime() < this.getNow()) {
      return {
        valid: false,
      };
    } else {
      this.request.premiereTimeMs = new Date(value).getTime();
      return {
        valid: true,
      };
    }
  }

  private async update(): Promise<UpdateEpisodePremiereTimeResponse> {
    return this.serviceClient.send(
      newUpdateEpisodePremiereTimeRequest(this.request),
    );
  }

  private postUpdate(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericFailure;
    } else {
      return "";
    }
  }

  private async unpublish(): Promise<UnpublishEpisodeResponse> {
    return this.serviceClient.send(
      newUnpublishEpisodeRequest(this.unpublishRequest),
    );
  }

  private postUnpublish(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.unpublishEpisodeGenericError;
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
