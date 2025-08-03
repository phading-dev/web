import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
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
  on(event: "updated", listener: () => void): this;
  on(event: "unpublished", listener: () => void): this;
}

export class PublishedPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ): PublishedPage {
    return new PublishedPage(
      SERVICE_CLIENT,
      () => Date.now(),
      seasonId,
      episodeId,
      episode,
    );
  }

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
    public seasonId: string,
    public episodeId: string,
    public episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;
    this.unpublishRequest.seasonId = seasonId;
    this.unpublishRequest.episodeId = episodeId;

    this.inputFormPage = new InputFormPage<
      UpdateEpisodePremiereTimeResponse,
      UnpublishEpisodeResponse
    >({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eFormTitle(LOCALIZED_TEXT.publishedEpisodeTitle),
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
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.updateButtonLabel,
        () => this.update(),
        (error) => this.postUpdate(error),
      )
      .addSecondaryButton(
        LOCALIZED_TEXT.unpublishButtonLabel,
        () => this.unpublish(),
        (error) => this.postUnpublish(error),
      )
      .addBackButton()
      .addInputs(this.premiereTimeInput.val)
      .on("back", () => this.emit("back"))
      .on("primaryDone", () => this.emit("updated"))
      .on("secondaryDone", () => this.emit("unpublished"));
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
      return LOCALIZED_TEXT.updateGenericError;
    } else {
      this.emit("back");
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
