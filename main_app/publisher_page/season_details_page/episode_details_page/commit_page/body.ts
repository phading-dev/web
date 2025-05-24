import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { InputFormPage } from "../../../../../common/input_form_page/body";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { FONT_M, FONT_S } from "../../../../../common/sizes";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { newCommitEpisodeStagingDataRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  CommitEpisodeStagingDataRequestBody,
  CommitEpisodeStagingDataResponse,
  ValidationError,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CommitPage {
  on(event: "back", listener: () => void): this;
}

export class CommitPage extends EventEmitter {
  public inputFormPage: InputFormPage<CommitEpisodeStagingDataResponse>;
  private request: CommitEpisodeStagingDataRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    seasonId: string,
    episodeId: string,
    episode: EpisodeDetails,
  ) {
    super();
    this.request.seasonId = seasonId;
    this.request.episodeId = episodeId;

    let version =
      episode.videoContainer.masterPlaylist.synced?.version ??
      episode.videoContainer.masterPlaylist.writingToFile?.version ??
      episode.videoContainer.masterPlaylist.syncing?.version;
    this.inputFormPage = new InputFormPage<CommitEpisodeStagingDataResponse>(
      LOCALIZED_TEXT.commitEpisodeVideoTitle,
      [
        E.div(
          {
            class: "commit-page-version",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.commitEpisodeVideoNewVersionLabel}${version + 1}`,
          ),
        ),
        E.div(
          {
            class: "commit-page-footer",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${episode.state === EpisodeState.PUBLISHED ? LOCALIZED_TEXT.commitEpisodeVideoPublishedFooter : LOCALIZED_TEXT.commitEpisodeVideoDraftFooter}`,
          ),
        ),
      ],
      [],
      LOCALIZED_TEXT.commitEpisodeVideoButtonLabel,
    ).addBackButton();
    this.inputFormPage.on("back", () => this.emit("back"));
    this.inputFormPage.addPrimaryAction(
      () => this.commit(),
      (response, error) => this.postCommit(response, error),
    );
  }

  private async commit(): Promise<CommitEpisodeStagingDataResponse> {
    return this.serviceClient.send(
      newCommitEpisodeStagingDataRequest(this.request),
    );
  }

  private postCommit(
    response: CommitEpisodeStagingDataResponse,
    error?: Error,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.commitEpisodeVideoGenericError;
    }
    if (response.success) {
      return "";
    }
    switch (response.error) {
      case ValidationError.NO_VIDEO_TRACK:
        return LOCALIZED_TEXT.commitEpisodeVideoNoVideoError;
      case ValidationError.MORE_THAN_ONE_VIDEO_TRACKS:
        return LOCALIZED_TEXT.commitEpisodeVideoMoreThanOneVideoError;
      case ValidationError.TOO_MANY_AUDIO_TRACKS:
        return LOCALIZED_TEXT.commitEpisodeVideoTooManyAudioError;
      case ValidationError.NO_DEFAULT_AUDIO_TRACK:
        return LOCALIZED_TEXT.commitEpisodeVideoNoDefaultAudioError;
      case ValidationError.MORE_THAN_ONE_DEFAULT_AUDIO_TRACKS:
        return LOCALIZED_TEXT.commitEpisodeVideoMoreThanOneDefaultAudioError;
      case ValidationError.TOO_MANY_SUBTITLE_TRACKS:
        return LOCALIZED_TEXT.commitEpisodeVideoTooManySubtitleError;
      default:
        throw new Error(`Unhandled error: ${ValidationError[response.error]}`);
    }
  }

  public get body(): HTMLElement {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
