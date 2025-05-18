import EventEmitter = require("events");
import Hls from "hls.js";
import { SCHEME } from "../../../../../common/color_scheme";
import { formatPremiereTimeLong } from "../../../../../common/formatter/date";
import { formatSecondsAsHHMMSS } from "../../../../../common/formatter/timestamp";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../../common/icon_button";
import { createArrowIcon, createUploadIcon } from "../../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  PAGE_MEDIUM_TOP_DOWN_CARD_STYLE,
  PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE,
} from "../../../../../common/page_style";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_BUTTON_L,
  ICON_L,
  ICON_M,
} from "../../../../../common/sizes";
import {
  eBox,
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../../common/value_box";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/elements";
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
  on(event: "commitVideo", listener: (episode: EpisodeDetails) => void): this;
  on(event: "editVideoTrack", listener: (videoTrack: VideoTrack) => void): this;
  on(event: "editAudioTrack", listener: (audioTrack: AudioTrack) => void): this;
  on(
    event: "editSubtitleTrack",
    listener: (subtitleTrack: SubtitleTrack) => void,
  ): this;
}

// Assumptions:
// - EpisodeDetails.videoContainerCached is required to publish an episode.
export class InfoPage extends EventEmitter {
  private static LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS =
    12 * 60 * 60 * 1000;

