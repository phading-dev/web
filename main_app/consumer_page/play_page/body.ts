import LRUCache from "lru-cache";
import { SCHEME } from "../../../common/color_scheme";
import { SimpleIconButton } from "../../../common/icon_button";
import { createCrossIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PageNavigator } from "../../../common/page_navigator";
import { getRootFontSize } from "../../../common/root_font_size";
import { ICON_BUTTON_L, ICON_L } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { CommentsPanel } from "./comments_panel/body";
import { CommentWithAuthor } from "./common/comment_with_author";
import {
  COMMENT_OVERLAY_STYLE_DEFAULT,
  DENSITY_RANGE,
  FONT_SIZE_RANGE,
  OPACITY_RANGE,
  PLAYBACK_SPEED_DEFAULT,
  SPEED_RANGE,
  STACKING_METHOD_DEFAULT,
  VOLUME_RANGE,
} from "./common/defaults";
import { DanmakuOverlay } from "./danmaku_overlay/body";
import { InfoPanel } from "./info_panel/body";
import { Player } from "./player/body";
import { SettingsPanel } from "./settings_panel/body";
import { SideCommentOverlay } from "./side_comment_overlay/body";
import { WatchSessionTracker } from "./watch_session_tracker";
import { WatchTimeMeter } from "./watch_time_meter";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { newListCommentsRequest } from "@phading/comment_service_interface/show/web/reader/client";
import { newGetLatestWatchedVideoTimeOfEpisodeRequest } from "@phading/play_activity_service_interface/show/web/client";
import {
  newAuthorizeEpisodePlaybackRequest,
  newGetEpisodeWithSeasonSummaryRequest,
  newListEpisodesRequest,
} from "@phading/product_service_interface/show/web/consumer/client";
import {
  Episode,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/consumer/info";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import {
  newGetVideoPlayerSettingsRequest,
  newSaveVideoPlayerSettingsRequest,
} from "@phading/user_service_interface/web/self/client";
import {
  CommentOverlaySettings,
  CommentOverlayStyle,
  VideoPlayerSettings,
  VideoSettings,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { newGetAccountSummaryRequest } from "@phading/user_service_interface/web/third_person/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

let ACCOUNT_SUMMARY_CACHE = new LRUCache<string, Promise<AccountSummary>>({
  max: 100000,
});

export enum Tab {
  INFO,
  COMMENTS,
  SETTINGS,
}

export interface PlayPage {
  on(event: "back", listener: () => void): this;
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "loaded", listener: () => void): this;
}

export class PlayPage extends EventEmitter {
  public static create(seasonId: string, episodeId: string): PlayPage {
    return new PlayPage(
      window,
      SERVICE_CLIENT,
      Player.create,
      InfoPanel.create,
      CommentsPanel.create,
      SettingsPanel.create,
      SideCommentOverlay.create,
      DanmakuOverlay.create,
      WatchSessionTracker.create,
      WatchTimeMeter.create,
      seasonId,
      episodeId,
    );
  }

  private static LAYOUT_BREAKPOINT = 90; // rem
  private static LIST_COMMENTS_BUFFER_RANGE_MS = 30000;
  private static LIST_COMMENTS_ENOUGH_BUFFER_RANGE_MS = 10000;
  private static PLAYING_LOOP_INTERVAL = 250; // ms

