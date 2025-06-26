import EventEmitter = require("events");
import Hls from "hls.js";
import { SCHEME } from "../../../../common/color_scheme";
import { formatPremiereTimeLong } from "../../../../common/formatter/date";
import { formatStorageEstimatedMonthlyPrice } from "../../../../common/formatter/price";
import { formatBytesShort } from "../../../../common/formatter/quantity";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import { createUploadIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_BUTTON_L,
  ICON_L,
} from "../../../../common/sizes";
import {
  eBox,
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { newGetEpisodeRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  LastProcessingFailure,
  ProcessingFailureReason,
} from "@phading/video_service_interface/node/last_processing_failure";
import {
  AudioTrack,
  SubtitleTrack,
  VideoContainer,
  VideoTrack,
} from "@phading/video_service_interface/node/video_container";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "editName", listener: (episode: EpisodeDetails) => void): this;
  on(event: "editIndex", listener: (episode: EpisodeDetails) => void): this;
  on(
    event: "editDraftState",
    listener: (episode: EpisodeDetails) => void,
  ): this;
  on(
    event: "editPublishedState",
    listener: (episode: EpisodeDetails) => void,
  ): this;
  on(event: "upload", listener: (episode: EpisodeDetails) => void): this;
  on(event: "editTracks", listener: (episode: EpisodeDetails) => void): this;
}