  public body: HTMLElement;
  public backButton = new Ref<SimpleIconButton>();
  public episodeNameButton = new Ref<HTMLDivElement>();
  public episodeIndexButton = new Ref<HTMLDivElement>();
  public episodeDraftStateButton = new Ref<HTMLDivElement>();
  public episodePublishedStateButton = new Ref<HTMLDivElement>();
  public episodeUploadButton = new Ref<HTMLDivElement>();
  public episodeVideoCommitButton = new Ref<HTMLDivElement>();
  public videoTrackButtons = new Array<HTMLDivElement>();
  public audioTrackButtons = new Array<HTMLDivElement>();
  public subtitleTrackButtons = new Array<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    private seasonId: string,
    private episodeId: string,
    private now: () => number,
  ) {
    super();
    this.body = E.div({
      class: "episode-details-info-page",
      style: PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let { episode } = await this.serviceClient.send(
      newGetEpisodeRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
    this.body.append(
      E.div(
        {
          class: "episode-details-info-card",
          style: `${PAGE_MEDIUM_TOP_DOWN_CARD_STYLE} padding: ${ICON_BUTTON_L + 1}rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap; position: relative;`,
        },
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
        this.eUploadFooter(episode),
        ...this.eCommitBox(episode),
        ...this.eVideoPlayer(episode),
        ...(episode.videoContainer.videos.length === 0
          ? []
          : [
              E.div(
                {
                  class: "episode-details-video-tracks",
                  style: `margin-top: 3rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeVideoTracksTitle),
              ),
              E.div(
                {
                  class: "episode-details-video-tracks",
                  style: `width: 100%; box-sizing: border-box; padding: 1rem ${3 + ICON_M}rem 1rem 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: 1rem;`,
                },
                E.div(
                  {
                    class: "episode-details-video-track-state",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
                ),
                E.div(
                  {
                    class: "episode-details-video-track-duration-sec",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackVideoDurationLabel),
                ),
                E.div(
                  {
                    class: "episode-details-video-track-resolution",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackVideoResolutionLabel),
                ),
              ),
            ]),
        ...episode.videoContainer.videos.map((videoTrack) =>
          this.eVideoTrack(videoTrack),
        ),
        ...(episode.videoContainer.audios.length === 0
          ? []
          : [
              E.div(
                {
                  class: "episode-details-audio-tracks",
                  style: `margin-top: 3rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeAudioTracksTitle),
              ),
              E.div(
                {
                  class: "episode-details-audio-tracks",
                  style: `width: 100%; box-sizing: border-box; padding: 1rem ${3 + ICON_M}rem 1rem 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: 1rem;`,
                },
                E.div(
                  {
                    class: "episode-details-audio-track-state",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
                ),
                E.div(
                  {
                    class: "episode-details-audio-track-duration-sec",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackNameLabel),
                ),
                E.div(
                  {
                    class: "episode-details-audio-track-resolution",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel),
                ),
              ),
            ]),
        ...episode.videoContainer.audios.map((audioTrack) =>
          this.eAudioTrack(audioTrack),
        ),
        ...(episode.videoContainer.subtitles.length === 0
          ? []
          : [
              E.div(
                {
                  class: "episode-details-subtitle-tracks",
                  style: `margin-top: 3rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeSubtitleTracksTitle),
              ),
              E.div(
                {
                  class: "episode-details-subtitle-tracks",
                  style: `width: 100%; box-sizing: border-box; padding: 1rem ${3 + ICON_M}rem 1rem 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
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
        ...episode.videoContainer.subtitles.map((subtitleTrack) =>
          this.eSubtitleTrack(subtitleTrack),
        ),
      ),
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
    this.episodeVideoCommitButton.val?.addEventListener("click", () =>
      this.emit("commitVideo", episode),
    );
    this.emit("loaded");
  }

  private eStateButton(episode: EpisodeDetails): HTMLDivElement {
    switch (episode.state) {
      case EpisodeState.DRAFT:
        let clickable = Boolean(episode.videoContainerCached);
        let ele = eColumnBoxWithArrow(
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
            clickable,
            linesGap: 1,
          },
        );
        if (clickable) {
          this.episodeDraftStateButton.val = ele;
        }
        return ele;
      case EpisodeState.PUBLISHED:
        let premiered = episode.premiereTimeMs <= this.now();
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
                  `${premiered ? LOCALIZED_TEXT.seasonHasPremieredAt : LOCALIZED_TEXT.seasonPremieresAt}${formatPremiereTimeLong(episode.premiereTimeMs)}`,
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

  private eProcessingFailureText(failure: LastProcessingFailure): Text {
    let texts = [LOCALIZED_TEXT.seasonEpisodeFailedProcessingLabel];
    for (let reason of failure.reasons) {
      switch (reason) {
        case ProcessingFailureReason.AUDIO_CODEC_REQUIRES_AAC:
          texts.push(LOCALIZED_TEXT.seasonEpisodeAudioCodecRequiresAac);
          break;
        case ProcessingFailureReason.VIDEO_CODEC_REQUIRES_H264:
          texts.push(LOCALIZED_TEXT.seasonEpisodeVideoCodecRequiresH264);
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
    } else if (
      videoContainer.processing.media?.uploading ||
      videoContainer.processing.subtitle?.uploading
    ) {
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
      videoContainer.processing.media?.formatting ||
      videoContainer.processing.subtitle?.formatting
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

  private eUploadFooter(episode: EpisodeDetails): HTMLDivElement {
    if (
      episode.videoContainer.lastProcessingFailure &&
      episode.videoContainer.lastProcessingFailure.timeMs >
        this.now() - InfoPage.LASTING_TIME_TO_SHOW_PROCESSING_FAILURE_MS
    ) {
      return E.div(
        {
          class: "episode-details-video-container-failures",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        this.eProcessingFailureText(
          episode.videoContainer.lastProcessingFailure,
        ),
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

  private eCommitBox(episode: EpisodeDetails): Array<HTMLDivElement> {
    let pendingChanges =
      episode.videoContainer.videos.some((videoTrack) =>
        Boolean(videoTrack.staging),
      ) ||
      episode.videoContainer.audios.some((audioTrack) =>
        Boolean(audioTrack.staging),
      ) ||
      episode.videoContainer.subtitles.some((subtitleTrack) =>
        Boolean(subtitleTrack.staging),
      );
    if (episode.videoContainer.masterPlaylist.synced) {
      if (!pendingChanges && !episode.videoContainerCached) {
        return [];
      }
      let ele = eColumnBoxWithArrow(
        [
          E.div(
            {
              class: "episode-details-video-container-version",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              !episode.videoContainerCached
                ? LOCALIZED_TEXT.seasonEpisodeNoVersion
                : `${LOCALIZED_TEXT.seasonEpisodeCommittedVersionLabel[0]}${episode.videoContainer.masterPlaylist.synced.version}${LOCALIZED_TEXT.seasonEpisodeCommittedVersionLabel[1]}`,
            ),
          ),
          E.div(
            {
              class: "episode-details-video-container-version-footer",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              !pendingChanges
                ? LOCALIZED_TEXT.seasonEpisodeCommittedVersionNoChangesFooter
                : LOCALIZED_TEXT.seasonEpisodeCommittedVersionPendingChangesFooter,
            ),
          ),
        ],
        {
          clickable: pendingChanges,
          linesGap: 1,
          customeStyle: `margin-top: 2rem;`,
        },
      );
      if (pendingChanges) {
        this.episodeVideoCommitButton.val = ele;
      }
      return [ele];
    } else if (
      episode.videoContainer.masterPlaylist.writingToFile ||
      episode.videoContainer.masterPlaylist.syncing
    ) {
      let version =
        episode.videoContainer.masterPlaylist.syncing?.version ||
        episode.videoContainer.masterPlaylist.writingToFile?.version;
      let ele = eColumnBoxWithArrow(
        [
          E.div(
            {
              class: "episode-details-video-container-version",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeCommittingVersionLabel[0]}${version}${LOCALIZED_TEXT.seasonEpisodeCommittingVersionLabel[1]}`,
            ),
          ),
          E.div(
            {
              class: "episode-details-video-container-version-footer",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              !pendingChanges
                ? !episode.videoContainerCached
                  ? LOCALIZED_TEXT.seasonEpisodeCommittingFirstVersionLabel
                  : LOCALIZED_TEXT.seasonEpisodeCommittingVersionNoMoreChangesFooter
                : LOCALIZED_TEXT.seasonEpisodeCommittingVersionNewPendingChangesFooter,
            ),
          ),
        ],
        {
          clickable: pendingChanges,
          linesGap: 1,
          customeStyle: `margin-top: 2rem;`,
        },
      );
      if (pendingChanges) {
        this.episodeVideoCommitButton.val = ele;
      }
      return [ele];
    } else {
      throw new Error(
        `Not handled: ${JSON.stringify(episode.videoContainer.masterPlaylist)}`,
      );
    }
  }

  private eVideoPlayer(episode: EpisodeDetails): Array<HTMLElement> {
    if (!episode.videoUrl) {
      return [];
    }
    let video = E.video({
      class: "episode-details-video-player",
      style: `margin-top: 2rem; width: 100%; object-fit: contain;`,
      controls: "true",
    });
    let hls = new Hls();
    hls.loadSource(episode.videoUrl);
    hls.attachMedia(video);
    return [video];
  }

  private eVideoTrack(videoTrack: VideoTrack): HTMLDivElement {
    let ele = E.div(
      {
        class: "episode-details-video-track",
        style: `cursor: pointer; width: 100%; box-sizing: border-box; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 2rem;`,
      },
      E.div(
        {
          class: "episode-details-video-data-line",
          style: `flex: 1 0 0; display: flex; flex-flow: row nowrap; gap: 2rem; justify-content: space-between;`,
        },
        E.div(
          {
            class: "episode-details-video-track-state",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
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
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};${videoTrack.staging?.toDelete ? " text-decoration: line-through;" : ""}`,
          },
          E.text(`${formatSecondsAsHHMMSS(videoTrack.durationSec)}`),
        ),
        E.div(
          {
            class: "episode-details-video-track-resolution",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};${videoTrack.staging?.toDelete ? " text-decoration: line-through;" : ""}`,
          },
          E.text(`${videoTrack.resolution}`),
        ),
      ),
      E.div(
        {
          class: "episode-details-video-track-expand-icon",
          style: `flex: 0 0 auto; width: ${ICON_M}rem; height: ${ICON_M}rem; transform: rotate(180deg);`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    );
    this.videoTrackButtons.push(ele);
    ele.addEventListener("click", () =>
      this.emit("editVideoTrack", videoTrack),
    );
    return ele;
  }

  private eAudioTrack(audioTrack: AudioTrack): HTMLDivElement {
    let ele = E.div(
      {
        class: "episode-details-audio-track",
        style: `cursor: pointer; width: 100%; box-sizing: border-box; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 2rem;`,
      },
      E.div(
        {
          class: "episode-details-audio-data-line",
          style: `flex: 1 0 0; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "episode-details-audio-track-state",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
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
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
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
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; display: flex; flex-flow: row nowrap; gap: .5rem;`,
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
      ),
      E.div(
        {
          class: "episode-details-audio-track-expand-icon",
          style: `flex: 0 0 auto; width: ${ICON_M}rem; height: ${ICON_M}rem; transform: rotate(180deg);`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    );
    this.audioTrackButtons.push(ele);
    ele.addEventListener("click", () =>
      this.emit("editAudioTrack", audioTrack),
    );
    return ele;
  }

  private eSubtitleTrack(subtitleTrack: SubtitleTrack): HTMLDivElement {
    let ele = E.div(
      {
        class: "episode-details-subtitle-track",
        style: `cursor: pointer; width: 100%; box-sizing: border-box; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 2rem;`,
      },
      E.div(
        {
          class: "episode-details-subtitle-data-line",
          style: `flex: 1 0 0; display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem;`,
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
      ),
      E.div(
        {
          class: "episode-details-subtitle-track-expand-icon",
          style: `flex: 0 0 auto; width: ${ICON_M}rem; height: ${ICON_M}rem; transform: rotate(180deg);`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    );
    this.subtitleTrackButtons.push(ele);
    ele.addEventListener("click", () =>
      this.emit("editSubtitleTrack", subtitleTrack),
    );
    return ele;
  }

  public remove(): void {
    this.body.remove();
  }
}