  public body: HTMLElement;
  private playerCanvas = new Ref<HTMLDivElement>();
  private commentOverlayContainer = new Ref<HTMLDivElement>();
  private sideCommentOverlay = new Ref<SideCommentOverlay>();
  private danmakuOverlay = new Ref<DanmakuOverlay>();
  public player = new Ref<Player>();
  private panelContainer = new Ref<HTMLDivElement>();
  public closePanelButton = new Ref<SimpleIconButton>();
  public infoPanel = new Ref<InfoPanel>();
  public commentsPanel = new Ref<CommentsPanel>();
  public settingsPanel = new Ref<SettingsPanel>();
  private settings: VideoPlayerSettings;
  private panelOpened = false;
  private tabNavigator: PageNavigator<Tab>;
  public watchSessionTracker: WatchSessionTracker;
  public watchTimeMeter: WatchTimeMeter;
  private commentOverlayNavigator: PageNavigator<CommentOverlayStyle>;
  private playCommentOverlay: () => void;
  private pauseCommentOverlay: () => void;
  private addCommentsToCommentOverlay: (
    comments: Array<CommentWithAuthor>,
  ) => void;
  private applySettingsToCommentOverlay: () => void;
  private clearCommentsInCommentOverlay: () => void;
  private comments: Array<CommentWithAuthor>;
  private commentPointerIndex: number;
  private commentPinnedVideoTimeMsEnd: number;
  private lastVideoTimeMs: number;
  private loadCommentsRequestId = 0;
  private playingLoopId: number;

