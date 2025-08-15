import EventEmitter = require("events");
import { IconButton, createBackButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { formatPremiereTimeLong } from "../../../../common/formatter/date";
import { formatStorageEstimatedMonthlyPrice } from "../../../../common/formatter/price";
import { formatBytesShort } from "../../../../common/formatter/quantity";
import {
  createCircleWithArrowIcon,
  createExclamationMarkInACycle,
  createPlayIcon,
  createUploadIcon,
} from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../../common/page_elements";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_0_25X,
  GAP_0_5X,
  GAP_1X,
  ICON_BUTTON_L,
  ICON_L,
  ICON_M,
  LINE_HEIGHT_L,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import {
  eBox,
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON } from "@phading/constants/show";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newGetEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  LastProcessingFailure,
  ProcessingFailureReason,
} from "@phading/video_service_interface/node/last_processing_failure";
import { VideoContainer } from "@phading/video_service_interface/node/video_container";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "editName", listener: (episode: EpisodeDetails) => void): this;
  on(event: "editIndex", listener: (episode: EpisodeDetails) => void): this;
  on(event: "editTracks", listener: (episode: EpisodeDetails) => void): this;
  on(event: "upload", listener: (episode: EpisodeDetails) => void): this;
  on(event: "publish", listener: (episode: EpisodeDetails) => void): this;
  on(
    event: "updatePremiereTime",
    listener: (episode: EpisodeDetails) => void,
  ): this;
  on(event: "watch", listener: (episode: EpisodeDetails) => void): this;
  on(event: "delete", listener: (episode: EpisodeDetails) => void): this;
  on(event: "unpublish", listener: (episode: EpisodeDetails) => void): this;
}

