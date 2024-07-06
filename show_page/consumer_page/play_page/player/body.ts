import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { HoverObserver, Mode } from "../../../../common/hover_observer";
import { IconButton, TooltipPosition } from "../../../../common/icon_button";
import {
  createArrowIcon,
  createCommentIcon,
  createDanmakuIcon,
  createFastForwardIcon,
  createInfoIcon,
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
} from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { FONT_L, FONT_M, ICON_S } from "../../../../common/sizes";
import { Orientation, Slider } from "../../../../common/slider";
import { formatSecondsAsHHMMSS } from "../../../../common/timestamp_formatter";
import { PLAYBACK_SPEED_DEFAULT, VOLUME_RANGE } from "../common/defaults";
import { DanmakuCanvas } from "./danmaku_canvas/body";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import { Episode } from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import {
  DanmakuSettings,
  PlayerSettings,
} from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface Player {
  on(event: "back", listener: () => void): this;
  on(event: "showComments", listener: () => void): this;
  on(event: "showSettings", listener: () => void): this;
  on(event: "showMoreInfo", listener: () => void): this;
  on(event: "updateSettings", listener: () => void): this;
  on(event: "playing", listener: () => void): this;
  on(event: "notPlaying", listener: () => void): this;
  on(event: "canplaythrough", listener: () => void): this;
  on(event: "ended", listener: () => void): this;
}

export class Player extends EventEmitter {
  public static create(
    playerSettings: PlayerSettings,
    episode: Episode,
  ): Player {
    return new Player(window, DanmakuCanvas.create, playerSettings, episode);
  }

  private static EDGE_PADDING = 1; // rem;
  private static PLAYBACK_SPEEDS = [
    0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4,
  ];
  private static RESERVED_BOTTOM_MARGIN = 50; // px
  private static OPACITY_TRANSITION = `transition: opacity .2s linear;`;

  public body: HTMLDivElement;
  public video = new Ref<HTMLVideoElement>();
  private loadingIcon = new Ref<HTMLDivElement>();
  private playingIcon = new Ref<HTMLDivElement>();
  private pausedIcon = new Ref<HTMLDivElement>();
  protected danmakuCanvas = new Ref<DanmakuCanvas>();
  private topButtonsContainer = new Ref<HTMLDivElement>();
  public backButton = new Ref<IconButton>();
  public noLoopButton = new Ref<IconButton>();
  public loopButton = new Ref<IconButton>();
  public danmakuButton = new Ref<IconButton>();
  public noDanmakuButton = new Ref<IconButton>();
  public settingsButton = new Ref<IconButton>();
  private rightButtonsContainer = new Ref<HTMLDivElement>();
  private volumeSlider = new Ref<Slider>();
  public volumeButton = new Ref<IconButton>();
  public volumeMutedButton = new Ref<IconButton>();
  public commentButton = new Ref<IconButton>();
  public moreInfoButton = new Ref<IconButton>();
  private bottomProgressBar = new Ref<HTMLDivElement>();
  private bottomProgressBarBuffer = new Ref<HTMLDivElement>();
  private bottomProgressBarFiller = new Ref<HTMLDivElement>();
  private bottomStatus = new Ref<HTMLDivElement>();
  private bottomButtonsContainer = new Ref<HTMLDivElement>();
  private progressBar = new Ref<HTMLDivElement>();
  private progressBarBuffer = new Ref<HTMLDivElement>();
  private progressBarFiller = new Ref<HTMLDivElement>();
  private pointedTimestamp = new Ref<HTMLDivElement>();
  private currentTimeText = new Ref<HTMLDivElement>();
  public skipBackwardButton = new Ref<IconButton>();
  public speedDownButton = new Ref<IconButton>();
  private currentPlaybackSpeed = new Ref<HTMLDivElement>();
  public speedUpButton = new Ref<IconButton>();
  public skipForwardButton = new Ref<IconButton>();
  private durationText = new Ref<HTMLDivElement>();
  private hoverObserver: HoverObserver;
  private updateProgressId = -1;
  private playbackSpeedIndex: number;
  private duration = 0;
  private isSeeking = false;
  private isLooping = false;
  public autoPlay = true;

