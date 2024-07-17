import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../common/icon_button";
import { createCrossIcon, createSplitColumnIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { getRootFontSize } from "../../../common/root_font_size";
import { ICON_S } from "../../../common/sizes";
import { PRODUCT_SERVICE_CLIENT } from "../../../common/web_service_client";
import { CommentsCard } from "./comments_card/body";
import { CommentsPool } from "./comments_pool";
import {
  BOTTOM_MARGIN_RANGE,
  DENSITY_RANGE,
  ENABLE_CHAT_SCROLLING_DEFAULT,
  FONT_FAMILY_DEFAULT,
  FONT_SIZE_RANGE,
  OPACITY_RANGE,
  PLAYBACK_SPEED_DEFAULT,
  SPEED_RANGE,
  STACKING_METHOD_DEFAULT,
  TOP_MARGIN_RANGE,
  VOLUME_MUTED_DEFAULT,
  VOLUME_RANGE,
} from "./common/defaults";
import { CARD_SIDE_PADDING } from "./common/styles";
import { InfoCard } from "./info_card/body";
import { Meter } from "./meter";
import { Player } from "./player/body";
import { SettingsCard } from "./settings_card/body";
import { ViewSessionTracker } from "./view_session_tracker";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import {
  getEpisodeToPlay,
  getPlayerSettings,
  savePlayerSettings,
} from "@phading/product_service_interface/consumer/frontend/show/client_requests";
import {
  Episode,
  EpisodeToPlay,
} from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import { PlayerSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TabNavigator } from "@selfage/tabs/navigator";
import { WebServiceClient } from "@selfage/web_service_client";

enum Tab {
  COMMENTS,
  INFO,
  SETTINGS,
}

export interface PlayPage {
  on(event: "play", listener: (episodeId: string) => void): this;
  on(event: "focusAccount", listener: (accountId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class PlayPage extends EventEmitter {
  public static create(episodeId: string): PlayPage {
    return new PlayPage(
      window,
      PRODUCT_SERVICE_CLIENT,
      Meter.create,
      ViewSessionTracker.create,
      Player.create,
      CommentsCard.create,
      InfoCard.create,
      SettingsCard.create,
      CommentsPool.create,
      episodeId,
    );
  }

  private static WIDTH_BREAKPOINT = 60; // rem

  public body: HTMLDivElement;
  public player = new Ref<Player>();
  private cardContainer = new Ref<HTMLDivElement>();
  public dockToBottomButton = new Ref<IconButton>();
  public dockToRightButton = new Ref<IconButton>();
  public closeButton = new Ref<IconButton>();
  public commentsCard = new Ref<CommentsCard>();
  public infoCard = new Ref<InfoCard>();
  public settingsCard = new Ref<SettingsCard>();
  private tabNavigator: TabNavigator<Tab>;
  private episodeToPlay: EpisodeToPlay;
  private playerSettings: PlayerSettings;
  private meter: Meter;
  private viewSessionTracker: ViewSessionTracker;
  private commentsPool: CommentsPool;
  private heartBeatLoopId: number;
  private cardOpened: boolean;

  public constructor(
    private window: Window,
    private webServiceClient: WebServiceClient,
    private createMeter: (seasonId: string) => Meter,
    private createViewSessionTracker: (episodeId: string) => ViewSessionTracker,
    private createPlayer: (
      playerSettings: PlayerSettings,
      episode: Episode,
    ) => Player,
    private createCommentsCard: (seasonId: string) => CommentsCard,
    private createInfoCard: (episodeToPlay: EpisodeToPlay) => InfoCard,
    private createSettingsCard: (
      playerSettings: PlayerSettings,
    ) => SettingsCard,
    private createCommentsPool: (episodeId: string) => CommentsPool,
    episodeId: string,
  ) {
    super();
    this.body = E.div({
      class: "play-page",
      style: `width: 100%; height: 100%; background-color: ${SCHEME.neutral3}; display: flex; align-items: center;`,
    });

    this.load(episodeId);
  }

  private async load(episodeId: string): Promise<void> {
    let [episodeResponse, playerSettingsResponse] = await Promise.all([
      getEpisodeToPlay(this.webServiceClient, {
        episodeId: episodeId,
      }),
      getPlayerSettings(this.webServiceClient, {}),
    ]);
    this.episodeToPlay = episodeResponse.episode;
    this.playerSettings = PlayPage.normalizePlayerSettings(
      playerSettingsResponse.playerSettings,
    );

    this.body.append(
      assign(
        this.player,
        this.createPlayer(this.playerSettings, this.episodeToPlay.episode),
      ).body,
      E.divRef(
        this.cardContainer,
        {
          class: "play-page-card-container",
          style: `flex: 0 0 auto; overflow: hidden; flex-flow: column nowrap; background-color: ${SCHEME.neutral4};`,
        },
        E.div(
          {
            class: "play-page-card-header",
            style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; justify-content: flex-end; padding: .5rem ${CARD_SIDE_PADDING}rem; gap: 2rem;`,
          },
          assign(
            this.dockToRightButton,
            IconButton.create(
              ICON_S,
              0.5,
              "",
              createSplitColumnIcon("currentColor"),
              TooltipPosition.LEFT,
              LOCALIZED_TEXT.dockToRightButtonLebel,
            ).enable(),
          ).body,
          assign(
            this.dockToBottomButton,
            IconButton.create(
              ICON_S,
              0.5,
              "",
              createSplitColumnIcon(
                "currentColor",
                "transform: rotate(90deg);",
              ),
              TooltipPosition.LEFT,
              LOCALIZED_TEXT.dockToBottomButotnLabel,
            ).enable(),
          ).body,
          assign(
            this.closeButton,
            IconButton.create(
              ICON_S,
              0.7,
              "",
              createCrossIcon("currentColor"),
              TooltipPosition.LEFT,
              LOCALIZED_TEXT.closeButtonLabel,
            ).enable(),
          ).body,
        ),
        assign(
          this.commentsCard,
          this.createCommentsCard(this.episodeToPlay.season.seasonId).hide(),
        ).body,
        assign(this.infoCard, this.createInfoCard(this.episodeToPlay).hide())
          .body,
        assign(
          this.settingsCard,
          this.createSettingsCard(this.playerSettings).hide(),
        ).body,
      ),
    );
    this.closeCard();
    this.commentsCard.val.setCallbackToGetTimestampMs(() =>
      this.player.val.getCurrentVideoTimestampMs(),
    );
    this.meter = this.createMeter(this.episodeToPlay.season.seasonId);
    this.viewSessionTracker = this.createViewSessionTracker(
      this.episodeToPlay.episode.episodeId,
    );
    this.commentsPool = this.createCommentsPool(
      this.episodeToPlay.episode.episodeId,
    );

    this.tabNavigator = new TabNavigator<Tab>(
      (tab) => this.showTab(tab),
      (tab) => this.hideTab(tab),
    );
    this.dockToRightButton.val.on("action", () => this.dockCardHorizontally());
    this.dockToBottomButton.val.on("action", () => this.dockCardVertically());
    this.closeButton.val.on("action", () => this.closeCard());
    this.player.val
      .on("showComments", () => this.openCard(Tab.COMMENTS))
      .on("showMoreInfo", () => this.openCard(Tab.INFO))
      .on("showSettings", () => this.openCard(Tab.SETTINGS))
      .on("updateSettings", () => this.saveSettings())
      .on("playing", () => this.startPlaying())
      .on("notPlaying", () => this.stopPlaying());
    this.commentsCard.val.on("commented", (comment) =>
      this.addPostedComment(comment),
    );
    this.infoCard.val
      .on("focusAccount", (accountId) => this.emit("focusAccount", accountId))
      .on("play", (episodeId) => this.emit("play", episodeId));
    this.settingsCard.val.on("update", () => this.updateSettings());
    this.meter.on("stop", () =>
      this.player.val.interrupt(LOCALIZED_TEXT.interruptReasonNoConnectivity),
    );
    this.emit("loaded");
  }

  private static normalizePlayerSettings(
    playerSettings?: PlayerSettings,
  ): PlayerSettings {
    if (!playerSettings) {
      playerSettings = {};
    }

    if (!playerSettings.videoSettings) {
      playerSettings.videoSettings = {};
    }
    let videoSettings = playerSettings.videoSettings;
    if (videoSettings.muted === undefined) {
      videoSettings.muted = VOLUME_MUTED_DEFAULT;
    }
    if (videoSettings.playbackSpeed === undefined) {
      videoSettings.playbackSpeed = PLAYBACK_SPEED_DEFAULT;
    }
    videoSettings.volume = VOLUME_RANGE.getValidValue(videoSettings.volume);

    if (!playerSettings.danmakuSettings) {
      playerSettings.danmakuSettings = {};
    }
    let danmakuSettings = playerSettings.danmakuSettings;
    danmakuSettings.speed = SPEED_RANGE.getValidValue(danmakuSettings.speed);
    danmakuSettings.opacity = OPACITY_RANGE.getValidValue(
      danmakuSettings.opacity,
    );
    danmakuSettings.fontSize = FONT_SIZE_RANGE.getValidValue(
      danmakuSettings.fontSize,
    );
    danmakuSettings.density = DENSITY_RANGE.getValidValue(
      danmakuSettings.density,
    );
    danmakuSettings.topMargin = TOP_MARGIN_RANGE.getValidValue(
      danmakuSettings.topMargin,
    );
    danmakuSettings.bottomMargin = BOTTOM_MARGIN_RANGE.getValidValue(
      danmakuSettings.bottomMargin,
    );
    if (!danmakuSettings.fontFamily) {
      danmakuSettings.fontFamily = FONT_FAMILY_DEFAULT;
    }
    if (danmakuSettings.enable === undefined) {
      danmakuSettings.enable = ENABLE_CHAT_SCROLLING_DEFAULT;
    }
    if (danmakuSettings.stackingMethod === undefined) {
      danmakuSettings.stackingMethod = STACKING_METHOD_DEFAULT;
    }
    return playerSettings;
  }

  private showTab(tab: Tab): void {
    switch (tab) {
      case Tab.COMMENTS:
        this.commentsCard.val.show();
        break;
      case Tab.INFO:
        this.infoCard.val.show();
        break;
      case Tab.SETTINGS:
        this.settingsCard.val.show();
        break;
    }
  }

  private hideTab(tab: Tab): void {
    switch (tab) {
      case Tab.COMMENTS:
        this.commentsCard.val.hide();
        break;
      case Tab.INFO:
        this.infoCard.val.hide();
        break;
      case Tab.SETTINGS:
        this.settingsCard.val.hide();
        break;
    }
  }

  private dockCardHorizontally(): void {
    this.dockToRightButton.val.hide();
    this.dockToBottomButton.val.show();
    this.body.style.flexFlow = "row nowrap";
    this.cardContainer.val.style.display = "none";
    this.cardContainer.val.style.transition = "width .2s";
    this.cardContainer.val.offsetHeight;
    this.cardContainer.val.style.display = "flex";
    this.cardContainer.val.style.height = "0";
    this.cardContainer.val.style.width = "0";
    this.cardContainer.val.offsetHeight;
    this.cardContainer.val.style.width = "40%";
    this.cardContainer.val.style.maxWidth = "40rem";
    this.cardContainer.val.style.height = "100%";
    this.cardContainer.val.style.maxHeight = "";
  }

  private dockCardVertically(): void {
    this.dockToRightButton.val.show();
    this.dockToBottomButton.val.hide();
    this.body.style.flexFlow = "column nowrap";
    this.cardContainer.val.style.display = "none";
    this.cardContainer.val.style.transition = "height .2s";
    this.cardContainer.val.offsetHeight;
    this.cardContainer.val.style.display = "flex";
    this.cardContainer.val.style.height = "0";
    this.cardContainer.val.style.width = "0";
    this.cardContainer.val.offsetHeight;
    this.cardContainer.val.style.width = "100%";
    this.cardContainer.val.style.maxWidth = "50rem";
    this.cardContainer.val.style.height = "50%";
    this.cardContainer.val.style.maxHeight = "60rem";
  }

  private openCard(tab: Tab): void {
    if (!this.cardOpened) {
      this.cardOpened = true;
      if (
        this.body.offsetWidth >
        getRootFontSize() * PlayPage.WIDTH_BREAKPOINT
      ) {
        this.dockCardHorizontally();
      } else {
        this.dockCardVertically();
      }
    }
    this.tabNavigator.goTo(tab);
  }

  private closeCard(): void {
    this.cardOpened = false;
    this.cardContainer.val.style.display = "none";
  }

  private async saveSettings(): Promise<void> {
    await savePlayerSettings(this.webServiceClient, {
      playerSettings: this.playerSettings,
    });
  }

  private async updateSettings(): Promise<void> {
    this.player.val.applySettings();
    await this.saveSettings();
  }

  private startPlaying(): void {
    let videoTimestampMs = this.player.val.getCurrentVideoTimestampMs();
    this.commentsPool.startFrom(videoTimestampMs);
    this.heartBeatLoopId = this.window.requestAnimationFrame(
      this.heartBeatRecurringly,
    );
    this.meter.watchStart(videoTimestampMs);
    this.viewSessionTracker.watchStart(videoTimestampMs);
  }

  private heartBeatRecurringly = (): void => {
    let videoTimestampMs = this.player.val.getCurrentVideoTimestampMs();
    let comments = this.commentsPool.read(videoTimestampMs);
    this.commentsCard.val.addComments(comments);
    this.player.val.addDanmaku(comments);
    this.meter.watchUpdate(videoTimestampMs);
    this.heartBeatLoopId = this.window.requestAnimationFrame(
      this.heartBeatRecurringly,
    );
  };

  private stopPlaying(): void {
    let videoTimestampMs = this.player.val.getCurrentVideoTimestampMs();
    this.meter.watchStop(videoTimestampMs);
    this.viewSessionTracker.watchStop(videoTimestampMs);
    this.window.cancelAnimationFrame(this.heartBeatLoopId);
  }

  private addPostedComment(comment: Comment): void {
    this.commentsCard.val.addComments([comment]);
    this.player.val.addDanmaku([comment]);
  }

  public remove() {
    if (this.player.val) {
      this.player.val.remove();
      this.meter.remove();
    }
    this.body.remove();
  }
}
