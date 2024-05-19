import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../../common/hover_observer";
import { IconButton, TooltipPosition } from "../../../../../common/icon_button";
import {
  createCommentIcon,
  createDanmakuIcon,
  createDoubleArrowsIcon,
  createFastForwardIcon,
  createLoadingIcon,
  createLoopingIcon,
  createNoDanmakuIcon,
  createNotLoopingIcon,
  createPauseIcon,
  createPlayIcon,
  createSettingsIcon,
  createSkipForwardIcon,
  createVolumeFullIcon,
  createVolumeMutedIcon,
} from "../../../../../common/icons";
import { LikeDislikeButtons } from "../../../../../common/like_dislike_buttons";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { FONT_M, ICON_L, ICON_M, ICON_S } from "../../../../../common/sizes";
import { Orientation, Slider } from "../../../../../common/slider";
import { formatSecondsAsHHMMSS } from "../../../../../common/timestamp_formatter";
import { PRODUCT_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { DanmakuCanvas } from "./danmaku_canvas/body";
import {
  Comment,
  Liking,
} from "@phading/comment_service_interface/show_app/comment";
import {
  DanmakuSettings,
  PlayerSettings,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { Show } from "@phading/product_service_interface/consumer/show_app/show";
import {
  likeShow,
  savePlayerSettings,
} from "@phading/product_service_interface/consumer/show_app/web/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface Player {
  on(event: "showComments", listener: () => void): this;
  on(event: "showSettings", listener: () => void): this;
  on(event: "showMoreInfo", listener: () => void): this;
  on(event: "canplaythrough", listener: () => void): this;
  on(event: "ended", listener: () => void): this;
}

export class Player extends EventEmitter {
  public static create(playerSettings: PlayerSettings, show: Show): Player {
    return new Player(
      (callback, ms) => window.setTimeout(callback, ms),
      (id) => window.clearTimeout(id),
      DanmakuCanvas.create,
      PRODUCT_SERVICE_CLIENT,
      playerSettings,
      show,
    );
  }

  private static EDGE_PADDING = 2; // rem;
  private static NORMAL_PLAYBACK_SPEED_INDEX = 3;
  private static PLAYBACK_SPEEDS = [
    0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4,
  ];
  private static RESERVED_BOTTOM_MARGIN = 80; // px
  private static UPDATE_PROGRESS_INTERVAL = 200; // ms
  private static OPACITY_TRANSITION = `transition: opacity .3s linear;`;

  private body_: HTMLDivElement;
  private video_ = new Ref<HTMLVideoElement>();
  private loadingIcon = new Ref<HTMLDivElement>();
  private playingIcon = new Ref<HTMLDivElement>();
  private pausedIcon = new Ref<HTMLDivElement>();
  private danmakuCanvas = new Ref<DanmakuCanvas>();
  private topButtonsContainer = new Ref<HTMLDivElement>();
  private noLoopButton_ = new Ref<IconButton>();
  private loopButton_ = new Ref<IconButton>();
  private danmakuButton_ = new Ref<IconButton>();
  private noDanmakuButton_ = new Ref<IconButton>();
  private settingsButton_ = new Ref<IconButton>();
  private rightButtonsContainer = new Ref<HTMLDivElement>();
  private volumeSlider = new Ref<Slider>();
  private volumeButton_ = new Ref<IconButton>();
  private volumeMutedButton_ = new Ref<IconButton>();
  private likeDislikeButtons_ = new Ref<LikeDislikeButtons>();
  private commentButton_ = new Ref<IconButton>();
  private bottomButtonsContainer = new Ref<HTMLDivElement>();
  private progressBar = new Ref<HTMLDivElement>();
  private progressBarBuffer = new Ref<HTMLDivElement>();
  private progressBarFiller = new Ref<HTMLDivElement>();
  private pointedTimestamp = new Ref<HTMLDivElement>();
  private currentTimeText = new Ref<HTMLDivElement>();
  private skipBackwardButton_ = new Ref<IconButton>();
  private speedDownButton_ = new Ref<IconButton>();
  private currentPlaybackSpeed = new Ref<HTMLDivElement>();
  private speedUpButton_ = new Ref<IconButton>();
  private skipForwardButton_ = new Ref<IconButton>();
  private durationText = new Ref<HTMLDivElement>();
  private moreInfoButton_ = new Ref<IconButton>();
  private bottomProgressBar = new Ref<HTMLDivElement>();
  private bottomProgressBarBuffer = new Ref<HTMLDivElement>();
  private bottomProgressBarFiller = new Ref<HTMLDivElement>();
  private hoverObserver: HoverObserver;
  private updateProgressId: number;
  private playbackSpeedIndex: number;
  private duration = 0;
  private isSeeking = false;

  public constructor(
    private setTimeout: (callback: () => void, ms: number) => number,
    private clearTimeout: (id: number) => void,
    private createDanmakuCanvas: (
      reservedBottomMargin: number,
      danmakuSettings: DanmakuSettings,
    ) => DanmakuCanvas,
    private productServiceClient: WebServiceClient,
    private playerSettings: PlayerSettings,
    private show: Show,
  ) {
    super();
    let speedDownIconRef = new Ref<SVGSVGElement>();
    let speedUpIconRef = new Ref<SVGSVGElement>();
    this.body_ = E.div(
      {
        class: "player",
        style: `position: relative; width: 100vw; height: 100vh; background-color: ${SCHEME.neutral4};`,
      },
      E.videoRef(this.video_, {
        class: "player-video",
        style: `width: 100%; height: 100%; object-fit: contain;`,
        src: this.show.videoPath,
      }),
      E.divRef(
        this.loadingIcon,
        {
          class: "player-video-loading-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_L}rem; height: ${ICON_L}rem; ${Player.OPACITY_TRANSITION});`,
        },
        createLoadingIcon(SCHEME.neutral1),
      ),
      E.divRef(
        this.playingIcon,
        {
          class: "player-video-playing-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_M}rem; height: ${ICON_M}rem; opacity: 0;`,
        },
        createPlayIcon(SCHEME.neutral1),
      ),
      E.divRef(
        this.pausedIcon,
        {
          class: "player-video-paused-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_M}rem; height: ${ICON_M}rem; opacity: 0;`,
        },
        createPauseIcon(SCHEME.neutral1),
      ),
      assign(
        this.danmakuCanvas,
        this.createDanmakuCanvas(
          Player.RESERVED_BOTTOM_MARGIN,
          this.playerSettings.danmakuSettings,
        ),
      ).body,
      E.divRef(
        this.topButtonsContainer,
        {
          class: "player-top-buttons-container",
          style: `position: absolute; top: 0; right: 0; box-sizing: border-box; padding: .5rem ${Player.EDGE_PADDING}rem 2rem; display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; ${Player.OPACITY_TRANSITION} `,
        },
        assign(
          this.noLoopButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .5rem; box-sizing: border-box;`,
            createNotLoopingIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.noLoopingButtonlabel,
          ).enable(),
        ).body,
        assign(
          this.loopButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createLoopingIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.loopingButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.danmakuButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createDanmakuIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.danmakuButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.noDanmakuButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createNoDanmakuIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.noDanmakuButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.settingsButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .3rem; box-sizing: border-box;`,
            createSettingsIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.playerSettingsButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(
        this.rightButtonsContainer,
        {
          class: "player-right-buttons-container",
          style: `position: absolute; right: 0; bottom: 10rem; padding: 0 ${Player.EDGE_PADDING}rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem; ${Player.OPACITY_TRANSITION}`,
        },
        assign(
          this.volumeSlider,
          Slider.create(Orientation.VERTICAL, `7rem`, `1rem`, 0, 1, ""),
        ).body,
        assign(
          this.volumeButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .1rem; box-sizing: border-box;`,
            createVolumeFullIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.volumeMutedButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .1rem; box-sizing: border-box;`,
            createVolumeMutedIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeMutedButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.likeDislikeButtons_,
          LikeDislikeButtons.create(
            `display: flex; flex-flow: column nowrap; gap: 2rem;`,
            0.3,
            TooltipPosition.LEFT,
          ).enable(show.liking),
        ).body,
        assign(
          this.commentButton_,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .3rem; box-sizing: border-box;`,
            createCommentIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.showCommentButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(
        this.bottomButtonsContainer,
        {
          class: "player-bottom-buttons-container",
          style: `position: absolute; bottom: 0; left: 0; width: 100%; display: flex; flex-flow: column nowrap; ${Player.OPACITY_TRANSITION}`,
        },
        E.divRef(
          this.progressBar,
          {
            class: "player-progress-bar",
            style: `position: relative; width: 100%; height: 1rem; box-sizing: border-box; transition: padding .2s linear; touch-action: none;`,
          },
          E.div(
            {
              class: "player-progress-background",
              style: `position: relative; height: 100%; width: 100%; background-color: ${SCHEME.neutral2};`,
            },
            E.divRef(this.progressBarBuffer, {
              class: "player-progress-bar-buffer",
              style: `height: 100%; width: 0; background-color: ${SCHEME.neutral1};`,
            }),
            E.divRef(this.progressBarFiller, {
              class: "player-progress-bar-filler",
              style: `position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: ${SCHEME.primary1};`,
            }),
          ),
          E.divRef(this.pointedTimestamp, {
            class: "player-pointed-timestamp",
            style: `position: absolute; bottom: 100%; padding-bottom: .5rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          }),
        ),
        E.div({
          style: "height: .3rem;",
        }),
        E.div(
          {
            class: "player-controller-buttons",
            style: `width: 100%; padding: 0 ${Player.EDGE_PADDING}rem; box-sizing: border-box; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center; gap: 2rem;`,
          },
          E.divRef(
            this.currentTimeText,
            {
              class: "player-video-current-time",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
            },
            E.text(formatSecondsAsHHMMSS(0)),
          ),
          assign(
            this.skipBackwardButton_,
            IconButton.create(
              `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .7rem; box-sizing: border-box;`,
              createSkipForwardIcon(
                SCHEME.neutral1,
                `transform: rotate(180deg);`,
              ),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.skipBackwardButtonLabel,
            ).enable(),
          ).body,
          E.div(
            {
              class: "player-playback-speed-group",
              style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: .5rem;`,
            },
            assign(
              this.speedDownButton_,
              IconButton.create(
                `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .5rem; box-sizing: border-box;`,
                assign(
                  speedDownIconRef,
                  createFastForwardIcon(
                    SCHEME.neutral1,
                    `transform: rotate(90deg);`,
                  ),
                ),
                TooltipPosition.TOP,
                LOCALIZED_TEXT.speedDownButtonLabel,
                () => {
                  speedDownIconRef.val.style.fill = SCHEME.neutral1;
                },
                () => {
                  speedDownIconRef.val.style.fill = SCHEME.neutral3;
                },
              ),
            ).body,
            E.divRef(this.currentPlaybackSpeed, {
              class: "player-current-playback-speed",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; width: 4rem; text-align: center;`,
            }),
            assign(
              this.speedUpButton_,
              IconButton.create(
                `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .5rem; box-sizing: border-box;`,
                assign(
                  speedUpIconRef,
                  createFastForwardIcon(
                    SCHEME.neutral1,
                    `transform: rotate(-90deg);`,
                  ),
                ),
                TooltipPosition.TOP,
                LOCALIZED_TEXT.speedUpButtonLabel,
                () => {
                  speedUpIconRef.val.style.fill = SCHEME.neutral1;
                },
                () => {
                  speedUpIconRef.val.style.fill = SCHEME.neutral3;
                },
              ),
            ).body,
          ),
          assign(
            this.skipForwardButton_,
            IconButton.create(
              `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .7rem; box-sizing: border-box;`,
              createSkipForwardIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.skipForwardButtonLabel,
            ).enable(),
          ).body,
          E.divRef(
            this.durationText,
            {
              class: "player-video-length",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
            },
            E.text(formatSecondsAsHHMMSS(0)),
          ),
        ),
        E.div({
          style: "height: .5rem;",
        }),
        assign(
          this.moreInfoButton_,
          IconButton.create(
            `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center;`,
            E.div(
              {
                style: `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .8rem; box-sizing: border-box; transform: rotate(-90deg);`,
              },
              createDoubleArrowsIcon(SCHEME.neutral1),
            ),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.moreShowInfoButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(
        this.bottomProgressBar,
        {
          class: "player-bottom-progress-bar",
          style: `position: absolute; bottom: 0; left: 0; width: 100%; height: .2rem; background-color: ${SCHEME.neutral2}; ${Player.OPACITY_TRANSITION}`,
        },
        E.divRef(this.bottomProgressBarBuffer, {
          class: "player-buttom-progress-bar-buffer",
          style: `height: 100%; width: 0; background-color: ${SCHEME.neutral1};`,
        }),
        E.divRef(this.bottomProgressBarFiller, {
          class: "player-buttom-progress-bar-filler",
          style: `position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: ${SCHEME.primary1};`,
        }),
      ),
    );
    this.hideAllActions();
    this.hideLoadingIcon();
    this.leaveProgressBar();
    this.stopLooping();
    this.applyVideoSettings();
    this.applyDanmakuSettings();
    this.hoverObserver = HoverObserver.create(
      this.body_,
      Mode.HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.showAllActions())
      .on("leave", () => this.hideAllActions());
    this.video_.val.addEventListener("loadedmetadata", () =>
      this.setDuration(),
    );
    this.video_.val.addEventListener("durationchange", () =>
      this.setDuration(),
    );
    this.video_.val.addEventListener("progress", () =>
      this.updateBufferProgress(),
    );
    this.video_.val.addEventListener("canplaythrough", () =>
      this.updateBufferCompleted(),
    );
    this.video_.val.addEventListener("playing", () => this.isPlaying());
    this.video_.val.addEventListener("pause", () => this.isPaused());
    this.video_.val.addEventListener("ended", () => this.isEnded());
    this.video_.val.addEventListener("waiting", () => this.isLoading());
    this.danmakuCanvas.val.on("passThroughClick", () => this.toggleVideoPlay());
    this.volumeButton_.val.on("action", () => this.mute());
    this.volumeMutedButton_.val.on("action", () => this.unmute());
    this.volumeSlider.val.on("change", (value) => this.setVolume(value));
    this.likeDislikeButtons_.val.on("like", (liking) => this.likeShow(liking));
    this.commentButton_.val.on("action", () => this.emit("showComments"));
    this.progressBar.val.addEventListener("pointerover", (event) =>
      this.hoverProgressBar(event),
    );
    this.progressBar.val.addEventListener("pointerdown", (event) =>
      this.startSeekingNewPosition(event),
    );
    this.progressBar.val.addEventListener("pointermove", (event) =>
      this.moveToSeekNewPosition(event),
    );
    this.progressBar.val.addEventListener("pointerup", (event) =>
      this.stopSeeking(event),
    );
    this.progressBar.val.addEventListener("pointerout", () =>
      this.leaveProgressBar(),
    );
    this.speedDownButton_.val.on("action", () => this.speedDownOnce());
    this.speedUpButton_.val.on("action", () => this.speedUpOnce());
    this.skipBackwardButton_.val.on("action", () => this.skipBackward());
    this.skipForwardButton_.val.on("action", () => this.skipForward());
    this.noLoopButton_.val.on("action", () => this.startLooping());
    this.loopButton_.val.on("action", () => this.stopLooping());
    this.danmakuButton_.val.on("action", () => this.disableDanmaku());
    this.noDanmakuButton_.val.on("action", () => this.enableDanmaku());
    this.settingsButton_.val.on("action", () => this.emit("showSettings"));
    this.moreInfoButton_.val.on("action", () => this.emit("showMoreInfo"));
  }

  private showAllActions(): void {
    this.topButtonsContainer.val.style.opacity = `1`;
    this.rightButtonsContainer.val.style.opacity = `1`;
    this.bottomButtonsContainer.val.style.opacity = `1`;
    this.bottomProgressBar.val.style.opacity = `0`;
  }

  private hideAllActions(): void {
    this.topButtonsContainer.val.style.opacity = `0`;
    this.rightButtonsContainer.val.style.opacity = `0`;
    this.bottomButtonsContainer.val.style.opacity = `0`;
    this.bottomProgressBar.val.style.opacity = `1`;
  }

  private showLoadingIcon(): void {
    this.loadingIcon.val.style.opacity = `1`;
  }

  private hideLoadingIcon(): void {
    this.loadingIcon.val.style.opacity = `0`;
  }

  private setDuration(): void {
    this.duration = this.video_.val.duration;
    this.durationText.val.textContent = formatSecondsAsHHMMSS(
      this.video_.val.duration,
    );
  }

  private updateBufferProgress(): void {
    if (this.duration === 0) {
      return;
    }
    let currentTime = this.video_.val.currentTime;
    for (let i = 0; i < this.video_.val.buffered.length; i++) {
      if (
        this.video_.val.buffered.start(i) <= currentTime &&
        this.video_.val.buffered.end(i) >= currentTime
      ) {
        let percentage =
          (this.video_.val.buffered.end(i) / this.duration) * 100;
        this.progressBarBuffer.val.style.width = `${percentage}%`;
        this.bottomProgressBarBuffer.val.style.width = `${percentage}%`;
        break;
      }
    }
  }

  private updateBufferCompleted(): void {
    this.progressBarBuffer.val.style.width = `100%`;
    this.bottomProgressBarBuffer.val.style.width = `100%`;
    this.emit("canplaythrough");
  }

  private isPlaying(): void {
    this.danmakuCanvas.val.play();
    this.clearTimeout(this.updateProgressId);
    this.updateProgressContinuously();
    this.hideLoadingIcon();
  }

  private updateProgressContinuously = (): void => {
    this.updateProgress();
    this.updateProgressId = this.setTimeout(
      this.updateProgressContinuously,
      Player.UPDATE_PROGRESS_INTERVAL,
    );
  };

  private updateProgress(): void {
    if (this.duration === 0) {
      this.progressBarFiller.val.style.width = `0`;
      this.bottomProgressBarFiller.val.style.width = `0`;
    } else {
      let currentTime = this.video_.val.currentTime;
      let percentage = (currentTime / this.duration) * 100;
      this.progressBarFiller.val.style.width = `${percentage}%`;
      this.bottomProgressBarFiller.val.style.width = `${percentage}%`;
      this.currentTimeText.val.textContent = formatSecondsAsHHMMSS(currentTime);
    }
  }

  private isPaused(): void {
    this.danmakuCanvas.val.pause();
    this.clearTimeout(this.updateProgressId);
    this.updateProgress();
    this.hideLoadingIcon();
  }

  private isEnded(): void {
    this.isPaused();
    this.emit("ended");
  }

  private isLoading(): void {
    this.danmakuCanvas.val.pause();
    this.showLoadingIcon();
  }

  private toggleVideoPlay(): void {
    if (this.video_.val.paused) {
      this.video_.val.play();
      this.animateStatusIcon(this.playingIcon.val);
    } else {
      this.video_.val.pause();
      this.animateStatusIcon(this.pausedIcon.val);
    }
  }

  private animateStatusIcon(icon: HTMLDivElement): void {
    icon.animate(
      [
        { transform: "scale(1)", opacity: "0" },
        { transform: "scale(1.25)", opacity: "1" },
        { transform: "scale(1.5)", opacity: "0" },
      ],
      1000,
    );
  }

  private hoverProgressBar(event: PointerEvent): void {
    this.progressBar.val.style.paddingTop = `0`;
    this.setPointedTimestamp(event);
    this.pointedTimestamp.val.style.display = `block`;
  }

  private setPointedTimestamp(event: PointerEvent): number {
    let rect = this.progressBar.val.getBoundingClientRect();
    let ratio = Math.min(1, Math.max(0, (event.clientX - rect.x) / rect.width));
    let timestamp = ratio * this.duration;
    if (ratio < 0.5) {
      this.pointedTimestamp.val.style.left = `${ratio * 100}%`;
      this.pointedTimestamp.val.style.right = ``;
    } else {
      this.pointedTimestamp.val.style.left = ``;
      this.pointedTimestamp.val.style.right = `${(1 - ratio) * 100}%`;
    }
    this.pointedTimestamp.val.textContent = formatSecondsAsHHMMSS(timestamp);
    return timestamp;
  }

  private startSeekingNewPosition(event: PointerEvent): void {
    let timestamp = this.setPointedTimestamp(event);
    this.isSeeking = true;
    this.progressBar.val.setPointerCapture(event.pointerId);
    this.seekNewPosition(timestamp);
  }

  private seekNewPosition(timestamp: number): void {
    this.video_.val.currentTime = timestamp;
    this.updateProgress();
  }

  private moveToSeekNewPosition(event: PointerEvent): void {
    let timestamp = this.setPointedTimestamp(event);
    if (!this.isSeeking) {
      return;
    }
    this.seekNewPosition(timestamp);
  }

  private stopSeeking(event: PointerEvent): void {
    if (!this.isSeeking) {
      return;
    }
    this.isSeeking = false;
    this.progressBar.val.releasePointerCapture(event.pointerId);
  }

  private leaveProgressBar(): void {
    this.progressBar.val.style.paddingTop = `.8rem`;
    this.pointedTimestamp.val.style.display = `none`;
  }

  private skipBackward(): void {
    this.video_.val.currentTime = Math.max(0, this.video_.val.currentTime - 5);
    this.updateProgress();
  }

  private skipForward(): void {
    this.video_.val.currentTime = Math.min(
      this.duration,
      this.video_.val.currentTime + 5,
    );
    this.updateProgress();
  }

  private applyVideoSettings(): void {
    // Playback speed
    this.playbackSpeedIndex = Player.PLAYBACK_SPEEDS.indexOf(
      this.playerSettings.videoSettings.playbackSpeed,
    );
    if (this.playbackSpeedIndex === -1) {
      this.playbackSpeedIndex = Player.NORMAL_PLAYBACK_SPEED_INDEX;
    }
    if (this.playbackSpeedIndex <= 0) {
      this.speedDownButton_.val.disable();
    } else {
      this.speedDownButton_.val.enable();
    }
    if (this.playbackSpeedIndex >= Player.PLAYBACK_SPEEDS.length - 1) {
      this.speedUpButton_.val.disable();
    } else {
      this.speedUpButton_.val.enable();
    }
    this.currentPlaybackSpeed.val.textContent = `${
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex]
    }x`;
    this.video_.val.playbackRate =
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex];

    // Volume & muted
    this.volumeSlider.val.setValue(this.playerSettings.videoSettings.volume);
    if (this.playerSettings.videoSettings.muted) {
      this.video_.val.volume = 0;
      this.volumeButton_.val.hide();
      this.volumeMutedButton_.val.show();
    } else {
      this.video_.val.volume = this.playerSettings.videoSettings.volume;
      this.volumeButton_.val.show();
      this.volumeMutedButton_.val.hide();
    }
  }

  private saveVideoSettings(): void {
    this.applyVideoSettings();
    savePlayerSettings(this.productServiceClient, {
      playerSettings: this.playerSettings,
    });
  }

  private speedDownOnce(): void {
    if (this.playbackSpeedIndex <= 0) {
      return;
    }
    this.playerSettings.videoSettings.playbackSpeed =
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex - 1];
    this.saveVideoSettings();
  }

  private speedUpOnce(): void {
    if (this.playbackSpeedIndex >= Player.PLAYBACK_SPEEDS.length - 1) {
      return;
    }
    this.playerSettings.videoSettings.playbackSpeed =
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex + 1];
    this.saveVideoSettings();
  }

  private mute(): void {
    this.playerSettings.videoSettings.muted = true;
    this.saveVideoSettings();
  }

  private unmute(): void {
    this.playerSettings.videoSettings.muted = false;
    this.saveVideoSettings();
  }

  private setVolume(value: number /* [0, 1] */): void {
    this.playerSettings.videoSettings.volume = value;
    this.saveVideoSettings();
  }

  private startLooping(): void {
    this.video_.val.loop = true;
    this.noLoopButton_.val.hide();
    this.loopButton_.val.show();
  }

  private stopLooping(): void {
    this.video_.val.loop = false;
    this.noLoopButton_.val.show();
    this.loopButton_.val.hide();
  }

  private disableDanmaku(): void {
    this.playerSettings.danmakuSettings.enable = false;
    this.saveDanmakuSettings();
  }

  private enableDanmaku(): void {
    this.playerSettings.danmakuSettings.enable = true;
    this.saveDanmakuSettings();
  }

  private async likeShow(liking: Liking): Promise<void> {
    await likeShow(this.productServiceClient, {
      showId: this.show.showId,
      liking,
    });
  }

  private applyDanmakuSettings(): void {
    if (this.playerSettings.danmakuSettings.enable) {
      this.danmakuButton_.val.show();
      this.noDanmakuButton_.val.hide();
    } else {
      this.danmakuButton_.val.hide();
      this.noDanmakuButton_.val.show();
    }
    this.danmakuCanvas.val.updateSettings();
  }

  private saveDanmakuSettings(): void {
    this.applyDanmakuSettings();
    savePlayerSettings(this.productServiceClient, {
      playerSettings: this.playerSettings,
    });
  }

  public updateSettings(): void {
    this.applyDanmakuSettings();
    this.applyVideoSettings();
    savePlayerSettings(this.productServiceClient, {
      playerSettings: this.playerSettings,
    });
  }

  public addDanmaku(comments: Array<Comment>): void {
    this.danmakuCanvas.val.add(comments);
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
    this.danmakuCanvas.val.remove();
  }

  // Visible for testing
  public get video() {
    return this.video_.val;
  }
  public get skipBackwardButton() {
    return this.skipBackwardButton_.val;
  }
  public get skipForwardButton() {
    return this.skipForwardButton_.val;
  }
  public get speedDownButton() {
    return this.speedDownButton_.val;
  }
  public get speedUpbutton() {
    return this.speedUpButton_.val;
  }
  public get noLoopButton() {
    return this.noLoopButton_.val;
  }
  public get loopButton() {
    return this.loopButton_.val;
  }
  public get danmakuButton() {
    return this.danmakuButton_.val;
  }
  public get noDanmakuButton() {
    return this.noDanmakuButton_.val;
  }
  public get settingsButton() {
    return this.settingsButton_.val;
  }
  public get volumeButton() {
    return this.volumeButton_.val;
  }
  public get volumeMutedButton() {
    return this.volumeMutedButton_.val;
  }
  public get likeDislikeButtons() {
    return this.likeDislikeButtons_.val;
  }
  public get commentButton() {
    return this.commentButton_.val;
  }
  public get moreInfoButton() {
    return this.moreInfoButton_.val;
  }
  public showActions(): void {
    this.hoverObserver.emit("hover");
  }
  public hideActions(): void {
    this.hoverObserver.emit("leave");
  }
}
