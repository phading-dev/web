import EventEmitter from "events";
import Hls from "hls.js";
import { SCHEME } from "../../../../common/color_scheme";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import {
  createCommentIcon,
  createDashedCircleIcon,
  createExitFullscreenIcon,
  createFastForwardIcon,
  createFilledExclamationMarkInACircle,
  createFullscreenIcon,
  createLoadingIcon,
  createPauseIcon,
  createPlayIcon,
  createPlayNextIcon,
  createSettingsIcon,
  createSkipBackwardBy10Icon,
  createSkipForwardBy10Icon,
  createVolumeFullIcon,
  createVolumeLowIcon,
} from "../../../../common/icons";
import { getRootFontSize } from "../../../../common/root_font_size";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  ICON_BUTTON_L,
  ICON_BUTTON_XL,
  ICON_XL,
  ICON_XXL,
} from "../../../../common/sizes";
import {
  PLAYBACK_SPEED_DEFAULT,
  PLAYBACK_SPEED_VALUES,
  VOLUME_RANGE,
} from "../common/defaults";
import { fuzzyMatch } from "../common/fuzzy_match";
import { VOLUME_SCALE } from "./scales";
import { VideoPlayerSettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface Player {
  on(event: "back", listener: () => void): this;
  on(
    event: "subtitleTracksInited",
    listener: (tracks: Array<string>, initIndex: number) => void,
  ): this;
  on(
    event: "audioTracksInited",
    listener: (tracks: Array<string>, initIndex: number) => void,
  ): this;
  on(event: "playing", listener: () => void): this;
  on(event: "notPlaying", listener: () => void): this;
  on(event: "clearChats", listener: () => void): this;
  on(event: "playNext", listener: () => void): this;
  on(event: "showInfo", listener: () => void): this;
  on(event: "showComments", listener: () => void): this;
  on(event: "showSettings", listener: () => void): this;
  on(event: "goFullscreen", listener: () => void): this;
  on(event: "exitFullscreen", listener: () => void): this;
  on(event: "saveSettings", listener: () => void): this;
  on(event: "metadataLoaded", listener: () => void): this;
}

export class Player extends EventEmitter {
  private static VOLUME_STEP = 1;
  private static SKIP_STEP_SEC = 10;
  private static DELAY_TO_HIDE_CONTROLS_MS = 2000;
  private static LAYOUT_BREAKPOINT = 60; // rem

  public elements: Array<HTMLElement>;
  public video = new Ref<HTMLVideoElement>();
  private bottomError = new Ref<HTMLDivElement>();
  private controlsContainer = new Ref<HTMLDivElement>();
  private centerControlsContainer = new Ref<HTMLDivElement>();
  public backButton = new Ref<SimpleIconButton>();
  public volumeDownButton = new Ref<SimpleIconButton>();
  private currentVolumeIcon = new Ref<HTMLDivElement>();
  public volumeUpButton = new Ref<SimpleIconButton>();
  public skipBackwardButton = new Ref<SimpleIconButton>();
  public playButton = new Ref<SimpleIconButton>();
  public pauseButton = new Ref<SimpleIconButton>();
  public skipForwardButton = new Ref<SimpleIconButton>();
  public playbackSpeedDownButton = new Ref<SimpleIconButton>();
  private currentPlaybackSpeed = new Ref<HTMLDivElement>();
  public playbackSpeedUpButton = new Ref<SimpleIconButton>();
  public playNextButton = new Ref<SimpleIconButton>();
  public showInfoButton = new Ref<SimpleIconButton>();
  public showCommentsButton = new Ref<SimpleIconButton>();
  public showSettingsButton = new Ref<SimpleIconButton>();
  public fullscreenButton = new Ref<SimpleIconButton>();
  public exitFullscreenButton = new Ref<SimpleIconButton>();
  private progressBar = new Ref<HTMLDivElement>();
  private progressBarBuffer = new Ref<HTMLDivElement>();
  private progressBarFiller = new Ref<HTMLDivElement>();
  private pointedTimestamp = new Ref<HTMLDivElement>();
  private currentTimeText = new Ref<Text>();
  private durationText = new Ref<Text>();
  private loadingIcon = new Ref<HTMLDivElement>();
  public hls: Hls;
  private duration = 0;
  private updateProgressId = -1;
  private isSeeking = false;
  private playbackSpeedIndex = 0;
  private resizeObserver: ResizeObserver;
  private hideTimeoutId: number;
  public autoPlay = true; // for testing purpose

  public constructor(
    private window: Window,
    private settings: VideoPlayerSettings,
    videoUrl: string,
    private continueTimestampMs: number,
    hasNext: boolean,
  ) {
    super();
    this.elements = [
      E.videoRef(this.video, {
        class: "player-video",
        style: `width: 100%; height: 100%; object-fit: contain;`,
      }),
      E.divRef(this.bottomError, {
        class: "player-bottom-status",
        style: `opacity: 0; position: absolute; bottom: 0; left: 0; width: 100%; padding: 1rem; box-sizing: border-box; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.error0}; background-color: ${SCHEME.neutral4};`,
      }),
      E.divRef(
        this.controlsContainer,
        {
          class: "player-controls",
          style: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-sizing: border-box; padding-bottom: .2rem; background-color: ${SCHEME.neutral4Translucent}; display: flex; flex-flow: column nowrap; transition: opacity .2s;`,
        },
        assign(this.backButton, createBackButton("")).body,
        E.divRef(
          this.centerControlsContainer,
          {
            class: "player-center-controls",
            style: `flex: 1 0 auto; display: flex; flex-flow: row wrap; justify-content: space-evenly; align-items: center;`,
          },
          E.div(
            {
              class: "player-volume-controls",
              style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1.5rem;`,
            },
            assign(
              this.volumeDownButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createVolumeLowIcon("currentColor"),
              ),
            ).body,
            E.divRef(this.currentVolumeIcon, {
              class: "player-volume-number",
              style: `width: ${ICON_XXL}rem; height: ${ICON_XXL}rem;`,
            }),
            assign(
              this.volumeUpButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createVolumeFullIcon("currentColor"),
              ),
            ).body,
          ),
          E.div(
            {
              class: "player-play-controls",
              style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
            },
            assign(
              this.skipBackwardButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createSkipBackwardBy10Icon("currentColor"),
              ).enable(),
            ).body,
            assign(
              this.playButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createPlayIcon("currentColor"),
              ).enable(),
            ).body,
            assign(
              this.pauseButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createPauseIcon("currentColor"),
              ).enable(),
            ).body,
            assign(
              this.skipForwardButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createSkipForwardBy10Icon("currentColor"),
              ).enable(),
            ).body,
          ),
          E.div(
            {
              class: "player-playback-speed-controls",
              style: `display: flex; flex-flow: row nowrap;align-items: center; gap: 1rem;`,
            },
            assign(
              this.playbackSpeedDownButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createFastForwardIcon(
                  "currentColor",
                  "transform: rotate(180deg);",
                ),
              ),
            ).body,
            E.divRef(this.currentPlaybackSpeed, {
              class: "player-playback-speed-number",
              style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; width: 4rem; text-align: center;`,
            }),
            assign(
              this.playbackSpeedUpButton,
              SimpleIconButton.create(
                ICON_BUTTON_XL,
                ICON_XXL,
                createFastForwardIcon("currentColor"),
              ),
            ).body,
          ),
        ),
        E.div(
          {
            class: "player-bottom-controls",
            style: `display: flex; flex-flow: row wrap; justify-content: flex-end; align-items: center; gap: 1.5rem; padding: 0 1.5rem;`,
          },
          assign(
            this.playNextButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createPlayNextIcon("currentColor"),
            ).enable(),
          ).body,
          assign(
            this.showInfoButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createFilledExclamationMarkInACircle("currentColor"),
            ).enable(),
          ).body,
          assign(
            this.showCommentsButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createCommentIcon("currentColor"),
            ).enable(),
          ).body,
          assign(
            this.showSettingsButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createSettingsIcon("currentColor"),
            ).enable(),
          ).body,
          assign(
            this.fullscreenButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createFullscreenIcon("currentColor"),
            ).enable(),
          ).body,
          assign(
            this.exitFullscreenButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_XL,
              createExitFullscreenIcon("currentColor"),
            ).enable(),
          ).body,
        ),
        E.divRef(
          this.progressBar,
          {
            class: "player-progress-bar",
            style: `position: relative; width: 100%; height: 1rem; margin-top: 1.5rem; box-sizing: border-box; transition: padding .2s linear; touch-action: none; cursor: pointer;`,
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
              style: `position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: ${SCHEME.progress};`,
            }),
          ),
          E.divRef(this.pointedTimestamp, {
            class: "player-pointed-timestamp",
            style: `position: absolute; bottom: 100%; padding-bottom: .3rem; font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          }),
        ),
        E.div(
          {
            class: "player-progress-line",
            style: `width: 100%; box-sizing: border-box; padding: .5rem 1rem; display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
          },
          E.div(
            {
              class: "player-video-current-time",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
            },
            E.textRef(this.currentTimeText, formatSecondsAsHHMMSS(0)),
          ),
          E.divRef(
            this.loadingIcon,
            {
              class: "player-video-loading-icon",
              style: `width: ${ICON_XL}rem; height: ${ICON_XL}rem;`,
            },
            createLoadingIcon(SCHEME.neutral1),
          ),
          E.div(
            {
              class: "player-video-current-time",
              style: `color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem;`,
            },
            E.textRef(this.durationText, formatSecondsAsHHMMSS(0)),
          ),
        ),
      ),
    ];
    this.backButton.val.on("action", () => this.emit("back"));

    this.hideLoadingIcon();
    this.hls = new Hls();
    this.hls.loadSource(videoUrl);
    this.hls.attachMedia(this.video.val);
    this.hls.once(Hls.Events.AUDIO_TRACKS_UPDATED, () =>
      this.selectInitAudioTrack(),
    );
    this.hls.once(Hls.Events.SUBTITLE_TRACKS_UPDATED, () =>
      this.selectInitSubtitleTrack(),
    );
    this.video.val.addEventListener("loadedmetadata", () =>
      this.setDurationAndStartPlaying(),
    );
    this.video.val.addEventListener("playing", () => this.isPlaying());
    this.video.val.addEventListener("play", () => this.isPlayed());
    this.video.val.addEventListener("pause", () => this.isPaused());
    this.video.val.addEventListener("waiting", () => this.isLoading());
    this.video.val.addEventListener("progress", () =>
      this.updateBufferProgress(),
    );
    this.video.val.addEventListener("ended", () => this.emit("clearChats"));
    this.video.val.addEventListener("seeking", () => this.emit("clearChats"));

    if (this.video.val.paused) {
      this.playButton.val.show();
      this.pauseButton.val.hide();
    } else {
      this.playButton.val.hide();
      this.pauseButton.val.show();
    }
    this.playButton.val.on("action", () => this.video.val.play());
    this.pauseButton.val.on("action", () => this.video.val.pause());

    this.skipBackwardButton.val.on("action", () => this.skipBackward());
    this.skipForwardButton.val.on("action", () => this.skipForward());

    this.leaveProgressBar();
    this.progressBar.val.addEventListener("pointerenter", (event) =>
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
    this.progressBar.val.addEventListener("pointerleave", () =>
      this.leaveProgressBar(),
    );

    if (hasNext) {
      this.playNextButton.val.on("action", () => this.emit("playNext"));
    } else {
      this.playNextButton.val.hide();
    }

    this.applyPlaybackSpeed();
    this.playbackSpeedDownButton.val.on("action", () => this.speedDownOnce());
    this.playbackSpeedUpButton.val.on("action", () => this.speedUpOnce());

    this.applyVolume();
    this.volumeDownButton.val.on("action", () => this.volumeDownOnce());
    this.volumeUpButton.val.on("action", () => this.volumeUpOnce());

    this.playNextButton.val.on("action", () => this.emit("playNext"));
    this.showInfoButton.val.on("action", () => this.emit("showInfo"));
    this.showCommentsButton.val.on("action", () => this.emit("showComments"));
    this.showSettingsButton.val.on("action", () => this.emit("showSettings"));

    this.exitFullscreenButton.val.hide();
    this.fullscreenButton.val.on("action", () => this.goFullscreen());
    this.exitFullscreenButton.val.on("action", () => this.exitFullscreen());

    this.resizeObserver = new ResizeObserver((entries) =>
      this.updateControlsLayout(entries[0]),
    );
    this.resizeObserver.observe(this.controlsContainer.val);

    this.hideControls();
    this.controlsContainer.val.addEventListener("pointerenter", () =>
      this.showControls(),
    );
    this.controlsContainer.val.addEventListener("pointermove", () =>
      this.showControls(),
    );
    this.centerControlsContainer.val.addEventListener("pointerdown", (event) =>
      this.toggleControls(event),
    );

    this.window.addEventListener("keydown", (event) => this.detectKeyOperation(event));
  }

  private selectInitAudioTrack(): void {
    let trackNames = this.hls.audioTracks.map((t) => t.name);
    let index = fuzzyMatch(
      this.settings.videoSettings.preferredAudioName ?? "",
      trackNames,
    );
    if (index === -1) {
      index = this.hls.audioTracks.find((t) => t.default).id;
    }
    this.selectAudioTrack(index);
    this.emit("audioTracksInited", trackNames, index);
  }

  public selectAudioTrack(index: number): void {
    this.hls.audioTrack = index;
  }

  private selectInitSubtitleTrack(): void {
    let trackNames = this.hls.subtitleTracks.map((t) => t.name);
    let index = fuzzyMatch(
      this.settings.videoSettings.preferredSubtitleName ?? "",
      trackNames,
    );
    this.hls.subtitleTrack = index;
    this.emit("subtitleTracksInited", trackNames, index);
  }

  public selectSubtitleTrack(index: number): void {
    this.hls.subtitleTrack = index;
  }

  private setDurationAndStartPlaying(): void {
    this.duration = this.video.val.duration;
    this.durationText.val.textContent = formatSecondsAsHHMMSS(
      this.video.val.duration,
    );
    this.video.val.currentTime = this.continueTimestampMs / 1000;
    this.updateProgressOnce();
    if (this.autoPlay) {
      this.video.val.play();
    }
    this.emit("metadataLoaded");
  }

  private isPlaying(): void {
    this.hideLoadingIcon();
    this.updateProgressContinuously();
    this.emit("playing");
  }

  private isPlayed(): void {
    this.playButton.val.hide();
    this.pauseButton.val.show();
  }

  private isPaused(): void {
    this.playButton.val.show();
    this.pauseButton.val.hide();
    this.cancelUpdateProgress();
    this.emit("notPlaying");
  }

  private isLoading(): void {
    this.showLoadingIcon();
    this.cancelUpdateProgress();
    this.emit("notPlaying");
  }

  private showLoadingIcon(): void {
    this.loadingIcon.val.style.opacity = `1`;
  }

  private hideLoadingIcon(): void {
    this.loadingIcon.val.style.opacity = `0`;
  }

  private updateProgressContinuously = (): void => {
    this.updateProgressOnce();
    this.updateProgressId = this.window.requestAnimationFrame(
      this.updateProgressContinuously,
    );
  };

  private updateProgressOnce(): void {
    if (this.duration === 0) {
      this.progressBarFiller.val.style.width = `0`;
    } else {
      let currentTime = this.video.val.currentTime;
      let percentage = (currentTime / this.duration) * 100;
      this.progressBarFiller.val.style.width = `${percentage}%`;
      this.currentTimeText.val.textContent = formatSecondsAsHHMMSS(currentTime);
    }
  }

  private cancelUpdateProgress(): void {
    this.window.cancelAnimationFrame(this.updateProgressId);
    this.updateProgressOnce();
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
        break;
      }
    }
  }

  private skipBackward(): void {
    this.video.val.currentTime = Math.max(
      0,
      this.video.val.currentTime - Player.SKIP_STEP_SEC,
    );
    this.updateProgressOnce();
  }

  private skipForward(): void {
    this.video.val.currentTime = Math.min(
      this.duration,
      this.video.val.currentTime + Player.SKIP_STEP_SEC,
    );
    this.updateProgressOnce();
  }

  private updateControlsLayout(entry: ResizeObserverEntry): void {
    let newWidth: number;
    if (entry.contentBoxSize) {
      newWidth = entry.contentBoxSize[0].inlineSize;
    } else {
      newWidth = entry.contentRect.width;
    }
    if (newWidth < Player.LAYOUT_BREAKPOINT * getRootFontSize()) {
      this.centerControlsContainer.val.style.flexFlow = `column nowrap`;
    } else {
      this.centerControlsContainer.val.style.flexFlow = `row nowrap`;
    }
  }

  private hoverProgressBar(event: PointerEvent): void {
    this.progressBar.val.style.paddingTop = `0`;
    this.showPointedTimestamp(event);
    this.pointedTimestamp.val.style.display = `block`;
  }

  private showPointedTimestamp(event: PointerEvent): number {
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
    let timestamp = this.showPointedTimestamp(event);
    this.isSeeking = true;
    this.progressBar.val.setPointerCapture(event.pointerId);
    this.seekNewPosition(timestamp);
  }

  private seekNewPosition(timestamp: number): void {
    this.video.val.currentTime = timestamp;
    this.updateProgressOnce();
  }

  private moveToSeekNewPosition(event: PointerEvent): void {
    let timestamp = this.showPointedTimestamp(event);
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

  private applyPlaybackSpeed(): void {
    this.playbackSpeedIndex = PLAYBACK_SPEED_VALUES.indexOf(
      this.settings.videoSettings.playbackSpeed,
    );
    if (this.playbackSpeedIndex === -1) {
      this.playbackSpeedIndex = PLAYBACK_SPEED_VALUES.indexOf(
        PLAYBACK_SPEED_DEFAULT,
      );
    }
    if (this.playbackSpeedIndex <= 0) {
      this.playbackSpeedDownButton.val.disable();
    } else {
      this.playbackSpeedDownButton.val.enable();
    }
    if (this.playbackSpeedIndex >= PLAYBACK_SPEED_VALUES.length - 1) {
      this.playbackSpeedUpButton.val.disable();
    } else {
      this.playbackSpeedUpButton.val.enable();
    }
    this.currentPlaybackSpeed.val.textContent = `${
      PLAYBACK_SPEED_VALUES[this.playbackSpeedIndex]
    }x`;
    this.video.val.playbackRate =
      PLAYBACK_SPEED_VALUES[this.playbackSpeedIndex];
  }

  private speedDownOnce(): void {
    if (this.playbackSpeedIndex <= 0) {
      return;
    }
    this.settings.videoSettings.playbackSpeed =
      PLAYBACK_SPEED_VALUES[this.playbackSpeedIndex - 1];
    this.applyPlaybackSpeed();
    this.emit("saveSettings");
  }

  private speedUpOnce(): void {
    if (this.playbackSpeedIndex >= PLAYBACK_SPEED_VALUES.length - 1) {
      return;
    }
    this.settings.videoSettings.playbackSpeed =
      PLAYBACK_SPEED_VALUES[this.playbackSpeedIndex + 1];
    this.applyPlaybackSpeed();
    this.emit("saveSettings");
  }

  private applyVolume(): void {
    this.video.val.volume = this.settings.videoSettings.volume * VOLUME_SCALE;
    this.currentVolumeIcon.val.lastElementChild?.remove();
    this.currentVolumeIcon.val.append(
      createDashedCircleIcon(
        SCHEME.neutral1,
        SCHEME.neutral2,
        VOLUME_RANGE.maxValue / Player.VOLUME_STEP,
        this.settings.videoSettings.volume / Player.VOLUME_STEP,
      ),
    );
    if (this.settings.videoSettings.volume <= VOLUME_RANGE.minValue) {
      this.volumeDownButton.val.disable();
    } else {
      this.volumeDownButton.val.enable();
    }
    if (this.settings.videoSettings.volume >= VOLUME_RANGE.maxValue) {
      this.volumeUpButton.val.disable();
    } else {
      this.volumeUpButton.val.enable();
    }
  }

  private volumeDownOnce(): void {
    this.settings.videoSettings.volume = VOLUME_RANGE.getValidValue(
      this.settings.videoSettings.volume - Player.VOLUME_STEP,
    );
    this.applyVolume();
    this.emit("saveSettings");
  }

  private volumeUpOnce(): void {
    this.settings.videoSettings.volume = VOLUME_RANGE.getValidValue(
      this.settings.videoSettings.volume + Player.VOLUME_STEP,
    );
    this.applyVolume();
    this.emit("saveSettings");
  }

  private goFullscreen(): void {
    this.fullscreenButton.val.hide();
    this.exitFullscreenButton.val.show();
    this.emit("goFullscreen");
  }

  private exitFullscreen(): void {
    this.fullscreenButton.val.show();
    this.exitFullscreenButton.val.hide();
    this.emit("exitFullscreen");
  }

  private showControls(): void {
    this.controlsContainer.val.style.opacity = `1`;
    this.window.clearTimeout(this.hideTimeoutId);
    this.hideTimeoutId = this.window.setTimeout(
      () => this.hideControls(),
      Player.DELAY_TO_HIDE_CONTROLS_MS,
    );
  }

  private hideControls(): void {
    this.controlsContainer.val.style.opacity = `0`;
  }

  private toggleControls(event: PointerEvent): void {
    if (this.controlsContainer.val.style.opacity === `0`) {
      this.showControls();
    } else if (event.target === this.centerControlsContainer.val) {
      this.window.clearTimeout(this.hideTimeoutId);
      this.hideControls();
    }
  }

  private detectKeyOperation(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    if (event.key === " ") {
      if (this.video.val.paused) {
        this.video.val.play();
      } else {
        this.video.val.pause();
      }
    } else if (event.key === "ArrowLeft") {
      this.skipBackward();
    } else if (event.key === "ArrowRight") {
      this.skipForward();
    } else if (event.key === "ArrowUp") {
      this.volumeUpOnce();
    } else if (event.key === "ArrowDown") {  
      this.volumeDownOnce();
    }
  }

  public getCurrentTime(): number {
    return this.video.val.currentTime;
  }

  public interrupt(reason: string): void {
    this.video.val.pause();
    this.bottomError.val.textContent = reason;
    this.bottomError.val.animate(
      [
        { opacity: "0" },
        { opacity: "1", offset: 0.05 },
        { opacity: "1", offset: 0.9 },
        { opacity: "0" },
      ],
      5000,
    );
  }
}
