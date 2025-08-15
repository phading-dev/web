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
  createBoxIcon,
  createCheckedBoxIcon,
  createCrossIcon,
  createEditIcon,
  createTrashCanIcon,
} from "../../../../common/icons";
import { COMMON_BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  eCenteredTitle,
  ePageWithCenterForm,
} from "../../../../common/page_elements";
import { TabSwitcher } from "../../../../common/page_navigator";
import { getRootFontSize } from "../../../../common/root_font_size";
import {
  BORDER_WIDTH_1,
  FONT_M,
  FONT_WEIGHT_600,
  GAP_0_5X,
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
  AudioTrack,
  SubtitleTrack,
  VideoContainer,
  VideoTrack,
} from "@phading/video_service_interface/node/video_container";
import {
  AUDIO_TRACK_STAGING_DATA,
  AudioTrackStagingData,
  SUBTITLE_TRACK_STAGING_DATA,
  SubtitleTrackStagingData,
  VideoTrackStagingData,
} from "@phading/video_service_interface/node/video_container_staging_data";
import { E } from "@selfage/element/factory";
import { copyMessage } from "@selfage/message/copier";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

let STATE_WIDTH = 5; // rem

export interface VideoTrackEditor {
  on(event: "change", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
}

export class VideoTrackEditor extends EventEmitter {
  public body: HTMLDivElement;
  private committedLine = new Ref<HTMLDivElement>();
  private addingLine = new Ref<HTMLDivElement>();
  private deletingLine = new Ref<HTMLDivElement>();
  public deleteTrackButton = new Ref<IconButton>();
  public dropStagingButton = new Ref<IconButton>();
  private lineSwitcher = new TabSwitcher();

