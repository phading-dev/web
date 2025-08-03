import EventEmitter = require("events");
import {
  BlockingButton,
  FilledButton,
  IconButton,
  TextButton,
  createBackButton,
} from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import {
  createCrossIcon,
  createEditIcon,
  createLineArrowIcon,
  createSwitchIcon,
  createTrashCanIcon,
} from "../../../../common/icons";
import { COMMON_BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  eFormTitle,
  ePageWithCenterForm,
} from "../../../../common/page_elements";
import {
  BORDER_WIDTH_1,
  FONT_M,
  FONT_WEIGHT_600,
  GAP_2X,
  GAP_d_25X,
  GAP_d_5X,
  ICON_BUTTON_M,
  ICON_L,
  ICON_M,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import {
  MAX_AUDIO_TRACK_NAME_LENGTH,
  MAX_SUBTITLE_TRACK_NAME_LENGTH,
} from "@phading/constants/show";
import {
  newCommitEpisodeStagingDataRequest,
  newSaveEpisodeStagingDataRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import {
  CommitEpisodeStagingDataResponse,
  SaveEpisodeStagingDataResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ValidationError } from "@phading/video_service_interface/node/validation_error";
import {
  AUDIO_TRACK,
  AudioTrack,
  SUBTITLE_TRACK,
  VIDEO_TRACK,
  VideoContainer,
  VideoTrack,
} from "@phading/video_service_interface/node/video_container";
import {
  AUDIO_TRACK_STAGING_DATA,
  AudioTrackStagingData,
  SUBTITLE_TRACK_STAGING_DATA,
  VIDEO_TRACK_STAGING_DATA,
  VideoTrackStagingData,
} from "@phading/video_service_interface/node/video_container_staging_data";
import { E } from "@selfage/element/factory";
import { copyMessage } from "@selfage/message/copier";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

function eTransitionArrow(): HTMLDivElement {
  return E.div(
    {
      class: "update-tracks-arrow-icon",
      style: `width: ${ICON_L}rem; height: ${ICON_L}rem; transform: rotate(-90deg);`,
    },
    createLineArrowIcon(SCHEME.neutral1),
  );
}

export interface VideoTrackEditor {
  on(event: "change", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
}

export class VideoTrackEditor extends EventEmitter {
  public body: HTMLDivElement;
  private transitionArrowLine = new Ref<HTMLDivElement>();
  public deleteTrackButton = new Ref<IconButton>();
  private pendingValuesLine = new Ref<HTMLDivElement>();
  public dropStagingButton = new Ref<IconButton>();
  public videoTrack: VideoTrack = {};

  public constructor(videoTrack: VideoTrack) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: column nowrap;`,
    });
    this.videoTrack = copyMessage(videoTrack, VIDEO_TRACK);
    this.videoTrack.staging = undefined; // Only copy non-staging values
    if (this.videoTrack.committed) {
      this.body.append(
        E.div(
          {
            class: "update-tracks-video-committed-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-video-committed-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-committed-duration",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-committed-resolution",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(this.videoTrack.resolution),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          assign(
            this.deleteTrackButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createTrashCanIcon("currentColor"),
            ),
          ).body,
        ),
        E.divRef(
          this.transitionArrowLine,
          {
            class: "update-tracks-video-transition-arrow-line",
            style: `display: none; flex-flow: row nowrap;`,
          },
          E.div(
            {
              class: "update-tracks-video-committed-state-hidden",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; visibility: hidden;`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          eTransitionArrow(),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-committed-resolution-hidden",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; visibility: hidden;`,
            },
            E.text(this.videoTrack.resolution),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X + ICON_BUTTON_M}rem;`,
          }),
        ),
      );
      this.deleteTrackButton.val.addAction(() => this.deleteTrack());
    }
    this.applyNewStaging(videoTrack.staging);
  }

  private applyNewStaging(newStaging: VideoTrackStagingData): void {
    if (!this.videoTrack.staging?.toDelete && newStaging?.toDelete) {
      this.deleteTrackButton.val.disable();
      this.transitionArrowLine.val.style.display = "flex";
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-video-deleting-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-video-deleting-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-deleting-duration",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
            },
            E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-deleting-resolution",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
            },
            E.text(this.videoTrack.resolution),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon(SCHEME.neutral1),
            ),
          ).body,
        ),
      );
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.videoTrack.staging?.toDelete && !newStaging?.toDelete) {
      this.deleteTrackButton.val.enable();
      this.transitionArrowLine.val.style.display = "none";
      this.pendingValuesLine.val.remove();
    }

    if (!this.videoTrack.staging?.toAdd && newStaging?.toAdd) {
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "flex";
      }
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-video-adding-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-video-adding-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.videoTrack.committed
                ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
            ),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-adding-duration",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-video-adding-resolution",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(this.videoTrack.resolution),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon(SCHEME.neutral1),
            ),
          ).body,
        ),
      );
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.videoTrack.staging?.toAdd && !newStaging?.toAdd) {
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "none";
      }
      this.pendingValuesLine.val.remove();
    }
    this.videoTrack.staging = newStaging;
  }

  private deleteTrack(): void {
    let newStaging = copyMessage(
      this.videoTrack.staging,
      VIDEO_TRACK_STAGING_DATA,
    );
    newStaging = {
      toDelete: true,
    };
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private dropStaging(): void {
    this.applyNewStaging(undefined);
    if (!this.videoTrack.committed) {
      // Assumes (!this.videoTrack.staging) to be true
      this.emit("delete");
    } else {
      this.emit("change");
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}

export interface AudioTrackEditor {
  on(event: "change", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
}

export class AudioTrackEditor extends EventEmitter {
  public body: HTMLDivElement;
  private transitionArrowLine = new Ref<HTMLDivElement>();
  public editTrackButton = new Ref<IconButton>();
  public deleteTrackButton = new Ref<IconButton>();
  private pendingValuesLine = new Ref<HTMLDivElement>();
  public dropStagingButton = new Ref<IconButton>();
  public nameInput = new Ref<HTMLInputElement>();
  public isDefaultToggleButton = new Ref<HTMLDivElement>();
  private isDefaultText = new Ref<HTMLDivElement>();
  public audioTrack: AudioTrack = {};

  public constructor(audioTrack: AudioTrack) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: column nowrap;`,
    });
    this.audioTrack = copyMessage(audioTrack, AUDIO_TRACK);
    this.audioTrack.staging = undefined; // Only copy non-staging values
    if (this.audioTrack.committed) {
      this.body.append(
        E.div(
          {
            class: "update-tracks-audio-committed-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-audio-committed-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-audio-committed-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(this.audioTrack.committed.name),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-audio-committed-default",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.audioTrack.committed.isDefault
                ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          assign(
            this.editTrackButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createEditIcon("currentColor"),
            ),
          ).body,
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_25X}rem;`,
          }),
          assign(
            this.deleteTrackButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createTrashCanIcon("currentColor"),
            ),
          ).body,
        ),
        E.divRef(
          this.transitionArrowLine,
          {
            class: "update-tracks-audio-transition-arrow-line",
            style: `display: none; flex-flow: row nowrap;`,
          },
          E.div(
            {
              class: "update-tracks-audio-committed-state-hidden",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; visibility: hidden;`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          eTransitionArrow(),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-audio-committed-default-hidden",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; visibility: hidden;`,
            },
            E.text(
              this.audioTrack.committed.isDefault
                ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M * 2}rem;`,
          }),
        ),
      );
      this.editTrackButton.val.addAction(() => this.editTrack());
      this.deleteTrackButton.val.addAction(() => this.deleteTrack());
    }
    this.applyNewStaging(audioTrack.staging);
  }

  private applyNewStaging(newStaging?: AudioTrackStagingData): void {
    if (!this.audioTrack.staging?.toDelete && newStaging?.toDelete) {
      this.editTrackButton.val.disable();
      this.deleteTrackButton.val.disable();
      this.transitionArrowLine.val.style.display = "flex";
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-audio-deleting-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-audio-deleting-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-audio-deleting-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
            },
            E.text(this.audioTrack.committed.name),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-audio-deleting-default",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
            },
            E.text(
              this.audioTrack.committed.isDefault
                ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon("currentColor"),
            ),
          ).body,
        ),
      );
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.audioTrack.staging?.toDelete && !newStaging?.toDelete) {
      this.editTrackButton.val.enable();
      this.deleteTrackButton.val.enable();
      this.transitionArrowLine.val.style.display = "none";
      this.pendingValuesLine.val.remove();
    }

    if (!this.audioTrack.staging?.toAdd && newStaging?.toAdd) {
      this.editTrackButton.val?.disable();
      this.deleteTrackButton.val?.disable();
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "flex";
      }
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-audio-adding-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-audio-adding-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.audioTrack.committed
                ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
            ),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.inputRef(this.nameInput, {
            class: "update-tracks-audio-adding-name",
            style: `${COMMON_BASIC_INPUT_STYLE} width: 40%; text-align: center;`,
            value: newStaging.toAdd.name,
            maxlength: `${MAX_AUDIO_TRACK_NAME_LENGTH}`,
          }),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.divRef(
            this.isDefaultToggleButton,
            {
              class: "update-tracks-audio-default-button",
              style: `cursor: pointer; box-sizing: border-box; height: ${ICON_BUTTON_M}rem; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_d_25X}rem;`,
            },
            E.divRef(
              this.isDefaultText,
              {
                class: "update-tracks-audio-adding-default",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                newStaging.toAdd.isDefault
                  ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
                  : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue,
              ),
            ),
            E.div(
              {
                class: "update-tracks-audio-adding-default-switch-icon",
                style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
              },
              createSwitchIcon(SCHEME.neutral1),
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon("currentColor"),
            ),
          ).body,
        ),
      );
      this.nameInput.val.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
        }
      });
      this.nameInput.val.addEventListener("change", () => this.changeName());
      this.isDefaultToggleButton.val.addEventListener("click", () =>
        this.toggleDefaultValue(),
      );
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.audioTrack.staging?.toAdd && !newStaging?.toAdd) {
      this.editTrackButton.val?.enable();
      this.deleteTrackButton.val?.enable();
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "none";
      }
      this.pendingValuesLine.val.remove();
    }
    this.audioTrack.staging = newStaging;
  }

  private editTrack(): void {
    let newStaging = copyMessage(
      this.audioTrack.staging,
      AUDIO_TRACK_STAGING_DATA,
    );
    newStaging = {
      toAdd: {
        name: this.audioTrack.committed.name,
        isDefault: this.audioTrack.committed.isDefault,
      },
    };
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private deleteTrack(): void {
    let newStaging = copyMessage(
      this.audioTrack.staging,
      AUDIO_TRACK_STAGING_DATA,
    );
    newStaging = {
      toDelete: true,
    };
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private dropStaging(): void {
    this.applyNewStaging(undefined);
    if (!this.audioTrack.committed) {
      // Assumes (!this.audioTrack.staging) to be true
      this.emit("delete");
    } else {
      this.emit("change");
    }
  }

  private changeName(): void {
    this.nameInput.val.value = this.nameInput.val.value.trim();
    if (this.nameInput.val.value.length > MAX_AUDIO_TRACK_NAME_LENGTH) {
      this.nameInput.val.value = this.nameInput.val.value.substring(
        0,
        MAX_AUDIO_TRACK_NAME_LENGTH,
      );
    }
    let newStaging = copyMessage(
      this.audioTrack.staging,
      AUDIO_TRACK_STAGING_DATA,
    );
    newStaging.toAdd.name = this.nameInput.val.value;
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private toggleDefaultValue(): void {
    let newStaging = copyMessage(
      this.audioTrack.staging,
      AUDIO_TRACK_STAGING_DATA,
    );
    newStaging.toAdd.isDefault = !newStaging.toAdd.isDefault;
    this.isDefaultText.val.textContent = newStaging.toAdd.isDefault
      ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultYesValue
      : LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultNoValue;
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}

export interface SubtitleTrackEditor {
  on(event: "change", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
}

export class SubtitleTrackEditor extends EventEmitter {
  public body: HTMLDivElement;
  private transitionArrowLine = new Ref<HTMLDivElement>();
  public editTrackButton = new Ref<IconButton>();
  public deleteTrackButton = new Ref<IconButton>();
  private pendingValuesLine = new Ref<HTMLDivElement>();
  public dropStagingButton = new Ref<IconButton>();
  public nameInput = new Ref<HTMLInputElement>();
  public subtitleTrack: any = {};

  public constructor(subtitleTrack: any) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: column nowrap;`,
    });
    this.subtitleTrack = copyMessage(subtitleTrack, SUBTITLE_TRACK);
    this.subtitleTrack.staging = undefined; // Only copy non-staging values
    if (this.subtitleTrack.committed) {
      this.body.append(
        E.div(
          {
            class: "update-tracks-subtitle-committed-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-subtitle-committed-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-subtitle-committed-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(this.subtitleTrack.committed.name),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          assign(
            this.editTrackButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createEditIcon("currentColor"),
            ),
          ).body,
          E.div({
            style: `flex: 0 0 auto; width: ${GAP_d_25X}rem;`,
          }),
          assign(
            this.deleteTrackButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createTrashCanIcon("currentColor"),
            ),
          ).body,
        ),
        E.divRef(
          this.transitionArrowLine,
          {
            class: "update-tracks-subtitle-transition-arrow-line",
            style: `display: none; flex-flow: row nowrap;`,
          },
          E.div(
            {
              class: "update-tracks-subtitle-committed-state-hidden",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; visibility: hidden;`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          eTransitionArrow(),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M * 2}rem;`,
          }),
        ),
      );
      this.editTrackButton.val.addAction(() => this.editTrack());
      this.deleteTrackButton.val.addAction(() => this.deleteTrack());
    }
    this.applyNewStaging(subtitleTrack.staging);
  }

  private applyNewStaging(newStaging?: any): void {
    if (!this.subtitleTrack.staging?.toDelete && newStaging?.toDelete) {
      this.editTrackButton.val.disable();
      this.deleteTrackButton.val.disable();
      this.transitionArrowLine.val.style.display = "flex";
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-subtitle-deleting-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-subtitle-deleting-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.div(
            {
              class: "update-tracks-subtitle-deleting-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
            },
            E.text(this.subtitleTrack.committed.name),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon("currentColor"),
            ),
          ).body,
        ),
      );
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.subtitleTrack.staging?.toDelete && !newStaging?.toDelete) {
      this.editTrackButton.val.enable();
      this.deleteTrackButton.val.enable();
      this.transitionArrowLine.val.style.display = "none";
      this.pendingValuesLine.val.remove();
    }

    if (!this.subtitleTrack.staging?.toAdd && newStaging?.toAdd) {
      this.editTrackButton.val?.disable();
      this.deleteTrackButton.val?.disable();
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "flex";
      }
      this.body.append(
        E.divRef(
          this.pendingValuesLine,
          {
            class: "update-tracks-subtitle-adding-values",
            style: `display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "update-tracks-subtitle-adding-state",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              this.subtitleTrack.committed
                ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
            ),
          ),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
          }),
          E.inputRef(this.nameInput, {
            class: "update-tracks-subtitle-adding-name",
            style: `${COMMON_BASIC_INPUT_STYLE} width: max(40%, 14rem); text-align: center;`,
            value: newStaging.toAdd.name,
            maxlength: `${MAX_SUBTITLE_TRACK_NAME_LENGTH}`,
          }),
          E.div({
            style: `flex: 1 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M}rem;`,
          }),
          assign(
            this.dropStagingButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_M,
              createCrossIcon("currentColor"),
            ),
          ).body,
        ),
      );
      this.nameInput.val.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
        }
      });
      this.nameInput.val.addEventListener("change", () => this.changeName());
      this.dropStagingButton.val.addAction(() => this.dropStaging());
    }
    if (this.subtitleTrack.staging?.toAdd && !newStaging?.toAdd) {
      this.editTrackButton.val?.enable();
      this.deleteTrackButton.val?.enable();
      if (this.transitionArrowLine.val) {
        this.transitionArrowLine.val.style.display = "none";
      }
      this.pendingValuesLine.val.remove();
    }
    this.subtitleTrack.staging = newStaging;
  }

  private editTrack(): void {
    let newStaging = copyMessage(
      this.subtitleTrack.staging,
      SUBTITLE_TRACK_STAGING_DATA,
    );
    newStaging = {
      toAdd: {
        name: this.subtitleTrack.committed.name,
      },
    };
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private deleteTrack(): void {
    let newStaging = copyMessage(
      this.subtitleTrack.staging,
      SUBTITLE_TRACK_STAGING_DATA,
    );
    newStaging = {
      toDelete: true,
    };
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  private dropStaging(): void {
    this.applyNewStaging(undefined);
    if (!this.subtitleTrack.committed) {
      // Assumes (!this.subtitleTrack.staging) to be true
      this.emit("delete");
    } else {
      this.emit("change");
    }
  }

  private changeName(): void {
    this.nameInput.val.value = this.nameInput.val.value.trim();
    if (this.nameInput.val.value.length > MAX_SUBTITLE_TRACK_NAME_LENGTH) {
      this.nameInput.val.value = this.nameInput.val.value.substring(
        0,
        MAX_SUBTITLE_TRACK_NAME_LENGTH,
      );
    }
    let newStaging = copyMessage(
      this.subtitleTrack.staging,
      SUBTITLE_TRACK_STAGING_DATA,
    );
    newStaging.toAdd.name = this.nameInput.val.value;
    this.applyNewStaging(newStaging);
    this.emit("change");
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}

export interface UpdateTracksPage {
  on(event: "back", listener: () => void): this;
  on(event: "saved", listener: () => void): this;
  on(event: "committed", listener: () => void): this;
}

export class UpdateTracksPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    videoContainer: VideoContainer,
  ): UpdateTracksPage {
    return new UpdateTracksPage(
      SERVICE_CLIENT,
      seasonId,
      episodeId,
      videoContainer,
    );
  }

  public body: HTMLDivElement;
  public backButton = new Ref<IconButton>();
  public saveStagingButton = new Ref<
    BlockingButton<SaveEpisodeStagingDataResponse>
  >();
  public commitStagingButton = new Ref<
    BlockingButton<CommitEpisodeStagingDataResponse>
  >();
  public videoTrackEditors = new Array<VideoTrackEditor>();
  public audioTrackEditors = new Array<AudioTrackEditor>();
  public subtitleTrackEditors = new Array<SubtitleTrackEditor>();
  private actionError = new Ref<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
    public episodeId: string,
    public videoContainer: VideoContainer,
  ) {
    super();
    this.body = ePageWithCenterForm(
      new Ref(),
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; display: flex; flex-flow: column nowrap;`,
      assign(this.backButton, createBackButton()).body,
      eFormTitle(LOCALIZED_TEXT.updateTracksTitle),
      ...(videoContainer.videos.length === 0
        ? []
        : [
            E.div(
              {
                class: "update-tracks-videos-title",
                style: `margin-top: ${GAP_2X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeVideoTracksTitle),
            ),
            E.div(
              {
                class: "update-tracks-videos-header",
                style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center;`,
              },
              E.div(
                {
                  class: "update-tracks-video-state",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
              }),
              E.div(
                {
                  class: "update-tracks-video-duration-sec",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackVideoDurationLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
              }),
              E.div(
                {
                  class: "update-tracks-video-resolution",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackVideoResolutionLabel),
              ),
              E.div({
                style: `flex: 0 0 auto; width: ${GAP_d_5X + ICON_BUTTON_M}rem;`,
              }),
            ),
          ]),
      ...videoContainer.videos.map((videoTrack) =>
        this.createVideoTrackEditor(videoTrack),
      ),
      ...(videoContainer.audios.length === 0
        ? []
        : [
            E.div(
              {
                class: "update-tracks-audio-tracks-title",
                style: `margin-top: ${GAP_2X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeAudioTracksTitle),
            ),
            E.div(
              {
                class: "update-tracks-audio-tracks-header",
                style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center;`,
              },
              E.div(
                {
                  class: "update-tracks-audio-state",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
              }),
              E.div(
                {
                  class: "update-tracks-audio-name-label",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackNameLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
              }),
              E.div(
                {
                  class: "update-tracks-audio-default-label",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel),
              ),
              E.div({
                style: `flex: 0 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M * 2}rem;`,
              }),
            ),
          ]),
      ...videoContainer.audios.map((audioTrack) =>
        this.createAudioTrackEditor(audioTrack),
      ),
      ...(videoContainer.subtitles.length === 0
        ? []
        : [
            E.div(
              {
                class: "update-tracks-subtitle-tracks-title",
                style: `margin-top: ${GAP_2X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0}; text-align: center;`,
              },
              E.text(LOCALIZED_TEXT.seasonEpisodeSubtitleTracksTitle),
            ),
            E.div(
              {
                class: "update-tracks-subtitle-tracks-header",
                style: `width: 100%; box-sizing: border-box; padding: ${GAP_d_25X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; align-items: center;`,
              },
              E.div(
                {
                  class: "update-tracks-subtitle-state",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X}rem;`,
              }),
              E.div(
                {
                  class: "update-tracks-subtitle-name-label",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonEpisodeTrackNameLabel),
              ),
              E.div({
                style: `flex: 1 0 auto; width: ${GAP_d_5X + GAP_d_25X + ICON_BUTTON_M * 2}rem;`,
              }),
            ),
          ]),
      ...videoContainer.subtitles.map((subtitleTrack) =>
        this.createSubtitleTrackEditor(subtitleTrack),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "update-tracks-video-actions",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_d_5X}rem;`,
        },
        E.divRef(this.actionError, {
          class: "update-tracks-action-error",
          style: `display: none; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0}; text-align: center; self-align: center;`,
        }),
        assign(
          this.commitStagingButton,
          new BlockingButton<CommitEpisodeStagingDataResponse>(
            new FilledButton(`width: 100%;`).append(
              E.text(LOCALIZED_TEXT.commitTrackChangesButtonLabel),
            ),
          ),
        ).body,
        assign(
          this.saveStagingButton,
          new BlockingButton<SaveEpisodeStagingDataResponse>(
            new TextButton(`width: 100%;`).append(
              E.text(LOCALIZED_TEXT.saveTrackChangesButtonLabel),
            ),
          ),
        ).body,
      ),
    );
    this.backButton.val.addAction(() => this.emit("back"));

    this.refreshActions();
    this.saveStagingButton.val.addAction(
      () => this.saveStagingChanges(),
      (error, response) => this.postSaveStagingChanges(error, response),
    );
    this.commitStagingButton.val.addAction(
      () => this.commitStagingChanges(),
      (error, response) => this.postCommitStagingChanges(error, response),
    );
  }

  private createVideoTrackEditor(videoTrack: VideoTrack): HTMLDivElement {
    let videoTrackEditor = new VideoTrackEditor(videoTrack)
      .on("change", () => this.refreshActions())
      .on("delete", () => {
        videoTrackEditor.remove();
        this.refreshActions();
      });
    this.videoTrackEditors.push(videoTrackEditor);
    return videoTrackEditor.body;
  }

  private createAudioTrackEditor(audioTrack: AudioTrack): HTMLDivElement {
    let audioTrackEditor = new AudioTrackEditor(audioTrack)
      .on("change", () => this.refreshActions())
      .on("delete", () => {
        audioTrackEditor.remove();
        this.refreshActions();
      });
    this.audioTrackEditors.push(audioTrackEditor);
    return audioTrackEditor.body;
  }

  private createSubtitleTrackEditor(subtitleTrack: any): HTMLDivElement {
    let subtitleTrackEditor = new SubtitleTrackEditor(subtitleTrack)
      .on("change", () => this.refreshActions())
      .on("delete", () => {
        subtitleTrackEditor.remove();
        this.refreshActions();
      });
    this.subtitleTrackEditors.push(subtitleTrackEditor);
    return subtitleTrackEditor.body;
  }

  private refreshActions(): void {
    let withStaging =
      this.videoTrackEditors.some(
        (videoTrackEditor) => videoTrackEditor.videoTrack.staging,
      ) ||
      this.audioTrackEditors.some(
        (audioTrackEditor) => audioTrackEditor.audioTrack.staging,
      ) ||
      this.subtitleTrackEditors.some(
        (subtitleTrackEditor) => subtitleTrackEditor.subtitleTrack.staging,
      );
    if (withStaging) {
      this.commitStagingButton.val.enable();
    } else {
      this.commitStagingButton.val.disable();
    }
  }

  private saveStagingChanges(): Promise<SaveEpisodeStagingDataResponse> {
    this.actionError.val.style.display = "none";
    return this.serviceClient.send(
      newSaveEpisodeStagingDataRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        videoContainer: {
          videos: this.videoTrackEditors.map((editor) => editor.videoTrack),
          audios: this.audioTrackEditors.map((editor) => editor.audioTrack),
          subtitles: this.subtitleTrackEditors.map(
            (editor) => editor.subtitleTrack,
          ),
        },
      }),
    );
  }

  private postSaveStagingChanges(
    error?: Error,
    response?: SaveEpisodeStagingDataResponse,
  ): void {
    let errorMsg = "";
    if (error) {
      errorMsg = LOCALIZED_TEXT.saveEpisodeTracksGenericError;
    } else if (response.error) {
      errorMsg = this.getErrorMessage(response.error);
    }
    if (errorMsg) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = errorMsg;
    } else {
      this.emit("back");
    }
    this.emit("saved");
  }

  private commitStagingChanges(): Promise<CommitEpisodeStagingDataResponse> {
    this.actionError.val.style.display = "none";
    return this.serviceClient.send(
      newCommitEpisodeStagingDataRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        videoContainer: {
          videos: this.videoTrackEditors.map((editor) => editor.videoTrack),
          audios: this.audioTrackEditors.map((editor) => editor.audioTrack),
          subtitles: this.subtitleTrackEditors.map(
            (editor) => editor.subtitleTrack,
          ),
        },
      }),
    );
  }

  private postCommitStagingChanges(
    error?: Error,
    response?: CommitEpisodeStagingDataResponse,
  ): void {
    let errorMsg = "";
    if (error) {
      errorMsg = LOCALIZED_TEXT.commitEpisodeTracksGenericError;
    } else if (response.error) {
      errorMsg = this.getErrorMessage(response.error);
    }
    if (errorMsg) {
      this.actionError.val.style.display = "block";
      this.actionError.val.textContent = errorMsg;
    } else {
      this.emit("back");
    }
    this.emit("committed");
  }

  private getErrorMessage(validationError: ValidationError): string {
    switch (validationError) {
      case ValidationError.TRACK_MISMATCH:
        return LOCALIZED_TEXT.updateEpisodeTracksTrackMismatchError;
      case ValidationError.NO_VIDEO_TRACK:
        return LOCALIZED_TEXT.updateEpisodeTracksNoVideoError;
      case ValidationError.MORE_THAN_ONE_VIDEO_TRACKS:
        return LOCALIZED_TEXT.updateEpisodeTracksMoreThanOneVideoError;
      case ValidationError.TOO_MANY_AUDIO_TRACKS:
        return LOCALIZED_TEXT.updateEpisodeTracksTooManyAudioError;
      case ValidationError.NO_DEFAULT_AUDIO_TRACK:
        return LOCALIZED_TEXT.updateEpisodeTracksNoDefaultAudioError;
      case ValidationError.MORE_THAN_ONE_DEFAULT_AUDIO_TRACKS:
        return LOCALIZED_TEXT.updateEpisodeTracksMoreThanOneDefaultAudioError;
      case ValidationError.TOO_MANY_SUBTITLE_TRACKS:
        return LOCALIZED_TEXT.updateEpisodeTracksTooManySubtitleError;
      default:
        throw new Error(`Unhandled error: ${ValidationError[validationError]}`);
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
