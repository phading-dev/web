import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ErrorInput } from "../../../../common/input_form_page/error_input";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { TextInputWithErrorMsg } from "../../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON } from "@phading/constants/show";
import {
  newDeleteEpisodeRequest,
  newPublishEpisodeRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  DeleteEpisodeResponse,
  PublishEpisodeRequestBody,
  PublishEpisodeResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface DraftPage {
  on(event: "back", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
  on(event: "published", listener: () => void): this;
  on(event: "deleted", listener: () => void): this;
}

export class DraftPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ): DraftPage {
    return new DraftPage(
      SERVICE_CLIENT,
      () => Date.now(),
      seasonId,
      episodeId,
      episode,
    );
  }

  public inputFormPage: InputFormPage<
    PublishEpisodeResponse,
    DeleteEpisodeResponse
  >;
  public premiereTimeInput = new Ref<TextInputWithErrorMsg>();
  public errorInput = new Ref<ErrorInput>();
  private request: PublishEpisodeRequestBody = {};

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

    let errors = new Array<string>();
    if (!episode.videoContainerCached) {
      errors.push(LOCALIZED_TEXT.noVideoCommittedError);
    }
    if (
      episode.totalPublishedEpisodes >= MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON
    ) {
      errors.push(LOCALIZED_TEXT.reachedMaximumPublishedEpisodeError);
    }

    this.inputFormPage = new InputFormPage<
      PublishEpisodeResponse,
      DeleteEpisodeResponse
    >(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      [
        eFormTitle(LOCALIZED_TEXT.draftEpisodeTitle),
        ...(errors.length > 0
          ? [assign(this.errorInput, new ErrorInput(errors.join(" "))).body]
          : []),
        assign(
          this.premiereTimeInput,
          new TextInputWithErrorMsg(
            `${LOCALIZED_TEXT.draftEpisodePremieresAtLabel[0]}${Intl.DateTimeFormat().resolvedOptions().timeZone}${LOCALIZED_TEXT.draftEpisodePremieresAtLabel[1]}`,
            "",
            {
              type: "datetime-local",
              step: "60",
            },
            (value) => this.validatePremiereTimeAndTake(value),
          ),
        ).body,
      ],
      [
        ...(this.errorInput.val ? [this.errorInput.val] : []),
        this.premiereTimeInput.val,
      ],
      LOCALIZED_TEXT.publishButtonLabel,
    )
      .addBackButton()
      .on("back", () => this.emit("back"))
      .addPrimaryAction(
        () => this.publish(),
        (response, error) => this.postPublish(error),
      )
      .on("handlePrimarySuccess", () => this.emit("back"))
      .on("primaryDone", () => this.emit("published"))
      .addSecondaryButton(
        LOCALIZED_TEXT.deleteButtonLabel,
        () => this.delete(),
        (response, error) => this.postDelete(error),
      )
      .on("handleSecondarySuccess", () => this.emit("delete"))
      .on("secondaryDone", () => this.emit("deleted"));
    this.errorInput.val?.validate();
    this.premiereTimeInput.val.validate();
  }

  private validatePremiereTimeAndTake(value: string): ValidationResult {
    if (!value) {
      this.request.premiereTimeMs = undefined;
      return {
        valid: true,
      };
    } else if (new Date(value).getTime() < this.getNow()) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.premiereTimeInThePastError,
      };
    } else {
      this.request.premiereTimeMs = new Date(value).getTime(); // Under local timezone
      return {
        valid: true,
      };
    }
  }

  private async publish(): Promise<PublishEpisodeResponse> {
    return this.serviceClient.send(newPublishEpisodeRequest(this.request));
  }

  private postPublish(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.publishEpisodeGenericError;
    } else {
      return "";
    }
  }

  private async delete(): Promise<DeleteEpisodeResponse> {
    return this.serviceClient.send(
      newDeleteEpisodeRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
  }

  private postDelete(error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.deleteGenericError;
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