  public constructor(
    private window: Window,
    private createDanmakuCanvas: (
      reservedBottomMargin: number,
      danmakuSettings: DanmakuSettings,
    ) => DanmakuCanvas,
    private playerSettings: PlayerSettings,
    private episode: Episode,
  ) {
    super();
    this.body = E.div(
      {
        class: "player",
        style: `flex: 1 1 0; min-width: 0; min-height: 0; width: 100%; height: 100%; position: relative; background-color: ${SCHEME.neutral4};`,
      },
      E.videoRef(this.video, {
        class: "player-video",
        style: `width: 100%; height: 100%; object-fit: contain;`,
        src: this.episode.videoPath,
      }),
      E.divRef(
        this.loadingIcon,
        {
          class: "player-video-loading-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 8rem; height: 8rem; ${Player.OPACITY_TRANSITION});`,
        },
        createLoadingIcon(SCHEME.neutral1),
      ),
      E.divRef(
        this.playingIcon,
        {
          class: "player-video-playing-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 8rem; height: 8rem; opacity: 0;`,
        },
        createPlayIcon(SCHEME.neutral1),
      ),
      E.divRef(
        this.pausedIcon,
        {
          class: "player-video-paused-icon",
          style: `position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 8rem; height: 8rem; opacity: 0;`,
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
          style: `position: absolute; top: 0; left: 0; width: 100%; box-sizing: border-box; padding: .5rem ${Player.EDGE_PADDING}rem 0; display: flex; flex-flow: row nowrap; justify-content: space-between; ${Player.OPACITY_TRANSITION} `,
        },
        assign(
          this.backButton,
          IconButton.create(
            ICON_S,
            0.5,
            "",
            createArrowIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.backLabel,
          ).enable(),
        ).body,
        E.div(
          {
            class: "player-top-buttons-right-side-container",
            style: `display: flex; flex-flow: row nowrap; gap: 2rem;`,
          },
          assign(
            this.noLoopButton,
            IconButton.create(
              ICON_S,
              0.5,
              "",
              createNotLoopingIcon(SCHEME.neutral1),
              TooltipPosition.BOTTOM,
              LOCALIZED_TEXT.noLoopingButtonlabel,
            ).enable(),
          ).body,
          assign(
            this.loopButton,
            IconButton.create(
              ICON_S,
              0.4,
              "",
              createLoopingIcon(SCHEME.neutral1),
              TooltipPosition.BOTTOM,
              LOCALIZED_TEXT.loopingButtonLabel,
            ).enable(),
          ).body,
          assign(
            this.danmakuButton,
            IconButton.create(
              ICON_S,
              0.4,
              "",
              createDanmakuIcon(SCHEME.neutral1),
              TooltipPosition.BOTTOM,
              LOCALIZED_TEXT.danmakuButtonLabel,
            ).enable(),
          ).body,
          assign(
            this.noDanmakuButton,
            IconButton.create(
              ICON_S,
              0.4,
              "",
              createNoDanmakuIcon(SCHEME.neutral1),
              TooltipPosition.BOTTOM,
              LOCALIZED_TEXT.noDanmakuButtonLabel,
            ).enable(),
          ).body,
          assign(
            this.settingsButton,
            IconButton.create(
              ICON_S,
              0.3,
              "",
              createSettingsIcon(SCHEME.neutral1),
              TooltipPosition.BOTTOM,
              LOCALIZED_TEXT.playerSettingsButtonLabel,
            ).enable(),
          ).body,
        ),
      ),
      E.divRef(
        this.rightButtonsContainer,
        {
          class: "player-right-buttons-container",
          style: `position: absolute; right: 0; bottom: 7rem; padding: 0 ${Player.EDGE_PADDING}rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem; ${Player.OPACITY_TRANSITION}`,
        },
        assign(
          this.volumeSlider,
          Slider.create(
            Orientation.VERTICAL,
            `7rem`,
            `1rem`,
            VOLUME_RANGE.minValue,
            VOLUME_RANGE.maxValue,
            "",
          ),
        ).body,
        assign(
          this.volumeButton,
          IconButton.create(
            ICON_S,
            0.1,
            "",
            createVolumeFullIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.volumeMutedButton,
          IconButton.create(
            ICON_S,
            0.1,
            "",
            createVolumeMutedIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.volumeMutedButtonLabel,
          ).enable(),
        ).body,
        // assign(
        //   this.likeDislikeButtons,
        //   LikeDislikeButtons.create(
        //     `display: flex; flex-flow: column nowrap; gap: 2rem;`,
        //     0.3,
        //     TooltipPosition.LEFT,
        //   ).enable(show.liking),
        // ).body,
        assign(
          this.commentButton,
          IconButton.create(
            ICON_S,
            0.3,
            "",
            createCommentIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.showCommentButtonLabel,
          ).enable(),
        ).body,
        assign(
          this.moreInfoButton,
          IconButton.create(
            ICON_S,
            0.2,
            "",
            createInfoIcon(SCHEME.neutral1),
            TooltipPosition.LEFT,
            LOCALIZED_TEXT.moreInfoButtonLabel,
          ).enable(),
        ).body,
      ),
      E.divRef(this.bottomStatus, {
        class: "player-bottom-status",
        style: `opacity: 0; position: absolute; bottom: 0; left: 0; width: 100%; padding: 1rem; box-sizing: border-box; text-align: center; font-size: ${FONT_L}rem; color: ${SCHEME.error0}; background-color: ${SCHEME.neutral4};`,
      }),
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
      E.divRef(
        this.bottomButtonsContainer,
        {
          class: "player-bottom-buttons-container",
          style: `position: absolute; bottom: 0; left: 0; width: 100%; padding-bottom: .5rem; display: flex; flex-flow: column nowrap; ${Player.OPACITY_TRANSITION}`,
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
            this.skipBackwardButton,
            IconButton.create(
              ICON_S,
              0.7,
              "",
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
              this.speedDownButton,
              IconButton.create(
                ICON_S,
                0.5,
                "",
                createFastForwardIcon(
                  "currentColor",
                  `transform: rotate(90deg);`,
                ),
                TooltipPosition.TOP,
                LOCALIZED_TEXT.speedDownButtonLabel,
              ),
            ).body,
            E.divRef(this.currentPlaybackSpeed, {
              class: "player-current-playback-speed",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; width: 4rem; text-align: center;`,
            }),
            assign(
              this.speedUpButton,
              IconButton.create(
                ICON_S,
                0.5,
                "",
                createFastForwardIcon(
                  "currentColor",
                  `transform: rotate(-90deg);`,
                ),
                TooltipPosition.TOP,
                LOCALIZED_TEXT.speedUpButtonLabel,
              ),
            ).body,
          ),
          assign(
            this.skipForwardButton,
            IconButton.create(
              ICON_S,
              0.7,
              "",
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
      ),
    );
    this.hideAllActions();
    this.hideLoadingIcon();
    this.leaveProgressBar();
    this.stopLooping();
    this.applyVideoSettings();
    this.applyDanmakuSettings();
    this.hoverObserver = HoverObserver.create(this.body, Mode.HOVER_DELAY_LEAVE)
      .on("hover", () => this.showAllActions())
      .on("leave", () => this.hideAllActions());
    this.video.val.addEventListener("loadedmetadata", () =>
      this.setDurationAndStartPlaying(),
    );
    this.video.val.addEventListener("progress", () =>
      this.updateBufferProgress(),
    );
    this.video.val.addEventListener("canplaythrough", () =>
      this.updateBufferCompleted(),
    );
    this.video.val.addEventListener("playing", () => this.isPlaying());
    this.video.val.addEventListener("pause", () => this.isPaused());
    this.video.val.addEventListener("ended", () => this.isEnded());
    this.video.val.addEventListener("waiting", () => this.isLoading());
    this.danmakuCanvas.val.on("passThroughClick", () => this.toggleVideoPlay());
    this.volumeButton.val.on("action", () => this.mute());
    this.volumeMutedButton.val.on("action", () => this.unmute());
    this.volumeSlider.val.on("change", (value) => this.setVolume(value));
    this.commentButton.val.on("action", () => this.emit("showComments"));
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
    this.speedDownButton.val.on("action", () => this.speedDownOnce());
    this.speedUpButton.val.on("action", () => this.speedUpOnce());
    this.skipBackwardButton.val.on("action", () => this.skipBackward());
    this.skipForwardButton.val.on("action", () => this.skipForward());
    this.noLoopButton.val.on("action", () => this.startLooping());
    this.loopButton.val.on("action", () => this.stopLooping());
    this.danmakuButton.val.on("action", () => this.disableDanmaku());
    this.noDanmakuButton.val.on("action", () => this.enableDanmaku());
    this.settingsButton.val.on("action", () => this.emit("showSettings"));
    this.moreInfoButton.val.on("action", () => this.emit("showMoreInfo"));
    this.backButton.val.on("action", () => this.emit("back"));
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

  private setDurationAndStartPlaying(): void {
    this.duration = this.video.val.duration;
    this.durationText.val.textContent = formatSecondsAsHHMMSS(
      this.video.val.duration,
    );
    if (
      this.episode.continueTimestamp &&
      this.episode.continueTimestamp > 0 &&
      this.episode.continueTimestamp < this.duration
    ) {
      this.video.val.currentTime = this.episode.continueTimestamp;
    }
    if (this.autoPlay) {
      this.video.val.play();
    }
  }

  private updateBufferProgress(): void {
    if (this.duration === 0) {
      return;
    }
    let currentTime = this.video.val.currentTime;
    for (let i = 0; i < this.video.val.buffered.length; i++) {
      if (
        this.video.val.buffered.start(i) <= currentTime &&
        this.video.val.buffered.end(i) >= currentTime
      ) {
        let percentage = (this.video.val.buffered.end(i) / this.duration) * 100;
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
    this.updateProgressContinuously();
    this.hideLoadingIcon();
    this.emit("playing");
  }

  private updateProgressContinuously = (): void => {
    this.updateProgress();
    this.updateProgressId = this.window.requestAnimationFrame(
      this.updateProgressContinuously,
    );
  };

  private updateProgress(): void {
    if (this.duration === 0) {
      this.progressBarFiller.val.style.width = `0`;
      this.bottomProgressBarFiller.val.style.width = `0`;
    } else {
      let currentTime = this.video.val.currentTime;
      let percentage = (currentTime / this.duration) * 100;
      this.progressBarFiller.val.style.width = `${percentage}%`;
      this.bottomProgressBarFiller.val.style.width = `${percentage}%`;
      this.currentTimeText.val.textContent = formatSecondsAsHHMMSS(currentTime);
    }
  }

  private isPaused(): void {
    this.danmakuCanvas.val.pause();
    this.window.cancelAnimationFrame(this.updateProgressId);
    this.updateProgress();
    this.hideLoadingIcon();
    this.emit("notPlaying");
  }

  private isEnded(): void {
    // "pause" event is also expected to be fired to call isPaused().
    this.emit("ended");
    if (this.isLooping) {
      this.video.val.play();
    }
  }

  private isLoading(): void {
    this.danmakuCanvas.val.pause();
    this.showLoadingIcon();
    this.emit("notPlaying");
  }

  private toggleVideoPlay(): void {
    if (this.video.val.paused) {
      this.video.val.play();
      this.animateStatusIcon(this.playingIcon.val);
    } else {
      this.video.val.pause();
      this.animateStatusIcon(this.pausedIcon.val);
    }
  }

  public interrupt(reason: string): void {
    this.video.val.pause();
    this.bottomStatus.val.textContent = reason;
    this.bottomStatus.val.animate(
      [
        { opacity: "0" },
        { opacity: "1", offset: 0.1 },
        { opacity: "1", offset: 0.9 },
        { opacity: "0" },
      ],
      5000,
    );
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
    this.video.val.currentTime = timestamp;
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
    this.video.val.currentTime = Math.max(0, this.video.val.currentTime - 5);
    this.updateProgress();
  }

  private skipForward(): void {
    this.video.val.currentTime = Math.min(
      this.duration,
      this.video.val.currentTime + 5,
    );
    this.updateProgress();
  }

  private applyVideoSettings(): void {
    // Playback speed
    this.playbackSpeedIndex = Player.PLAYBACK_SPEEDS.indexOf(
      this.playerSettings.videoSettings.playbackSpeed,
    );
    if (this.playbackSpeedIndex === -1) {
      this.playbackSpeedIndex = Player.PLAYBACK_SPEEDS.indexOf(
        PLAYBACK_SPEED_DEFAULT,
      );
    }
    if (this.playbackSpeedIndex <= 0) {
      this.speedDownButton.val.disable();
    } else {
      this.speedDownButton.val.enable();
    }
    if (this.playbackSpeedIndex >= Player.PLAYBACK_SPEEDS.length - 1) {
      this.speedUpButton.val.disable();
    } else {
      this.speedUpButton.val.enable();
    }
    this.currentPlaybackSpeed.val.textContent = `${
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex]
    }x`;
    this.video.val.playbackRate =
      Player.PLAYBACK_SPEEDS[this.playbackSpeedIndex];

    // Volume & muted
    this.volumeSlider.val.setValue(this.playerSettings.videoSettings.volume);
    if (this.playerSettings.videoSettings.muted) {
      this.video.val.volume = 0;
      this.volumeButton.val.hide();
      this.volumeMutedButton.val.show();
    } else {
      this.video.val.volume = this.playerSettings.videoSettings.volume;
      this.volumeButton.val.show();
      this.volumeMutedButton.val.hide();
    }
  }

  private saveVideoSettings(): void {
    this.applyVideoSettings();
    this.emit("updateSettings");
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
    this.isLooping = true;
    this.noLoopButton.val.hide();
    this.loopButton.val.show();
  }

  private stopLooping(): void {
    this.isLooping = false;
    this.noLoopButton.val.show();
    this.loopButton.val.hide();
  }

  private disableDanmaku(): void {
    this.playerSettings.danmakuSettings.enable = false;
    this.saveDanmakuSettings();
  }

  private enableDanmaku(): void {
    this.playerSettings.danmakuSettings.enable = true;
    this.saveDanmakuSettings();
  }

  private applyDanmakuSettings(): void {
    if (this.playerSettings.danmakuSettings.enable) {
      this.danmakuButton.val.show();
      this.noDanmakuButton.val.hide();
    } else {
      this.danmakuButton.val.hide();
      this.noDanmakuButton.val.show();
    }
    this.danmakuCanvas.val.updateSettings();
  }

  private saveDanmakuSettings(): void {
    this.applyDanmakuSettings();
    this.emit("updateSettings");
  }

  public applySettings(): void {
    this.applyDanmakuSettings();
    this.applyVideoSettings();
  }

  // Milliseconds
  public getCurrentVideoTimestampMs(): number {
    return this.video.val.currentTime * 1000;
  }

  public addDanmaku(comments: Array<Comment>): void {
    this.danmakuCanvas.val.add(comments);
  }

  public remove(): void {
    this.video.val.pause();
    this.body.remove();
  }

  // Visible for testing
  public showActions(): void {
    this.hoverObserver.emit("hover");
  }
  public hideActions(): void {
    this.hoverObserver.emit("leave");
  }
}