// Assumptions:
// - EpisodeDetails.videoContainerCached is required to publish an episode.
export class InfoPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): InfoPage {
    return new InfoPage(SERVICE_CLIENT, () => new Date(), seasonId, episodeId);
  }

  private static LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS =
    12 * 60 * 60 * 1000;

  public body: HTMLElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<SimpleIconButton>();
  public episodeNameButton = new Ref<HTMLDivElement>();
  public episodeIndexButton = new Ref<HTMLDivElement>();
  public episodeDraftStateButton = new Ref<HTMLDivElement>();
  public episodePublishedStateButton = new Ref<HTMLDivElement>();
  public episodeUploadButton = new Ref<HTMLDivElement>();
  public editTracksButton = new Ref<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L + 1}rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap;`,
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
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`${episode.seasonName}`),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(
        this.episodeNameButton,
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
              this.episodeIndexButton,
              eColumnBoxWithArrow(
                [
                  E.div(
                    {
                      class: "episode-details-episode-index",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(
                      `${LOCALIZED_TEXT.seasonEpisodeIndex[0]}${episode.episodeIndex}${LOCALIZED_TEXT.seasonEpisodeIndex[1]}${episode.totalPublishedEpisodes}${LOCALIZED_TEXT.seasonEpisodeIndex[2]}`,
                    ),
                  ),
                  E.div(
                    {
                      class: "episode-details-episode-index-footer",
                      style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(LOCALIZED_TEXT.seasonEpisodeIndexFooter),
                  ),
                ],
                {
                  linesGap: 1,
                  customeStyle: `margin-top: 2rem;`,
                },
              ),
            ),
          ]
        : []),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      this.eStateButton(episode),
      E.div({
        style: `flex: 0 0 auto; height: 3rem;`,
      }),
      E.div(
        {
          class: "episode-details-video-container-title",
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.seasonEpisodeVideoTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      this.eUploadBox(episode.videoContainer),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      this.eUploadFooter(episode.videoContainer),
      ...this.eVideoContainerState(episode.videoContainer),
      ...this.eVideoPlayer(episode.videoUrl),
      ...this.eEditTracksButton(episode.videoContainer),
      ...this.eStorageFee(episode.videoContainer),
    );
    this.backButton.val.on("action", () => this.emit("back"));
    this.episodeNameButton.val.addEventListener("click", () =>
      this.emit("editName", episode),
    );
    this.episodeIndexButton.val?.addEventListener("click", () =>
      this.emit("editIndex", episode),
    );
    this.episodeDraftStateButton.val?.addEventListener("click", () =>
      this.emit("editDraftState", episode),
    );
    this.episodePublishedStateButton.val?.addEventListener("click", () =>
      this.emit("editPublishedState", episode),
    );
    this.episodeUploadButton.val?.addEventListener("click", () =>
      this.emit("upload", episode),
    );
    this.editTracksButton.val?.addEventListener("click", () =>
      this.emit("editTracks", episode),
    );
    this.emit("loaded");
  }

  private eStateButton(episode: EpisodeDetails): HTMLDivElement {
    switch (episode.state) {
      case EpisodeState.DRAFT:
        return assign(
          this.episodeDraftStateButton,
          eColumnBoxWithArrow(
            [
              E.div(
                {
                  class: "episode-details-episode-draft-state",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateLabel),
              ),
              E.div(
                {
                  class: "episode-details-episode-draft-state-value",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateDraft),
              ),
              E.div(
                {
                  class: "episode-details-episode-draft-state-footer",
                  style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  !episode.videoContainerCached
                    ? LOCALIZED_TEXT.seasonEpisodeStateNoVideoFooter
                    : LOCALIZED_TEXT.seasonEpisodeStateDraftFooter,
                ),
              ),
            ],
            {
              linesGap: 1,
            },
          ),
        );
      case EpisodeState.PUBLISHED:
        return assign(
          this.episodePublishedStateButton,
          eColumnBoxWithArrow(
            [
              E.div(
                {
                  class: "episode-details-episode-published-state",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStateLabel),
              ),
              E.div(
                {
                  class: "episode-details-episode-published-state-value",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeStatePublished),
              ),
              E.div(
                {
                  class: "episode-details-episode-premiere-time",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${episode.canPlay ? LOCALIZED_TEXT.seasonHasPremieredAt : LOCALIZED_TEXT.seasonPremieresAt}${formatPremiereTimeLong(episode.premiereTimeMs)}`,
                ),
              ),
            ],
            {
              linesGap: 1,
            },
          ),
        );
    }
  }

  private eUploadBox(videoContainer: VideoContainer): HTMLDivElement {
    if (!videoContainer.processing) {
      return assign(
        this.episodeUploadButton,
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
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoUploadLabel),
            ),
          ],
          {
            customeStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: 2rem;`,
          },
        ),
      );
    } else if (videoContainer.processing.uploading) {
      return assign(
        this.episodeUploadButton,
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
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoResumeUploadLabel),
            ),
          ],
          {
            customeStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: 2rem;`,
          },
        ),
      );
    } else if (
      videoContainer.processing.mediaFormatting ||
      videoContainer.processing.subtitleFormatting
    ) {
      return eBox(
        [
          E.div(
            {
              class: "episode-details-upload-button-text",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeVideoProcessingLabel),
          ),
        ],
        {
          clickable: false,
          customeStyle: `display: flex; flex-flow: row nowrap; justify-content: center;`,
        },
      );
    } else {
      throw new Error(
        `Not handled: ${JSON.stringify(videoContainer.processing)}`,
      );
    }
  }

  private eUploadFooter(videoContainer: VideoContainer): HTMLDivElement {
    if (
      videoContainer.lastProcessingFailure &&
      videoContainer.lastProcessingFailure.timeMs >
        this.getNowDate().getTime() -
          InfoPage.LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS
    ) {
      return E.div(
        {
          class: "episode-details-video-container-failures",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        this.eProcessingFailureText(videoContainer.lastProcessingFailure),
      );
    } else {
      return E.div(
        {
          class: "episode-details-video-container-explanation",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.seasonEpisodeVideoExplanation),
      );
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

  private eVideoContainerState(
    videoContainer: VideoContainer,
  ): Array<HTMLDivElement> {
    if (videoContainer.masterPlaylist.committing) {
      return [
        E.div(
          {
            class: "episode-details-video-container-state",
            style: `margin-top: 2rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.seasonEpisodeVideoComittingVideo),
        ),
      ];
    } else {
      return [];
    }
  }

  private eVideoPlayer(videoUrl?: string): Array<HTMLElement> {
    if (!videoUrl) {
      return [];
    }
    let video = E.video({
      class: "episode-details-video-player",
      style: `margin-top: 2rem; width: 100%; object-fit: contain;`,
      controls: "true",
    });
    let hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);
    return [video];
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
    return [
      assign(
        this.editTracksButton,
        eColumnBoxWithArrow(
          [
            ...(videoContainer.videos.length === 0
              ? []
              : [
                  E.div(
                    {
                      class: "episode-details-video-tracks",
                      style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
                    },
                    E.text(LOCALIZED_TEXT.seasonEpisodeVideoTracksTitle),
                  ),
                  E.div(
                    {
                      class: "episode-details-video-tracks",
                      style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
                    },
                    E.div(
                      {
                        class: "episode-details-video-track-state",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
                    ),
                    E.div(
                      {
                        class: "episode-details-video-track-duration-sec",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(
                        LOCALIZED_TEXT.seasonEpisodeTrackVideoDurationLabel,
                      ),
                    ),
                    E.div(
                      {
                        class: "episode-details-video-track-resolution",
                        style: `flex: 0 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(
                        LOCALIZED_TEXT.seasonEpisodeTrackVideoResolutionLabel,
                      ),
                    ),
                  ),
                ]),
            ...videoContainer.videos.map((videoTrack) =>
              this.eVideoTrack(videoTrack),
            ),
            ...(videoContainer.audios.length === 0
              ? []
              : [
                  E.div(
                    {
                      class: "episode-details-audio-tracks",
                      style: `margin-top: 2rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
                    },
                    E.text(LOCALIZED_TEXT.seasonEpisodeAudioTracksTitle),
                  ),
                  E.div(
                    {
                      class: "episode-details-audio-tracks",
                      style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
                    },
                    E.div(
                      {
                        class: "episode-details-audio-track-state",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
                    ),
                    E.div(
                      {
                        class: "episode-details-audio-track-duration-sec",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackNameLabel),
                    ),
                    E.div(
                      {
                        class: "episode-details-audio-track-default",
                        style: `flex: 0 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel),
                    ),
                  ),
                ]),
            ...videoContainer.audios.map((audioTrack) =>
              this.eAudioTrack(audioTrack),
            ),
            ...(videoContainer.subtitles.length === 0
              ? []
              : [
                  E.div(
                    {
                      class: "episode-details-subtitle-tracks",
                      style: `margin-top: 2rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
                    },
                    E.text(LOCALIZED_TEXT.seasonEpisodeSubtitleTracksTitle),
                  ),
                  E.div(
                    {
                      class: "episode-details-subtitle-tracks",
                      style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
                    },
                    E.div(
                      {
                        class: "episode-details-subtitle-track-state",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
                    ),
                    E.div(
                      {
                        class: "episode-details-subtitle-track-duration-sec",
                        style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonEpisodeTrackNameLabel),
                    ),
                  ),
                ]),
            ...videoContainer.subtitles.map((subtitleTrack) =>
              this.eSubtitleTrack(subtitleTrack),
            ),
          ],
          {
            linesGap: 0,
            customeStyle: `margin-top: 2rem;`,
          },
        ),
      ),
    ];
  }

  private eVideoTrack(videoTrack: VideoTrack): HTMLDivElement {
    return E.div(
      {
        class: "episode-details-video-track",
        style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "episode-details-video-track-state",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          videoTrack.staging
            ? LOCALIZED_TEXT.seasonEpisodeTrackStatePendingLabel
            : LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel,
        ),
      ),
      E.div(
        {
          class: "episode-details-video-track-duration-sec",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};${videoTrack.staging?.toDelete ? " text-decoration: line-through;" : ""}`,
        },
        E.text(`${formatSecondsAsHHMMSS(videoTrack.durationSec)}`),
      ),
      E.div(
        {
          class: "episode-details-video-track-resolution",
          style: `flex: 0 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};${videoTrack.staging?.toDelete ? " text-decoration: line-through;" : ""}`,
        },
        E.text(`${videoTrack.resolution}`),
      ),
    );
  }

  private eAudioTrack(audioTrack: AudioTrack): HTMLDivElement {
    return E.div(
      {
        class: "episode-details-audio-track",
        style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "episode-details-audio-track-state",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          audioTrack.staging
            ? LOCALIZED_TEXT.seasonEpisodeTrackStatePendingLabel
            : LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel,
        ),
      ),
      E.div(
        {
          class: "episode-details-audio-track-name",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
        },
        ...(Boolean(audioTrack.committed) &&
        Boolean(audioTrack.staging) &&
        audioTrack.committed.name !== audioTrack.staging.toAdd?.name
          ? [
              E.div(
                {
                  style: `display: inline; text-decoration: line-through;`,
                },

                E.text(audioTrack.committed?.name),
              ),
            ]
          : []),
        ...(audioTrack.staging?.toDelete
          ? []
          : [
              E.text(
                audioTrack.staging?.toAdd?.name ?? audioTrack.committed?.name,
              ),
            ]),
      ),
      E.div(
        {
          class: "episode-details-audio-default",
          style: `flex: 0 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
        },
        ...(Boolean(audioTrack.committed) &&
        Boolean(audioTrack.staging) &&
        audioTrack.committed.isDefault !== audioTrack.staging.toAdd?.isDefault
          ? [
              E.div(
                {
                  style: `display: inline; text-decoration: line-through;`,
                },
                E.text(
                  audioTrack.committed.isDefault
                    ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                    : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
                ),
              ),
            ]
          : []),
        ...(audioTrack.staging?.toDelete
          ? []
          : [
              E.text(
                (audioTrack.staging?.toAdd?.isDefault ??
                  audioTrack.committed?.isDefault)
                  ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                  : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
              ),
            ]),
      ),
    );
  }

  private eSubtitleTrack(subtitleTrack: SubtitleTrack): HTMLDivElement {
    return E.div(
      {
        class: "episode-details-subtitle-track",
        style: `width: 100%; box-sizing: border-box; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "episode-details-subtitle-track-state",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          subtitleTrack.staging
            ? LOCALIZED_TEXT.seasonEpisodeTrackStatePendingLabel
            : LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel,
        ),
      ),
      E.div(
        {
          class: "episode-details-subtitle-track-name",
          style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
        },
        ...(Boolean(subtitleTrack.committed) &&
        Boolean(subtitleTrack.staging) &&
        subtitleTrack.committed.name !== subtitleTrack.staging.toAdd?.name
          ? [
              E.div(
                {
                  style: `display: inline; text-decoration: line-through;`,
                },

                E.text(subtitleTrack.committed?.name),
              ),
            ]
          : []),
        ...(subtitleTrack.staging?.toDelete
          ? []
          : [
              E.text(
                subtitleTrack.staging?.toAdd?.name ??
                  subtitleTrack.committed?.name,
              ),
            ]),
      ),
    );
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
      E.div(
        {
          class: "episode-details-subtitle-tracks",
          style: `margin-top: 3rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.text(LOCALIZED_TEXT.seasonEpisodeStorageFeeTitle),
      ),
      E.div(
        {
          class: "episode-details-subtitle-tracks",
          style: `width: 100%; box-sizing: border-box; padding: 1rem; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
        },
        E.div(
          {
            class: "episode-details-subtitle-track-state",
            style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonEpisodeStorageSize}${formatBytesShort(totalBytes)}`,
          ),
        ),
        E.div(
          {
            class: "episode-details-subtitle-track-duration-sec",
            style: `flex: 1 1 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonEpisodeStorageEstimatedFee}${formatStorageEstimatedMonthlyPrice(
              totalBytes,
              this.getNowDate(),
            )}`,
          ),
        ),
      ),
    ];
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
