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
import { Orientation, SliderInput } from "../../../../../common/slider_input";
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
  private video_: HTMLVideoElement;
  private loadingIcon: HTMLDivElement;
  private playingIcon: HTMLDivElement;
  private pausedIcon: HTMLDivElement;
  private danmakuCanvas: DanmakuCanvas;
  private topButtonsContainer: HTMLDivElement;
  private noLoopButton_: IconButton;
  private loopButton_: IconButton;
  private danmakuButton_: IconButton;
  private noDanmakuButton_: IconButton;
  private settingsButton_: IconButton;
  private rightButtonsContainer: HTMLDivElement;
  private volumeSlider: SliderInput;
  private volumeButton_: IconButton;
  private volumeMutedButton_: IconButton;
  private likeDislikeButtons_: LikeDislikeButtons;
  private commentButton_: IconButton;
  private bottomButtonsContainer: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressBarBuffer: HTMLDivElement;
  private progressBarFiller: HTMLDivElement;
  private pointedTimestamp: HTMLDivElement;
  private currentTimeText: HTMLDivElement;
  private skipBackwardButton_: IconButton;
  private speedDownButton_: IconButton;
  private currentPlaybackSpeed: HTMLDivElement;
  private speedUpButton_: IconButton;
  private skipForwardButton_: IconButton;
  private durationText: HTMLDivElement;
  private moreInfoButton_: IconButton;
  private bottomProgressBar: HTMLDivElement;
  private bottomProgressBarBuffer: HTMLDivElement;
  private bottomProgressBarFiller: HTMLDivElement;
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
    let videoRef = new Ref<HTMLVideoElement>();
    let loadingIconRef = new Ref<HTMLDivElement>();
    let playingIconRef = new Ref<HTMLDivElement>();
    let pausedIconRef = new Ref<HTMLDivElement>();
    let danmakuCanvasRef = new Ref<DanmakuCanvas>();
    let topButtonsContainerRef = new Ref<HTMLDivElement>();
    let noLoopButtonRef = new Ref<IconButton>();
    let loopButtonRef = new Ref<IconButton>();
    let danmakuButtonRef = new Ref<IconButton>();
    let noDanmakuButtonRef = new Ref<IconButton>();
    let settingsButtonRef = new Ref<IconButton>();
    let rightButtonsContainerRef = new Ref<HTMLDivElement>();
    let volumeSliderRef = new Ref<SliderInput>();
    let volumeButtonRef = new Ref<IconButton>();
    let volumeMutedButtonRef = new Ref<IconButton>();
    let likeDislikeButtonsRef = new Ref<LikeDislikeButtons>();
    let commentButtonRef = new Ref<IconButton>();
    let bottomButtonsContainerRef = new Ref<HTMLDivElement>();
    let progressBarRef = new Ref<HTMLDivElement>();
    let progressBarBufferRef = new Ref<HTMLDivElement>();
    let progressBarFillerRef = new Ref<HTMLDivElement>();
    let pointedTimestampRef = new Ref<HTMLDivElement>();
    let currentTimeTextRef = new Ref<HTMLDivElement>();
    let skipBackwardButtonRef = new Ref<IconButton>();
    let speedDownButtonRef = new Ref<IconButton>();
    let speedDownIconRef = new Ref<SVGSVGElement>();
    let currentPlaybackSpeedRef = new Ref<HTMLDivElement>();
    let speedUpButtonRef = new Ref<IconButton>();
    let speedUpIconRef = new Ref<SVGSVGElement>();
    let skipForwardButtonRef = new Ref<IconButton>();
    let durationTextRef = new Ref<HTMLDivElement>();
    let moreInfoButtonRef = new Ref<IconButton>();
    let bottomProgressBarRef = new Ref<HTMLDivElement>();
    let bottomProgressBarBufferRef = new Ref<HTMLDivElement>();
    let bottomProgressBarFillerRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "player",
        style: `position: relative; width: 100vw; height: 100vh; background-color: ${SCHEME.neutral4};`,
      },
      E.videoRef(videoRef, {
        class: "player-video",
        style: `width: 100%; height: 100%; object-fit: contain;`,
        src: this.show.videoPath,
      }),
      E.divRef(
        loadingIconRef,
        {
          class: "player-video-loading-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_L}rem; height: ${ICON_L}rem; ${Player.OPACITY_TRANSITION});`,
        },
        createLoadingIcon(SCHEME.neutral1),
      ),
      E.divRef(
        playingIconRef,
        {
          class: "player-video-playing-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_M}rem; height: ${ICON_M}rem; opacity: 0;`,
        },
        createPlayIcon(SCHEME.neutral1),
      ),
      E.divRef(
        pausedIconRef,
        {
          class: "player-video-paused-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: ${ICON_M}rem; height: ${ICON_M}rem; opacity: 0;`,
        },
        createPauseIcon(SCHEME.neutral1),
      ),
      assign(
        danmakuCanvasRef,
        this.createDanmakuCanvas(
          Player.RESERVED_BOTTOM_MARGIN,
          this.playerSettings.danmakuSettings,
        ),
      ).body,
      E.divRef(
        topButtonsContainerRef,
        {
          class: "player-top-buttons-container",
          style: `position: absolute; top: 0; right: 0; box-sizing: border-box; padding: .5rem ${Player.EDGE_PADDING}rem 2rem; display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; ${Player.OPACITY_TRANSITION} `,
        },
        assign(
          noLoopButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .5rem; box-sizing: border-box;`,
            createNotLoopingIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.noLoopingButtonlabel,
          ).enable(),
        ).body,
        assign(
          loopButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createLoopingIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.loopingButtonLabel,
          ).enable(),
        ).body,
        assign(
          danmakuButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createDanmakuIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.danmakuButtonLabel,
          ).enable(),
        ).body,
        assign(
          noDanmakuButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .4rem; box-sizing: border-box;`,
            createNoDanmakuIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.noDanmakuButtonLabel,
          ).enable(),
        ).body,
        assign(
          settingsButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .3rem; box-sizing: border-box;`,
            createSettingsIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.playerSettingsButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(
        rightButtonsContainerRef,
        {
          class: "player-right-buttons-container",
          style: `position: absolute; right: 0; bottom: 10rem; padding: 0 ${Player.EDGE_PADDING}rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem; ${Player.OPACITY_TRANSITION}`,
        },
        assign(
          volumeSliderRef,
          SliderInput.create(Orientation.VERTICAL, 7, "", {
            start: 0,
            end: 1,
          }),
        ).body,
        assign(
          volumeButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .1rem; box-sizing: border-box;`,
            createVolumeFullIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeButtonLabel,
          ).enable(),
        ).body,
        assign(
          volumeMutedButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .1rem; box-sizing: border-box;`,
            createVolumeMutedIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeMutedButtonLabel,
          ).enable(),
        ).body,
        assign(
          likeDislikeButtonsRef,
          LikeDislikeButtons.create(
            `display: flex; flex-flow: column nowrap; gap: 2rem;`,
            0.3,
            TooltipPosition.LEFT,
          ).enable(show.liking),
        ).body,
        assign(
          commentButtonRef,
          IconButton.create(
            `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .3rem; box-sizing: border-box;`,
            createCommentIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.showCommentButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(
        bottomButtonsContainerRef,
        {
          class: "player-bottom-buttons-container",
          style: `position: absolute; bottom: 0; left: 0; width: 100%; display: flex; flex-flow: column nowrap; ${Player.OPACITY_TRANSITION}`,
        },
        E.divRef(
          progressBarRef,
          {
            class: "player-progress-bar",
            style: `position: relative; width: 100%; height: 1rem; box-sizing: border-box; transition: padding .2s linear; touch-action: none;`,
          },
          E.div(
            {
              class: "player-progress-background",
              style: `position: relative; height: 100%; width: 100%; background-color: ${SCHEME.neutral2};`,
            },
            E.divRef(progressBarBufferRef, {
              class: "player-progress-bar-buffer",
              style: `height: 100%; width: 0; background-color: ${SCHEME.neutral1};`,
            }),
            E.divRef(progressBarFillerRef, {
              class: "player-progress-bar-filler",
              style: `position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: ${SCHEME.primary1};`,
            }),
          ),
          E.divRef(pointedTimestampRef, {
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
            currentTimeTextRef,
            {
              class: "player-video-current-time",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
            },
            E.text(formatSecondsAsHHMMSS(0)),
          ),
          assign(
            skipBackwardButtonRef,
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
              speedDownButtonRef,
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
            E.divRef(currentPlaybackSpeedRef, {
              class: "player-current-playback-speed",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; width: 4rem; text-align: center;`,
            }),
            assign(
              speedUpButtonRef,
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
            skipForwardButtonRef,
            IconButton.create(
              `width: ${ICON_S}rem; height: ${ICON_S}rem; padding: .7rem; box-sizing: border-box;`,
              createSkipForwardIcon(SCHEME.neutral1),
              TooltipPosition.TOP,
              LOCALIZED_TEXT.skipForwardButtonLabel,
            ).enable(),
          ).body,
          E.divRef(
            durationTextRef,
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
          moreInfoButtonRef,
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
        bottomProgressBarRef,
        {
          class: "player-bottom-progress-bar",
          style: `position: absolute; bottom: 0; left: 0; width: 100%; height: .2rem; background-color: ${SCHEME.neutral2}; ${Player.OPACITY_TRANSITION}`,
        },
        E.divRef(bottomProgressBarBufferRef, {
          class: "player-buttom-progress-bar-buffer",
          style: `height: 100%; width: 0; background-color: ${SCHEME.neutral1};`,
        }),
        E.divRef(bottomProgressBarFillerRef, {
          class: "player-buttom-progress-bar-filler",
          style: `position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: ${SCHEME.primary1};`,
        }),
      ),
    );
    this.video_ = videoRef.val;
    this.loadingIcon = loadingIconRef.val;
    this.playingIcon = playingIconRef.val;
    this.pausedIcon = pausedIconRef.val;
    this.danmakuCanvas = danmakuCanvasRef.val;
    this.topButtonsContainer = topButtonsContainerRef.val;
    this.noLoopButton_ = noLoopButtonRef.val;
    this.loopButton_ = loopButtonRef.val;
    this.danmakuButton_ = danmakuButtonRef.val;
    this.noDanmakuButton_ = noDanmakuButtonRef.val;
    this.settingsButton_ = settingsButtonRef.val;
    this.rightButtonsContainer = rightButtonsContainerRef.val;
    this.volumeSlider = volumeSliderRef.val;
    this.volumeButton_ = volumeButtonRef.val;
    this.volumeMutedButton_ = volumeMutedButtonRef.val;
    this.likeDislikeButtons_ = likeDislikeButtonsRef.val;
    this.commentButton_ = commentButtonRef.val;
    this.bottomButtonsContainer = bottomButtonsContainerRef.val;
    this.progressBar = progressBarRef.val;
    this.progressBarBuffer = progressBarBufferRef.val;
    this.progressBarFiller = progressBarFillerRef.val;
    this.pointedTimestamp = pointedTimestampRef.val;
    this.currentTimeText = currentTimeTextRef.val;
    this.skipBackwardButton_ = skipBackwardButtonRef.val;
    this.speedDownButton_ = speedDownButtonRef.val;
    this.currentPlaybackSpeed = currentPlaybackSpeedRef.val;
    this.speedUpButton_ = speedUpButtonRef.val;
    this.skipForwardButton_ = skipForwardButtonRef.val;
    this.durationText = durationTextRef.val;
    this.moreInfoButton_ = moreInfoButtonRef.val;
    this.bottomProgressBar = bottomProgressBarRef.val;
    this.bottomProgressBarBuffer = bottomProgressBarBufferRef.val;
    this.bottomProgressBarFiller = bottomProgressBarFillerRef.val;

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
    this.video_.addEventListener("loadedmetadata", () => this.setDuration());
    this.video_.addEventListener("durationchange", () => this.setDuration());
    this.video_.addEventListener("progress", () => this.updateBufferProgress());
    this.video_.addEventListener("canplaythrough", () =>
      this.updateBufferCompleted(),
    );
    this.video_.addEventListener("playing", () => this.isPlaying());
    this.video_.addEventListener("pause", () => this.isPaused());
    this.video_.addEventListener("ended", () => this.isEnded());
    this.video_.addEventListener("waiting", () => this.isLoading());
    this.danmakuCanvas.on("passThroughClick", () => this.toggleVideoPlay());
    this.volumeButton_.on("action", () => this.mute());
    this.volumeMutedButton_.on("action", () => this.unmute());
    this.volumeSlider.on("change", (value) => this.setVolume(value));
    this.likeDislikeButtons_.on("like", (liking) => this.likeShow(liking));
    this.commentButton_.on("action", () => this.emit("showComments"));
    this.progressBar.addEventListener("pointerover", (event) =>
      this.hoverProgressBar(event),
    );
    this.progressBar.addEventListener("pointerdown", (event) =>
      this.startSeekingNewPosition(event),
    );
    this.progressBar.addEventListener("pointermove", (event) =>
      this.moveToSeekNewPosition(event),
    );
    this.progressBar.addEventListener("pointerup", (event) =>
      this.stopSeeking(event),
    );
    this.progressBar.addEventListener("pointerout", () =>
      this.leaveProgressBar(),
    );
    this.speedDownButton_.on("action", () => this.speedDownOnce());
    this.speedUpButton_.on("action", () => this.speedUpOnce());
    this.skipBackwardButton_.on("action", () => this.skipBackward());
    this.skipForwardButton_.on("action", () => this.skipForward());
    this.noLoopButton_.on("action", () => this.startLooping());
    this.loopButton_.on("action", () => this.stopLooping());
    this.danmakuButton_.on("action", () => this.disableDanmaku());
    this.noDanmakuButton_.on("action", () => this.enableDanmaku());
    this.settingsButton_.on("action", () => this.emit("showSettings"));
    this.moreInfoButton_.on("action", () => this.emit("showMoreInfo"));
  }

  private showAllActions(): void {
    this.topButtonsContainer.style.opacity = `1`;
    this.rightButtonsContainer.style.opacity = `1`;
    this.bottomButtonsContainer.style.opacity = `1`;
    this.bottomProgressBar.style.opacity = `0`;
  }

  private hideAllActions(): void {
    this.topButtonsContainer.style.opacity = `0`;
    this.rightButtonsContainer.style.opacity = `0`;
    this.bottomButtonsContainer.style.opacity = `0`;
    this.bottomProgressBar.style.opacity = `1`;
  }

  private showLoadingIcon(): void {
    this.loadingIcon.style.opacity = `1`;
  }

  private hideLoadingIcon(): void {
    this.loadingIcon.style.opacity = `0`;
  }

  private setDuration(): void {
    this.duration = this.video_.duration;
    this.durationText.textContent = formatSecondsAsHHMMSS(this.video_.duration);
  }

  private updateBufferProgress(): void {
    if (this.duration === 0) {
      return;
    }
    let currentTime = this.video_.currentTime;
    for (let i = 0; i < this.video_.buffered.length; i++) {
      if (
        this.video_.buffered.start(i) <= currentTime &&
        this.video_.buffered.end(i) >= currentTime
      ) {
        let percentage = (this.video_.buffered.end(i) / this.duration) * 100;
        this.progressBarBuffer.style.width = `${percentage}%`;
        this.bottomProgressBarBuffer.style.width = `${percentage}%`;
        break;
      }
    }
  }

  private updateBufferCompleted(): void {
    this.progressBarBuffer.style.width = `100%`;
    this.bottomProgressBarBuffer.style.width = `100%`;
    this.emit("canplaythrough");
  }

  private isPlaying(): void {
    this.danmakuCanvas.play();
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
      this.progressBarFiller.style.width = `0`;
      this.bottomProgressBarFiller.style.width = `0`;
    } else {
      let currentTime = this.video_.currentTime;
      let percentage = (currentTime / this.duration) * 100;
      this.progressBarFiller.style.width = `${percentage}%`;
      this.bottomProgressBarFiller.style.width = `${percentage}%`;
      this.currentTimeText.textContent = formatSecondsAsHHMMSS(currentTime);
    }
  }

  private isPaused(): void {
    this.danmakuCanvas.pause();
    this.clearTimeout(this.updateProgressId);
    this.updateProgress();
    this.hideLoadingIcon();
  }

  private isEnded(): void {
    this.isPaused();
    this.emit("ended");
  }

  private isLoading(): void {
    this.danmakuCanvas.pause();
    this.showLoadingIcon();
  }

  private toggleVideoPlay(): void {
    if (this.video_.paused) {
      this.video_.play();
      this.animateStatusIcon(this.playingIcon);
    } else {
      this.video_.pause();
      this.animateStatusIcon(this.pausedIcon);
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
    this.progressBar.style.paddingTop = `0`;
    this.setPointedTimestamp(event);
    this.pointedTimestamp.style.display = `block`;
  }

  private setPointedTimestamp(event: PointerEvent): number {
    let rect = this.progressBar.getBoundingClientRect();
    let ratio = Math.min(1, Math.max(0, (event.clientX - rect.x) / rect.width));
    let timestamp = ratio * this.duration;
    if (ratio < 0.5) {
      this.pointedTimestamp.style.left = `${ratio * 100}%`;
      this.pointedTimestamp.style.right = ``;
    } else {
      this.pointedTimestamp.style.left = ``;
      this.pointedTimestamp.style.right = `${(1 - ratio) * 100}%`;
    }
    this.pointedTimestamp.textContent = formatSecondsAsHHMMSS(timestamp);
    return timestamp;
  }

  private startSeekingNewPosition(event: PointerEvent): void {
    let timestamp = this.setPointedTimestamp(event);
    this.isSeeking = true;
    this.progressBar.setPointerCapture(event.pointerId);
    this.seekNewPosition(timestamp);
  }

  private seekNewPosition(timestamp: number): void {
    this.video_.currentTime = timestamp;
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
    this.progressBar.releasePointerCapture(event.pointerId);
  }

  private leaveProgressBar(): void {
    this.progressBar.style.paddingTop = `.8rem`;
    this.pointedTimestamp.style.display = `none`;
  }

  private skipBackward(): void {
    this.video_.currentTime = Math.max(0, this.video_.currentTime - 5);
    this.updateProgress();
  }

  private skipForward(): void {
    this.video_.currentTime = Math.min(
      this.duration,
      this.video_.currentTime + 5,
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
      this.speedDownButton_.disable();
    } else {
      this.speedDownButton_.enable();
    }
    if (this.playbackSpeedIndex >= Player.PLAYBACK_SPEEDS.length - 1) {
      this.speedUpButton_.disable();
    } else {
      this.speedUpButton_.enable();
    }
    this.currentPlaybackSpeed.textContent = `${
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex]
    }x`;
    this.video_.playbackRate = Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex];

    // Volume & muted
    this.volumeSlider.setValue(this.playerSettings.videoSettings.volume);
    if (this.playerSettings.videoSettings.muted) {
      this.video_.volume = 0;
      this.volumeButton_.hide();
      this.volumeMutedButton_.show();
    } else {
      this.video_.volume = this.playerSettings.videoSettings.volume;
      this.volumeButton_.show();
      this.volumeMutedButton_.hide();
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
    this.video_.loop = true;
    this.noLoopButton_.hide();
    this.loopButton_.show();
  }

  private stopLooping(): void {
    this.video_.loop = false;
    this.noLoopButton_.show();
    this.loopButton_.hide();
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
      this.danmakuButton_.show();
      this.noDanmakuButton_.hide();
    } else {
      this.danmakuButton_.hide();
      this.noDanmakuButton_.show();
    }
    this.danmakuCanvas.updateSettings();
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
    this.danmakuCanvas.add(comments);
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
    this.danmakuCanvas.remove();
  }

  // Visible for testing
  public get video() {
    return this.video_;
  }
  public get skipBackwardButton() {
    return this.skipBackwardButton_;
  }
  public get skipForwardButton() {
    return this.skipForwardButton_;
  }
  public get speedDownButton() {
    return this.speedDownButton_;
  }
  public get speedUpbutton() {
    return this.speedUpButton_;
  }
  public get noLoopButton() {
    return this.noLoopButton_;
  }
  public get loopButton() {
    return this.loopButton_;
  }
  public get danmakuButton() {
    return this.danmakuButton_;
  }
  public get noDanmakuButton() {
    return this.noDanmakuButton_;
  }
  public get settingsButton() {
    return this.settingsButton_;
  }
  public get volumeButton() {
    return this.volumeButton_;
  }
  public get volumeMutedButton() {
    return this.volumeMutedButton_;
  }
  public get likeDislikeButtons() {
    return this.likeDislikeButtons_;
  }
  public get commentButton() {
    return this.commentButton_;
  }
  public get moreInfoButton() {
    return this.moreInfoButton_;
  }
  public showActions(): void {
    this.hoverObserver.emit("hover");
  }
  public hideActions(): void {
    this.hoverObserver.emit("leave");
  }
}