// Assumptions:
// - EpisodeDetails.videoContainerCached is required to publish an episode.
export class InfoPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): InfoPage {
    return new InfoPage(
      window,
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      episodeId,
    );
  }

  private static LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS =
    12 * 60 * 60 * 1000;

  public body: HTMLElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<IconButton>();
  public editNameButton = new Ref<HTMLDivElement>();
  public editIndexButton = new Ref<HTMLDivElement>();
  public refreshVideoContainerButton = new Ref<HTMLDivElement>();
  public watchButton = new Ref<HTMLDivElement>();
  public editTracksButton = new Ref<HTMLDivElement>();
  public uploadButton = new Ref<HTMLDivElement>();
  public refreshProcessingButton = new Ref<HTMLDivElement>();
  public publishEpisodeButton = new Ref<HTMLDivElement>();
  public updatePremiereTimeButton = new Ref<HTMLDivElement>();
  public deleteButton = new Ref<HTMLDivElement>();
  public unpublishButton = new Ref<HTMLDivElement>();

  public constructor(
    private window: Window,
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
    );
    this.load();
  }

  private async load(): Promise<void> {
    let { episode } = await this.serviceClient.send(
      newGetEpisodeRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
    this.card.val.append(
      assign(this.backButton, createBackButton()).body,
      E.div(
        {
          class: "episode-details-info-card-season-title",
          style: `align-self: center; text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`${episode.seasonName}`),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(
        this.editNameButton,
        eColumnBoxWithArrow([
          eLabelAndText(
            LOCALIZED_TEXT.seasonEpisodeNameLabel,
            episode.episodeName,
          ),
        ]),
      ),
      ...(episode.episodeIndex
        ? [
            assign(
              this.editIndexButton,
              eColumnBoxWithArrow(
                [
                  eLabelAndText(
                    LOCALIZED_TEXT.seasonEpisodeIndexLabel,
                    `${LOCALIZED_TEXT.seasonEpisodeIndexOfTotal[0]}${episode.episodeIndex}${LOCALIZED_TEXT.seasonEpisodeIndexOfTotal[1]}${episode.totalPublishedEpisodes}${LOCALIZED_TEXT.seasonEpisodeIndexOfTotal[2]}`,
                  ),
                ],
                {
                  customStyle: `margin-top: ${GAP_1X}rem;`,
                },
              ),
            ),
          ]
        : []),
      ...this.eVideoContainerState(episode.videoContainer),
      ...this.eVideoPlayerButton(episode.videoUrl),
      ...this.eEditTracksButton(episode.videoContainer),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      this.eUploadOrProcessingBox(episode.videoContainer),
      ...this.eUploadFooter(episode.videoContainer),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      this.eStateButton(episode),
      ...this.eStorageFee(episode.videoContainer),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      this.eDangerZoneButton(episode),
    );
    this.backButton.val.addAction(() => this.emit("back"));
    this.editNameButton.val.addEventListener("click", () =>
      this.emit("editName", episode),
    );
    this.editIndexButton.val?.addEventListener("click", () =>
      this.emit("editIndex", episode),
    );
    this.refreshVideoContainerButton.val?.addEventListener("click", () =>
      this.window.location.reload(),
    );
    this.watchButton.val?.addEventListener("click", () =>
      this.emit("watch", episode),
    );
    this.editTracksButton.val?.addEventListener("click", () =>
      this.emit("editTracks", episode),
    );
    this.uploadButton.val?.addEventListener("click", () =>
      this.emit("upload", episode),
    );
    this.refreshProcessingButton.val?.addEventListener("click", () =>
      this.window.location.reload(),
    );
    this.publishEpisodeButton.val?.addEventListener("click", () =>
      this.emit("publish", episode),
    );
    this.updatePremiereTimeButton.val?.addEventListener("click", () =>
      this.emit("updatePremiereTime", episode),
    );
    this.deleteButton.val?.addEventListener("click", () =>
      this.emit("delete", episode),
    );
    this.unpublishButton.val?.addEventListener("click", () =>
      this.emit("unpublish", episode),
    );
    this.emit("loaded");
  }

  private eVideoContainerState(
    videoContainer: VideoContainer,
  ): Array<HTMLDivElement> {
    if (videoContainer.masterPlaylist.committing) {
      return [
        assign(
          this.refreshVideoContainerButton,
          eBox(
            [
              E.div(
                {
                  class: "episode-details-video-container-button-icon",
                  style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                },
                createCircleWithArrowIcon(SCHEME.neutral1),
              ),
              E.div(
                {
                  class: "episode-details-video-container-button-text",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeVideoComittingVideoLabel),
              ),
            ],
            {
              customStyle: `margin-top: ${GAP_1X}rem; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
            },
          ),
        ),
      ];
    } else {
      return [];
    }
  }

  private eVideoPlayerButton(videoUrl?: string): Array<HTMLElement> {
    if (!videoUrl) {
      return [];
    }
    return [
      assign(
        this.watchButton,
        eBox(
          [
            E.div(
              {
                class: "episode-details-video-container-button-icon",
                style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
              },
              createPlayIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "episode-details-video-player-button",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeWatchVideoLabel),
            ),
          ],
          {
            customStyle: `margin-top: ${GAP_1X}rem; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
          },
        ),
      ),
    ];
  }

  private eEditTracksButton(
    videoContainer: VideoContainer,
  ): Array<HTMLDivElement> {
    if (
      videoContainer.videos.length === 0 &&
      videoContainer.audios.length === 0 &&
      videoContainer.subtitles.length === 0
    ) {
      return [];
    }
    let hasPendingTracks =
      videoContainer.videos.some((video) => video.staging) ||
      videoContainer.audios.some((audio) => audio.staging) ||
      videoContainer.subtitles.some((subtitle) => subtitle.staging);
    return [
      assign(
        this.editTracksButton,
        eColumnBoxWithArrow(
          [
            E.div(
              {
                class: "episode-details-tracks",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeTracksTitle),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_0_25X}rem;`,
            }),
            E.div(
              {
                class: "episode-details-track-state",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${hasPendingTracks ? SCHEME.fair0 : SCHEME.great0};`,
              },
              E.text(
                hasPendingTracks
                  ? LOCALIZED_TEXT.seasonEpisodeTrackStatePendingLabel
                  : LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel,
              ),
            ),
            E.div(
              {
                class: "episode-details-video-tracks",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeVideoTrackSummary[0]}${videoContainer.videos.length}${LOCALIZED_TEXT.seasonEpisodeVideoTrackSummary[1]}`,
              ),
            ),
            E.div(
              {
                class: "episode-details-audio-tracks",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeAudioTrackSummary[0]}${videoContainer.audios.length}${LOCALIZED_TEXT.seasonEpisodeAudioTrackSummary[1]}`,
              ),
            ),
            E.div(
              {
                class: "episode-details-subtitle-tracks",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeSubtitleTrackSummary[0]}${videoContainer.subtitles.length}${LOCALIZED_TEXT.seasonEpisodeSubtitleTrackSummary[1]}`,
              ),
            ),
          ],
          {
            linesGap: 0,
            customStyle: `margin-top: ${GAP_1X}rem;`,
          },
        ),
      ),
    ];
  }

  private eUploadOrProcessingBox(
    videoContainer: VideoContainer,
  ): HTMLDivElement {
    if (!videoContainer.processing) {
      return assign(
        this.uploadButton,
        eBox(
          [
            E.div(
              {
                class: "episode-details-upload-button-icon",
                style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
              },
              createUploadIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "episode-details-upload-button-text",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoUploadLabel),
            ),
          ],
          {
            customStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_1X}rem;`,
          },
        ),
      );
    } else if (videoContainer.processing.uploading) {
      return assign(
        this.uploadButton,
        eBox(
          [
            E.div(
              {
                class: "episode-details-resume-upload-button-icon",
                style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
              },
              createUploadIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "episode-details-resume-upload-button-text",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoResumeUploadLabel),
            ),
          ],
          {
            customStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_1X}rem;`,
          },
        ),
      );
    } else if (
      videoContainer.processing.mediaFormatting ||
      videoContainer.processing.subtitleFormatting
    ) {
      return assign(
        this.refreshProcessingButton,
        eBox(
          [
            E.div(
              {
                class: "episode-details-processing-button-icon",
                style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
              },
              createCircleWithArrowIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "episode-details-processing-button-text",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoProcessingLabel),
            ),
          ],
          {
            customStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
          },
        ),
      );
    } else {
      throw new Error(
        `Not handled: ${JSON.stringify(videoContainer.processing)}`,
      );
    }
  }

  private eUploadFooter(videoContainer: VideoContainer): Array<HTMLDivElement> {
    if (
      videoContainer.lastProcessingFailure &&
      videoContainer.lastProcessingFailure.timeMs >
        this.getNowDate().getTime() -
          InfoPage.LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS
    ) {
      return [
        E.div(
          {
            class: "episode-details-video-container-failures",
            style: `margin-top: ${GAP_0_25X}rem; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.bad0};`,
          },
          this.eProcessingFailureText(videoContainer.lastProcessingFailure),
        ),
      ];
    } else {
      return [];
    }
  }

  private eProcessingFailureText(failure: LastProcessingFailure): Text {
    let texts = new Array<string>();
    for (let reason of failure.reasons) {
      switch (reason) {
        case ProcessingFailureReason.MEDIA_FORMAT_INVALID:
          texts.push(LOCALIZED_TEXT.seasonEpisodeMediaFormatInvalid);
          break;
        case ProcessingFailureReason.MEDIA_FORMAT_FAILURE:
          texts.push(LOCALIZED_TEXT.seasonEpisodeMediaFormatFailure);
          break;
        case ProcessingFailureReason.VIDEO_CODEC_REQUIRES_H264:
          texts.push(LOCALIZED_TEXT.seasonEpisodeVideoCodecRequiresH264);
          break;
        case ProcessingFailureReason.AUDIO_CODEC_REQUIRES_AAC:
          texts.push(LOCALIZED_TEXT.seasonEpisodeAudioCodecRequiresAac);
          break;
        case ProcessingFailureReason.SUBTITLE_ZIP_FORMAT_INVALID:
          texts.push(LOCALIZED_TEXT.seasonEpisodeSubtitleZipFormatInvalid);
          break;
        default:
          throw new Error(`Not handled: ${ProcessingFailureReason[reason]}`);
      }
    }
    return E.text(texts.join(" "));
  }

  private eStateButton(episode: EpisodeDetails): HTMLDivElement {
    switch (episode.state) {
      case EpisodeState.DRAFT:
        return assign(
          this.publishEpisodeButton,
          eColumnBoxWithArrow(
            [
              E.div(
                {
                  class: "episode-details-episode-draft-state",
                  style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateLabel),
              ),
              E.div(
                {
                  class: "episode-details-episode-draft-state-value",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.fair0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateDraft),
              ),
              E.div(
                {
                  class: "episode-details-episode-draft-state-footer",
                  style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
                },
                E.text(
                  !episode.videoContainerCached
                    ? LOCALIZED_TEXT.seasonEpisodeStateNoVideoFooter
                    : episode.totalPublishedEpisodes >=
                        MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON
                      ? `${LOCALIZED_TEXT.seasonEpisodeStateTooManyEpisodesFooter[0]}${MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON}${LOCALIZED_TEXT.seasonEpisodeStateTooManyEpisodesFooter[1]}`
                      : LOCALIZED_TEXT.seasonEpisodeStatePublishFooter,
                ),
              ),
            ],
            {
              linesGap: GAP_0_25X,
              clickable:
                Boolean(episode.videoContainerCached) &&
                episode.totalPublishedEpisodes <
                  MAX_NUM_OF_PUBLISHED_EPISODES_PER_SEASON,
            },
          ),
        );
      case EpisodeState.PUBLISHED:
        return assign(
          this.updatePremiereTimeButton,
          eColumnBoxWithArrow(
            [
              E.div(
                {
                  class: "episode-details-episode-published-state",
                  style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateLabel),
              ),
              E.div(
                {
                  class: "episode-details-episode-published-state-value",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.great0};`,
                },
                E.text(
                  episode.seasonState === SeasonState.DRAFT
                    ? LOCALIZED_TEXT.seasonEpisodeStateReady
                    : LOCALIZED_TEXT.seasonEpisodeStatePublished,
                ),
              ),
              E.div(
                {
                  class: "episode-details-episode-premiere-time",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${episode.canPlay ? LOCALIZED_TEXT.seasonHasPremieredAt : LOCALIZED_TEXT.seasonPremieresAt}${formatPremiereTimeLong(episode.premiereTimeMs)}`,
                ),
              ),
              ...(episode.seasonState === SeasonState.DRAFT
                ? [
                    E.div(
                      {
                        class: "episode-details-episode-season-not-published",
                        style: `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_25X}rem;`,
                      },
                      E.div(
                        {
                          style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
                        },
                        createExclamationMarkInACycle(SCHEME.fair0),
                      ),
                      E.div(
                        {
                          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.fair0};`,
                        },
                        E.text(LOCALIZED_TEXT.seasonEpisodeSeasonNotPublished),
                      ),
                    ),
                  ]
                : []),
            ],
            {
              linesGap: GAP_0_25X,
            },
          ),
        );
    }
  }

  private eStorageFee(videoContainer: VideoContainer): Array<HTMLDivElement> {
    if (
      videoContainer.videos.length === 0 &&
      videoContainer.audios.length === 0 &&
      videoContainer.subtitles.length === 0
    ) {
      return [];
    }
    let videoBytes = videoContainer.videos.reduce(
      (acc, videoTrack) => acc + videoTrack.totalBytes,
      0,
    );
    let audioBytes = videoContainer.audios.reduce(
      (acc, audioTrack) => acc + audioTrack.totalBytes,
      0,
    );
    let subtitleBytes = videoContainer.subtitles.reduce(
      (acc, subtitleTrack) => acc + subtitleTrack.totalBytes,
      0,
    );
    let totalBytes = videoBytes + audioBytes + subtitleBytes;
    return [
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eColumnBoxWithArrow(
        [
          E.div(
            {
              class: "episode-details-storage-summary-title",
              style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeStorageFeeTitle),
          ),
          E.div(
            {
              class: "episode-details-subtitle-track-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeStorageSize}${formatBytesShort(totalBytes)}`,
            ),
          ),
          E.div(
            {
              class: "episode-details-subtitle-track-duration-sec",
              style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeStorageEstimatedFee}${formatStorageEstimatedMonthlyPrice(
                totalBytes,
                this.getNowDate(),
              )}`,
            ),
          ),
        ],
        {
          linesGap: GAP_0_25X,
          clickable: false,
        },
      ),
    ];
  }

  private eDangerZoneButton(episode: EpisodeDetails): HTMLDivElement {
    let ele = eColumnBoxWithArrow([
      E.div(
        {
          class: "season-details-danger-zone",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0};`,
        },
        E.text(LOCALIZED_TEXT.seasonDangerZone),
      ),
    ]);
    switch (episode.state) {
      case EpisodeState.DRAFT:
        this.deleteButton.val = ele;
        break;
      case EpisodeState.PUBLISHED:
        this.unpublishButton.val = ele;
        break;
    }
    return ele;
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