  public constructor(public videoTrack: VideoTrack) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; display: flex;`,
    });
    this.applyNewStaging(this.videoTrack.staging);
  }

  public setHorizontal(): this {
    this.body.style.flexFlow = "row nowrap";
    this.body.style.alignItems = "center";
    return this;
  }

  public setVertical(): this {
    this.body.style.flexFlow = "column nowrap";
    this.body.style.alignItems = "flex-end";
    return this;
  }

  private applyNewStaging(newStaging?: VideoTrackStagingData): void {
    this.videoTrack.staging = newStaging;
    if (
      !this.videoTrack.staging?.toAdd &&
      !this.videoTrack.staging?.toDelete &&
      this.videoTrack.committed
    ) {
      if (!this.committedLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.committedLine,
                {
                  class: "update-tracks-video-committed-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-video-committed-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-video-committed-resolution",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(this.videoTrack.resolution),
                ),
                E.div(
                  {
                    class: "update-tracks-video-committed-duration",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
                ),
              ),
              assign(
                this.deleteTrackButton,
                new IconButton(
                  ICON_BUTTON_M,
                  ICON_L,
                  createTrashCanIcon("currentColor"),
                ),
              ).body,
            );
            this.deleteTrackButton.val.addAction(() => this.deleteTrack());
          },
          () => {
            this.committedLine.val.remove();
            this.committedLine.val = undefined;
            this.deleteTrackButton.val.remove();
          },
        );
      }
    }

    if (this.videoTrack.staging?.toDelete) {
      if (!this.deletingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.deletingLine,
                {
                  class: "update-tracks-video-deleting-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-video-deleting-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-video-deleting-resolution",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
                  },
                  E.text(this.videoTrack.resolution),
                ),
                E.div(
                  {
                    class: "update-tracks-video-deleting-duration",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
                  },
                  E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
                ),
              ),
              assign(
                this.dropStagingButton,
                new IconButton(
                  ICON_BUTTON_M,
                  ICON_M,
                  createCrossIcon(SCHEME.neutral1),
                ),
              ).body,
            );
            this.dropStagingButton.val.addAction(() => this.dropStaging());
          },
          () => {
            this.deletingLine.val.remove();
            this.deletingLine.val = undefined;
            this.dropStagingButton.val.remove();
          },
        );
      }
    }

    if (this.videoTrack.staging?.toAdd) {
      if (!this.addingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.addingLine,
                {
                  class: "update-tracks-video-adding-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-video-adding-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    this.videoTrack.committed
                      ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                      : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
                  ),
                ),
                E.div(
                  {
                    class: "update-tracks-video-adding-resolution",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(this.videoTrack.resolution),
                ),
                E.div(
                  {
                    class: "update-tracks-video-adding-duration",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(formatSecondsAsHHMMSS(this.videoTrack.durationSec)),
                ),
              ),
              assign(
                this.dropStagingButton,
                new IconButton(
                  ICON_BUTTON_M,
                  ICON_M,
                  createCrossIcon(SCHEME.neutral1),
                ),
              ).body,
            );
            this.dropStagingButton.val.addAction(() => this.dropStaging());
          },
          () => {
            this.addingLine.val?.remove();
            this.addingLine.val = undefined;
            this.dropStagingButton.val.remove();
          },
        );
      }
    }
  }

  private deleteTrack(): void {
    this.applyNewStaging({
      toDelete: true,
    });
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
  private static DEFAULT_LABEL_WIDTH = 5.625;

  public body: HTMLDivElement;
  private committedLine = new Ref<HTMLDivElement>();
  private addingLine = new Ref<HTMLDivElement>();
  private deletingLine = new Ref<HTMLDivElement>();
  private buttonsContainer = new Ref<HTMLDivElement>();
  public editTrackButton = new Ref<IconButton>();
  public deleteTrackButton = new Ref<IconButton>();
  public dropStagingButton = new Ref<IconButton>();
  public nameInput = new Ref<HTMLInputElement>();
  public isDefaultToggleButton = new Ref<HTMLDivElement>();
  public defaultSelectedIcon = new Ref<HTMLDivElement>();
  public defaultNotSelectedIcon = new Ref<HTMLDivElement>();
  private lineSwitcher = new TabSwitcher();

  public constructor(public audioTrack: AudioTrack) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; display: flex;`,
    });
    this.applyNewStaging(this.audioTrack.staging);
  }

  public setHorizontal(): this {
    this.body.style.flexFlow = "row nowrap";
    this.body.style.alignItems = "center";
    return this;
  }

  public setVertical(): this {
    this.body.style.flexFlow = "column nowrap";
    this.body.style.alignItems = "flex-end";
    return this;
  }

  private applyNewStaging(newStaging?: AudioTrackStagingData): void {
    this.audioTrack.staging = newStaging;
    if (
      !this.audioTrack.staging?.toAdd &&
      !this.audioTrack.staging?.toDelete &&
      this.audioTrack.committed
    ) {
      if (!this.committedLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.committedLine,
                {
                  class: "update-tracks-audio-committed-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-audio-committed-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-audio-committed-name",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(this.audioTrack.committed.name),
                ),
                E.div(
                  {
                    class: "update-tracks-audio-committed-default",
                    style: ` flex: 0 1 auto; width: ${AudioTrackEditor.DEFAULT_LABEL_WIDTH}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    this.audioTrack.committed.isDefault
                      ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel
                      : "",
                  ),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-audio-committed-buttons",
                  style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                assign(
                  this.editTrackButton,
                  new IconButton(
                    ICON_BUTTON_M,
                    ICON_M,
                    createEditIcon("currentColor"),
                  ),
                ).body,
                assign(
                  this.deleteTrackButton,
                  new IconButton(
                    ICON_BUTTON_M,
                    ICON_L,
                    createTrashCanIcon("currentColor"),
                  ),
                ).body,
              ),
            );
            this.editTrackButton.val.addAction(() => this.editTrack());
            this.deleteTrackButton.val.addAction(() => this.deleteTrack());
          },
          () => {
            this.committedLine.val?.remove();
            this.committedLine.val = undefined;
            this.buttonsContainer.val?.remove();
          },
        );
      }
    }

    if (this.audioTrack.staging?.toDelete) {
      if (!this.deletingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.deletingLine,
                {
                  class: "update-tracks-audio-deleting-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-audio-deleting-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-audio-deleting-name",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
                  },
                  E.text(this.audioTrack.committed.name),
                ),
                E.div(
                  {
                    class: "update-tracks-audio-deleting-default",
                    style: ` flex: 0 1 auto; width: ${AudioTrackEditor.DEFAULT_LABEL_WIDTH}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
                  },
                  E.text(
                    this.audioTrack.committed.isDefault
                      ? LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel
                      : "",
                  ),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-audio-deleting-buttons",
                  style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                E.div({
                  style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem;`,
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
          },
          () => {
            this.deletingLine.val?.remove();
            this.deletingLine.val = undefined;
            this.buttonsContainer.val?.remove();
          },
        );
      }
    }

    if (this.audioTrack.staging?.toAdd) {
      if (!this.addingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.addingLine,
                {
                  class: "update-tracks-audio-adding-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-audio-adding-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    this.audioTrack.committed
                      ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                      : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
                  ),
                ),
                E.div(
                  {
                    style: `flex: 1 0 0; min-width: 0;`,
                  },
                  E.inputRef(this.nameInput, {
                    class: "update-tracks-audio-adding-name",
                    style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
                    value: this.audioTrack.staging.toAdd.name,
                    maxlength: `${MAX_AUDIO_TRACK_NAME_LENGTH}`,
                  }),
                ),
                E.divRef(
                  this.isDefaultToggleButton,
                  {
                    class: "update-tracks-audio-default-toggle",
                    style: `cursor: pointer; flex: 0 1 auto; width: ${AudioTrackEditor.DEFAULT_LABEL_WIDTH}rem; display: flex; flex-flow: row nowrap; align-items: center;`,
                  },
                  E.divRef(
                    this.defaultSelectedIcon,
                    {
                      class: "update-tracks-audio-default-selected-icon",
                      style: `${this.audioTrack.staging.toAdd.isDefault ? "display: block;" : "display: none;"} width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_M) / 2}rem;`,
                    },
                    createCheckedBoxIcon(SCHEME.neutral1),
                  ),
                  E.divRef(
                    this.defaultNotSelectedIcon,
                    {
                      class: "update-tracks-audio-default-not-selected-icon",
                      style: `${this.audioTrack.staging.toAdd.isDefault ? "display: none;" : "display: block;"} width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_M) / 2}rem;`,
                    },
                    createBoxIcon(SCHEME.neutral1),
                  ),
                  E.div(
                    {
                      style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(LOCALIZED_TEXT.seasonEpisodeTrackIsDefaultLabel),
                  ),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-audio-adding-buttons",
                  style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                E.div({
                  style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem;`,
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
            this.nameInput.val.addEventListener("change", () =>
              this.changeName(),
            );
            this.isDefaultToggleButton.val.addEventListener("click", () =>
              this.toggleDefaultValue(),
            );
            this.dropStagingButton.val.addAction(() => this.dropStaging());
          },
          () => {
            this.addingLine.val?.remove();
            this.addingLine.val = undefined;
            this.buttonsContainer.val?.remove();
          },
        );
      }
    }
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
    this.defaultSelectedIcon.val.style.display = newStaging.toAdd.isDefault
      ? "block"
      : "none";
    this.defaultNotSelectedIcon.val.style.display = newStaging.toAdd.isDefault
      ? "none"
      : "block";
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
  private committedLine = new Ref<HTMLDivElement>();
  private addingLine = new Ref<HTMLDivElement>();
  private deletingLine = new Ref<HTMLDivElement>();
  private buttonsContainer = new Ref<HTMLDivElement>();
  public editTrackButton = new Ref<IconButton>();
  public deleteTrackButton = new Ref<IconButton>();
  public dropStagingButton = new Ref<IconButton>();
  public nameInput = new Ref<HTMLInputElement>();
  private lineSwitcher = new TabSwitcher();

  public constructor(public subtitleTrack: SubtitleTrack) {
    super();
    this.body = E.div({
      style: `width: 100%; box-sizing: border-box; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral2}; display: flex; flex-flow: column nowrap;`,
    });
    this.applyNewStaging(subtitleTrack.staging);
  }

  public setHorizontal(): this {
    this.body.style.flexFlow = "row nowrap";
    this.body.style.alignItems = "center";
    return this;
  }

  public setVertical(): this {
    this.body.style.flexFlow = "column nowrap";
    this.body.style.alignItems = "flex-end";
    return this;
  }

  private applyNewStaging(newStaging?: SubtitleTrackStagingData): void {
    this.subtitleTrack.staging = newStaging;
    if (
      !this.subtitleTrack.staging?.toAdd &&
      !this.subtitleTrack.staging?.toDelete &&
      this.subtitleTrack.committed
    ) {
      if (!this.committedLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.committedLine,
                {
                  class: "update-tracks-subtitle-committed-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-subtitle-committed-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateCommittedLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-subtitle-committed-name",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(this.subtitleTrack.committed.name),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-subtitle-committed-buttons",
                  style: `display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                assign(
                  this.editTrackButton,
                  new IconButton(
                    ICON_BUTTON_M,
                    ICON_M,
                    createEditIcon("currentColor"),
                  ),
                ).body,
                assign(
                  this.deleteTrackButton,
                  new IconButton(
                    ICON_BUTTON_M,
                    ICON_L,
                    createTrashCanIcon("currentColor"),
                  ),
                ).body,
              ),
            );
            this.editTrackButton.val.addAction(() => this.editTrack());
            this.deleteTrackButton.val.addAction(() => this.deleteTrack());
          },
          () => {
            this.committedLine.val.remove();
            this.committedLine.val = undefined;
            this.buttonsContainer.val.remove();
          },
        );
      }
    }

    if (this.subtitleTrack.staging?.toDelete) {
      if (!this.deletingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.deletingLine,
                {
                  class: "update-tracks-subtitle-deleting-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-subtitle-deleting-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeTrackStateDeletingLabel),
                ),
                E.div(
                  {
                    class: "update-tracks-subtitle-deleting-name",
                    style: `flex: 1 0 0; min-width: 0; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-decoration: line-through;`,
                  },
                  E.text(this.subtitleTrack.committed.name),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-subtitle-deleting-buttons",
                  style: `display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                E.div({
                  style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem;`,
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
          },
          () => {
            this.deletingLine.val.remove();
            this.deletingLine.val = undefined;
            this.buttonsContainer.val.remove();
          },
        );
      }
    }

    if (this.subtitleTrack.staging?.toAdd) {
      if (!this.addingLine.val) {
        this.lineSwitcher.goTo(
          () => {
            this.body.append(
              E.divRef(
                this.addingLine,
                {
                  class: "update-tracks-subtitle-adding-values",
                  style: `flex: 1 0 0; width: 100%; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
                E.div(
                  {
                    class: "update-tracks-subtitle-adding-state",
                    style: `flex: 0 0 auto; width: ${STATE_WIDTH}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    this.subtitleTrack.committed
                      ? LOCALIZED_TEXT.seasonEpisodeTrackStateModifyingLabel
                      : LOCALIZED_TEXT.seasonEpisodeTrackStateNewLabel,
                  ),
                ),
                E.div(
                  {
                    style: `flex: 1 0 0; min-width: 0;`,
                  },
                  E.inputRef(this.nameInput, {
                    class: "update-tracks-subtitle-adding-name",
                    style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
                    value: this.subtitleTrack.staging.toAdd.name,
                    maxlength: `${MAX_SUBTITLE_TRACK_NAME_LENGTH}`,
                  }),
                ),
              ),
              E.divRef(
                this.buttonsContainer,
                {
                  class: "update-tracks-subtitle-adding-buttons",
                  style: `display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                E.div({
                  style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem;`,
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
            this.nameInput.val.addEventListener("change", () =>
              this.changeName(),
            );
            this.dropStagingButton.val.addAction(() => this.dropStaging());
          },
          () => {
            this.addingLine.val.remove();
            this.addingLine.val = undefined;
            this.buttonsContainer.val.remove();
          },
        );
      }
    }
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

  private static BREAK_POINT_WIDTH = 28; // rem

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
  private resizeObserver: ResizeObserver;

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
      eCenteredTitle(LOCALIZED_TEXT.updateTracksTitle),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "update-tracks-all-tracks",
          style: `display: flex; flex-flow: column nowrap; gap: 3rem;`,
        },
        E.div(
          {
            class: "update-tracks-video-tracks",
            style: `display: flex; flex-flow: column nowrap;`,
          },
          ...(videoContainer.videos.length === 0
            ? []
            : [
                E.div(
                  {
                    class: "update-tracks-videos-title",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeVideoTracksTitle),
                ),
                ...videoContainer.videos.map((videoTrack) =>
                  this.createVideoTrackEditor(videoTrack),
                ),
              ]),
        ),
        E.div(
          {
            class: "update-tracks-audio-tracks",
            style: `display: flex; flex-flow: column nowrap;`,
          },
          ...(videoContainer.audios.length === 0
            ? []
            : [
                E.div(
                  {
                    class: "update-tracks-audio-tracks-title",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeAudioTracksTitle),
                ),
                ...videoContainer.audios.map((audioTrack) =>
                  this.createAudioTrackEditor(audioTrack),
                ),
              ]),
        ),
        E.div(
          {
            class: "update-tracks-subtitle-tracks",
            style: `display: flex; flex-flow: column nowrap;`,
          },
          ...(videoContainer.subtitles.length === 0
            ? []
            : [
                E.div(
                  {
                    class: "update-tracks-subtitle-tracks-title",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonEpisodeSubtitleTracksTitle),
                ),
                ...videoContainer.subtitles.map((subtitleTrack) =>
                  this.createSubtitleTrackEditor(subtitleTrack),
                ),
              ]),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "update-tracks-video-actions",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_0_5X}rem;`,
        },
        E.divRef(this.actionError, {
          class: "update-tracks-action-error",
          style: `display: none; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0}; text-align: center; self-align: center;`,
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
    this.resizeObserver = new ResizeObserver((entries) => {
      this.resizeTracks(entries[0]);
    });
    this.resizeObserver.observe(this.body);

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

  private resizeTracks(entry: ResizeObserverEntry): void {
    let newWidth: number;
    if (entry.borderBoxSize) {
      newWidth = entry.borderBoxSize[0].inlineSize;
    } else {
      newWidth = entry.contentRect.width;
    }
    if (newWidth < getRootFontSize() * UpdateTracksPage.BREAK_POINT_WIDTH) {
      this.videoTrackEditors.forEach((editor) => editor.setVertical());
      this.audioTrackEditors.forEach((editor) => editor.setVertical());
      this.subtitleTrackEditors.forEach((editor) => editor.setVertical());
    } else {
      this.videoTrackEditors.forEach((editor) => editor.setHorizontal());
      this.audioTrackEditors.forEach((editor) => editor.setHorizontal());
      this.subtitleTrackEditors.forEach((editor) => editor.setHorizontal());
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
    this.resizeObserver.disconnect();
    this.removeAllListeners();
  }
}