  public constructor(
    private window: Window,
    private serviceClient: WebServiceClient,
    private createPlayer: (
      settings: VideoSettings,
      videoUrl: string,
      continueTimestampMs: number,
      seasonId: string,
      nextEpisodeId?: string,
    ) => Player,
    private createInfoPanel: (
      customeStyle: string,
      episode: Episode,
      seasonSummary: SeasonSummary,
      nextEpisode?: Episode,
      nextEpisodeWatchedVideoTimeMs?: number,
    ) => InfoPanel,
    private createCommentsPanel: (
      customeStyle: string,
      seasonId: string,
      episodeId: string,
    ) => CommentsPanel,
    private createSettingsPanel: (
      customeStyle: string,
      settings: VideoPlayerSettings,
    ) => SettingsPanel,
    private createSideCommentOverlay: (
      settings: CommentOverlaySettings,
    ) => SideCommentOverlay,
    private createDanmakuOverlay: (
      settings: CommentOverlaySettings,
    ) => DanmakuOverlay,
    private createWatchSessionTracker: (
      seasonId: string,
      episodeId: string,
    ) => WatchSessionTracker,
    private createWatchTimeMeter: (
      seasonId: string,
      episodeId: string,
    ) => WatchTimeMeter,
    private seasonId: string,
    private episodeId: string,
  ) {
    super();
    this.body = E.div({
      class: "play-page",
      style: `width: 100%; height: 100%; display: flex; align-items: center;`,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let [
      { episode, season, nextEpisode, nextEpisodeWatchedVideoTimeMs },
      { watchedVideoTimeMs },
      { videoUrl },
      settings,
    ] = await Promise.all([
      this.getSeasonAndEpisodeAndNextEpisode(),
      this.serviceClient.send(
        newGetLatestWatchedVideoTimeOfEpisodeRequest({
          seasonId: this.seasonId,
          episodeId: this.episodeId,
        }),
      ),
      this.serviceClient.send(
        newAuthorizeEpisodePlaybackRequest({
          seasonId: this.seasonId,
          episodeId: this.episodeId,
        }),
      ),
      this.getNormalizedVideoPlayerSettings(),
    ]);
    this.settings = settings;

    this.body.append(
      E.divRef(
        this.playerCanvas,
        {
          class: "play-page-player-canvas",
          style: `position: relative; width: 100%; height: 100%; background-color: ${SCHEME.neutral4};`,
        },
        E.divRef(this.commentOverlayContainer, {
          class: "play-page-comment-overlay-container",
          style: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-sizing: border-box; padding: 1rem 0 7rem;`,
        }),
        ...assign(
          this.player,
          this.createPlayer(
            this.settings.videoSettings,
            videoUrl,
            watchedVideoTimeMs ?? 0,
            this.seasonId,
            nextEpisode?.episodeId,
          ),
        ).elements,
      ),
      E.divRef(
        this.panelContainer,
        {
          class: "play-page-panels",
          style: `flex: 0 0 auto; max-width: 70rem; background-color: ${SCHEME.neutral4}; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; padding: 0 1rem 1rem 1rem; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "play-page-card-header",
            style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; justify-content: flex-end; gap: 1rem;`,
          },
          assign(
            this.closePanelButton,
            SimpleIconButton.create(
              ICON_BUTTON_L,
              ICON_L,
              createCrossIcon("currentColor"),
            ).enable(),
          ).body,
        ),
        assign(
          this.infoPanel,
          this.createInfoPanel(
            "width: 100%;",
            episode,
            season,
            nextEpisode,
            nextEpisodeWatchedVideoTimeMs,
          ),
        ).body,
        assign(
          this.commentsPanel,
          this.createCommentsPanel(
            "width: 100%;",
            this.seasonId,
            this.episodeId,
          ),
        ).body,
        assign(
          this.settingsPanel,
          this.createSettingsPanel("width: 100%;", this.settings),
        ).body,
      ),
    );
    this.hidePanel(Tab.INFO);
    this.hidePanel(Tab.COMMENTS);
    this.hidePanel(Tab.SETTINGS);
    this.tabNavigator = new PageNavigator(
      (tab) => this.showPanel(tab),
      (tab) => this.hidePanel(tab),
    );
    this.closePanel();
    this.closePanelButton.val.on("action", () => this.closePanel());
    this.player.val.on("showInfo", () => this.openPanel(Tab.INFO));
    this.player.val.on("showComments", () => this.openPanel(Tab.COMMENTS));
    this.player.val.on("showSettings", () => this.openPanel(Tab.SETTINGS));

    this.player.val.on("addAvailableSubtitleTracks", (tracks, initIndex) =>
      this.settingsPanel.val.addAvailableSubtitleTracks(tracks, initIndex),
    );
    this.player.val.on("addAvailableAudioTracks", (tracks, initIndex) =>
      this.settingsPanel.val.addAvailableAudioTracks(tracks, initIndex),
    );
    this.settingsPanel.val.on("selectAudio", (index) => {
      this.player.val.selectAudioTrack(index);
      this.saveSettings();
    });
    this.settingsPanel.val.on("selectSubtitle", (index) => {
      this.player.val.selectSubtitleTrack(index);
      this.saveSettings();
    });

    this.watchSessionTracker = this.createWatchSessionTracker(
      this.seasonId,
      this.episodeId,
    );
    this.watchTimeMeter = this.createWatchTimeMeter(
      this.seasonId,
      this.episodeId,
    );
    this.watchTimeMeter.on("newReading", (watchTimeMs) =>
      this.infoPanel.val.updateMeterReading(watchTimeMs),
    );
    this.watchTimeMeter.on("stopPlaying", () =>
      this.player.val.interrupt(LOCALIZED_TEXT.interruptReasonNoConnectivity),
    );

    this.commentOverlayNavigator = new PageNavigator(
      (style) => this.addCommentOverlay(style),
      (style) => this.removeCommentOverlay(style),
    );
    this.applyCommentOverlaySettings();
    this.settingsPanel.val.on("updateCommentOverlaySettings", () => {
      this.applyCommentOverlaySettings();
      this.saveSettings();
    });
    this.commentsPanel.val.setCallbackToGetVideoTimeMs(() =>
      this.player.val.getCurrentVideoTimeMs(),
    );
    this.commentsPanel.val.on("commented", (comment) =>
      this.addPostedComment(comment),
    );
    this.player.val.on("clearComments", () => this.clearComments());
    this.clearComments();

    this.player.val.on("playing", () => this.startPlaying());
    this.player.val.on("notPlaying", () => this.stopPlaying());

    this.player.val.on("play", (seasonId, episodeId) =>
      this.emit("play", seasonId, episodeId),
    );
    this.infoPanel.val.on("play", (seasonId, episodeId) =>
      this.emit("play", seasonId, episodeId),
    );
    this.player.val.on("back", () => this.emit("back"));
    this.player.val.on("saveSettings", () => this.saveSettings());
    this.player.val.on("goFullscreen", () => this.goFullscreen());
    this.player.val.on("exitFullscreen", () => this.exitFullscreen());
    this.emit("loaded");
  }

  private async getSeasonAndEpisodeAndNextEpisode(): Promise<{
    episode: Episode;
    season: SeasonSummary;
    nextEpisode?: Episode;
    nextEpisodeWatchedVideoTimeMs?: number;
  }> {
    let { summary } = await this.serviceClient.send(
      newGetEpisodeWithSeasonSummaryRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
      }),
    );
    let { episodes } = await this.serviceClient.send(
      newListEpisodesRequest({
        next: true,
        seasonId: this.seasonId,
        indexCursor: summary.episode.index,
        limit: 1,
      }),
    );
    let nextEpisode = episodes.length > 0 ? episodes[0] : undefined;
    let nextEpisodeWatchedVideoTimeMs: number | undefined;
    if (nextEpisode) {
      let { watchedVideoTimeMs } = await this.serviceClient.send(
        newGetLatestWatchedVideoTimeOfEpisodeRequest({
          seasonId: this.seasonId,
          episodeId: nextEpisode.episodeId,
        }),
      );
      nextEpisodeWatchedVideoTimeMs = watchedVideoTimeMs;
    }
    return {
      episode: summary.episode,
      season: summary.season,
      nextEpisode,
      nextEpisodeWatchedVideoTimeMs,
    };
  }

  private async getNormalizedVideoPlayerSettings(): Promise<VideoPlayerSettings> {
    let { settings } = await this.serviceClient.send(
      newGetVideoPlayerSettingsRequest({}),
    );
    settings.videoSettings ??= {};
    settings.videoSettings.volume = VOLUME_RANGE.getValidValue(
      settings.videoSettings.volume,
    );
    settings.videoSettings.playbackSpeed ??= PLAYBACK_SPEED_DEFAULT;

    settings.commentOverlaySettings ??= {};
    settings.commentOverlaySettings.style ??= COMMENT_OVERLAY_STYLE_DEFAULT;
    settings.commentOverlaySettings.opacity = OPACITY_RANGE.getValidValue(
      settings.commentOverlaySettings.opacity,
    );
    settings.commentOverlaySettings.fontSize = FONT_SIZE_RANGE.getValidValue(
      settings.commentOverlaySettings.fontSize,
    );
    settings.commentOverlaySettings.danmakuSettings ??= {};
    settings.commentOverlaySettings.danmakuSettings.density =
      DENSITY_RANGE.getValidValue(
        settings.commentOverlaySettings.danmakuSettings.density,
      );
    settings.commentOverlaySettings.danmakuSettings.speed =
      SPEED_RANGE.getValidValue(
        settings.commentOverlaySettings.danmakuSettings.speed,
      );
    settings.commentOverlaySettings.danmakuSettings.stackingMethod ??=
      STACKING_METHOD_DEFAULT;
    return settings;
  }

  private showPanel(tab: Tab): void {
    switch (tab) {
      case Tab.INFO:
        this.infoPanel.val.show();
        break;
      case Tab.COMMENTS:
        this.commentsPanel.val.show();
        break;
      case Tab.SETTINGS:
        this.settingsPanel.val.show();
        break;
    }
  }

  private hidePanel(tab: Tab): void {
    switch (tab) {
      case Tab.INFO:
        this.infoPanel.val.hide();
        break;
      case Tab.COMMENTS:
        this.commentsPanel.val.hide();
        break;
      case Tab.SETTINGS:
        this.settingsPanel.val.hide();
        break;
    }
  }

  private openPanel(tab: Tab): void {
    if (!this.panelOpened) {
      this.panelOpened = true;
      if (
        this.body.offsetWidth <
        getRootFontSize() * PlayPage.LAYOUT_BREAKPOINT
      ) {
        this.dockCardVertically();
      } else {
        this.dockCardHorizontally();
      }
    }
    this.tabNavigator.goTo(tab);
  }

  private closePanel(): void {
    this.panelOpened = false;
    this.panelContainer.val.style.display = "none";
  }

  public dockCardHorizontally(): void {
    this.body.style.flexFlow = "row nowrap";
    this.playerCanvas.val.style.flex = "1 0 0";
    this.panelContainer.val.style.display = "flex";
    this.panelContainer.val.style.width = "0";
    this.panelContainer.val.style.height = "100%";
    this.panelContainer.val.offsetHeight;
    this.panelContainer.val.style.transition = "width .2s";
    this.panelContainer.val.style.width = "40%";
  }

  public dockCardVertically(): void {
    this.body.style.flexFlow = "column nowrap";
    this.playerCanvas.val.style.flex = "0 0 auto";
    this.panelContainer.val.style.display = "flex";
    this.panelContainer.val.style.transition = "";
    this.panelContainer.val.style.width = "100%";
    this.panelContainer.val.style.height = "auto";
    this.panelContainer.val.offsetHeight;
    this.panelContainer.val.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  private addCommentOverlay(style: CommentOverlayStyle): void {
    switch (style) {
      case CommentOverlayStyle.SIDE:
        this.commentOverlayContainer.val.append(
          assign(
            this.sideCommentOverlay,
            this.createSideCommentOverlay(this.settings.commentOverlaySettings),
          ).body,
        );
        this.playCommentOverlay = () => {};
        this.pauseCommentOverlay = () => {};
        this.addCommentsToCommentOverlay = (comments) =>
          this.sideCommentOverlay.val.add(comments);
        this.applySettingsToCommentOverlay = () =>
          this.sideCommentOverlay.val.applySettings();
        this.clearCommentsInCommentOverlay = () =>
          this.sideCommentOverlay.val.clear();
        break;
      case CommentOverlayStyle.DANMAKU:
        this.commentOverlayContainer.val.append(
          assign(
            this.danmakuOverlay,
            this.createDanmakuOverlay(this.settings.commentOverlaySettings),
          ).body,
        );
        this.playCommentOverlay = () => this.danmakuOverlay.val.play();
        this.pauseCommentOverlay = () => this.danmakuOverlay.val.pause();
        this.addCommentsToCommentOverlay = (comments) =>
          this.danmakuOverlay.val.add(comments);
        this.applySettingsToCommentOverlay = () =>
          this.danmakuOverlay.val.applySettings();
        this.clearCommentsInCommentOverlay = () =>
          this.danmakuOverlay.val.clear();
        break;
      case CommentOverlayStyle.NONE:
        this.playCommentOverlay = () => {};
        this.pauseCommentOverlay = () => {};
        this.addCommentsToCommentOverlay = () => {};
        this.applySettingsToCommentOverlay = () => {};
        this.clearCommentsInCommentOverlay = () => {};
        break;
    }
  }

  private removeCommentOverlay(style: CommentOverlayStyle): void {
    switch (style) {
      case CommentOverlayStyle.SIDE:
        this.sideCommentOverlay.val.remove();
        break;
      case CommentOverlayStyle.DANMAKU:
        this.danmakuOverlay.val.remove();
        break;
    }
  }

  private applyCommentOverlaySettings(): void {
    this.commentOverlayNavigator.goTo(
      this.settings.commentOverlaySettings.style,
    );
    this.applySettingsToCommentOverlay();
  }

  private async addPostedComment(comment: Comment): Promise<void> {
    let postedCommentWithAuthor: CommentWithAuthor = {
      comment,
      author: await this.getCachedAccountSummary(comment.authorId),
    };
    this.addCommentsToCommentOverlay([postedCommentWithAuthor]);
    this.commentsPanel.val.add([postedCommentWithAuthor]);
  }

  private clearComments(): void {
    this.clearCommentsInCommentOverlay();
    this.commentsPanel.val.clear();
    this.comments = new Array<CommentWithAuthor>();
    this.commentPointerIndex = 0;
    this.commentPinnedVideoTimeMsEnd = undefined;
  }

  private startPlaying(): void {
    let currentVideoTimeMs = this.player.val.getCurrentVideoTimeMs();
    this.watchSessionTracker.start(currentVideoTimeMs);
    this.watchTimeMeter.start(currentVideoTimeMs);

    this.commentPinnedVideoTimeMsEnd ??= currentVideoTimeMs;
    this.playCommentOverlay();
    this.playing();
  }

  private playing = (): void => {
    let currentVideoTimeMs = this.player.val.getCurrentVideoTimeMs();
    this.watchSessionTracker.update(currentVideoTimeMs);
    this.watchTimeMeter.update(currentVideoTimeMs);
    this.commentsPanel.val.setPinnedVideoTimeMs(currentVideoTimeMs);

    while (
      this.commentPointerIndex < this.comments.length &&
      this.comments[this.commentPointerIndex].comment.pinnedVideoTimeMs <=
        currentVideoTimeMs
    ) {
      this.addCommentsToCommentOverlay([
        this.comments[this.commentPointerIndex],
      ]);
      this.commentsPanel.val.add([this.comments[this.commentPointerIndex]]);
      this.commentPointerIndex++;
    }

    if (
      currentVideoTimeMs + PlayPage.LIST_COMMENTS_ENOUGH_BUFFER_RANGE_MS >=
      this.commentPinnedVideoTimeMsEnd
    ) {
      this.loadComments(
        this.commentPinnedVideoTimeMsEnd,
        this.commentPinnedVideoTimeMsEnd +
          PlayPage.LIST_COMMENTS_BUFFER_RANGE_MS,
      );
    }

    this.lastVideoTimeMs = currentVideoTimeMs;
    this.playingLoopId = this.window.setTimeout(
      this.playing,
      PlayPage.PLAYING_LOOP_INTERVAL,
    );
  };

  private async loadComments(
    startTimestampMs: number,
    endTimestampMs: number,
  ): Promise<void> {
    let requestId = ++this.loadCommentsRequestId;
    this.commentPinnedVideoTimeMsEnd = endTimestampMs;
    let { comments } = await this.serviceClient.send(
      newListCommentsRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        pinnedVideoTimeMsStart: startTimestampMs,
        pinnedVideoTimeMsEnd: endTimestampMs,
      }),
    );
    let commentsWithAuthor = new Array<CommentWithAuthor>(comments.length);
    await Promise.all(
      comments.map(async (comment, index) => {
        commentsWithAuthor[index] = {
          comment,
          author: await this.getCachedAccountSummary(comment.authorId),
        };
      }),
    );
    if (requestId !== this.loadCommentsRequestId) {
      // Discard requests that are outdated.
      return;
    }

    this.comments.push(...commentsWithAuthor);
    while (
      this.commentPointerIndex < this.comments.length &&
      this.comments[this.commentPointerIndex].comment.pinnedVideoTimeMs <=
        this.lastVideoTimeMs
    ) {
      // Backfill the comments that are already passed.
      this.addCommentsToCommentOverlay([
        this.comments[this.commentPointerIndex],
      ]);
      this.commentsPanel.val.add([this.comments[this.commentPointerIndex]]);
      this.commentPointerIndex++;
    }
  }

  private getCachedAccountSummary(accountId: string): Promise<AccountSummary> {
    let accountPromise = ACCOUNT_SUMMARY_CACHE.get(accountId);
    if (!accountPromise) {
      accountPromise = this.serviceClient
        .send(
          newGetAccountSummaryRequest({
            accountId,
          }),
        )
        .then((response) => response.account);
      ACCOUNT_SUMMARY_CACHE.set(accountId, accountPromise);
    }
    return accountPromise;
  }

  private stopPlaying(): void {
    this.window.clearTimeout(this.playingLoopId);
    this.pauseCommentOverlay();
    let currentVideoTimeMs = this.player.val.getCurrentVideoTimeMs();
    this.commentsPanel.val.setPinnedVideoTimeMs(currentVideoTimeMs);
    this.watchSessionTracker.stop(currentVideoTimeMs);
    this.watchTimeMeter.stop(currentVideoTimeMs);
  }

  private async saveSettings(): Promise<void> {
    await this.serviceClient.send(
      newSaveVideoPlayerSettingsRequest({
        settings: this.settings,
      }),
    );
  }

  private goFullscreen(): void {
    if (!document.fullscreenElement) {
      this.body.requestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  public remove(): void {
    this.body.remove();
    this.stopPlaying();
    this.player.val.destroy();
    this.commentOverlayNavigator.remove();
  }
}
