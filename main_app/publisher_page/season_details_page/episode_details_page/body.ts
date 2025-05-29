import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../../common/page_navigator";
import { InfoPage } from "./info_page/body";
import { PublishPage } from "./publish_page/body";
import { PublishedPage } from "./published_page/body";
import { UpdateIndexPage } from "./update_index_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdateTracksPage } from "./update_tracks_page/body";
import { UploadPage } from "./upload_page/body";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { VideoContainer } from "@phading/video_service_interface/node/video_container";

export enum Page {
  INFO,
  PUBLISH,
  PUBLISHED,
  UPDATE_INDEX,
  UPDATE_INFO,
  UPDATE_TRACKS,
  UPLOAD,
}

export interface EpisodeDetailsPage {
  on(event: "back", listener: () => void): this;
}

export class EpisodeDetailsPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    seasonId: string,
    episodeId: string,
  ): EpisodeDetailsPage {
    return new EpisodeDetailsPage(
      InfoPage.create,
      PublishPage.create,
      PublishedPage.create,
      UpdateIndexPage.create,
      UpdateInfoPage.create,
      UpdateTracksPage.create,
      appendBodies,
      seasonId,
      episodeId,
    );
  }

  private pageSwitcher = new TabSwitcher<Page>();
  public infoPage: InfoPage;
  public publishPage: PublishPage;
  public publishedPage: PublishedPage;
  public updateIndexPage: UpdateIndexPage;
  public updateInfoPage: UpdateInfoPage;
  public updateTracksPage: UpdateTracksPage;
  public uploadPage: UploadPage;

  public constructor(
    private createInfoPage: (seasonId: string, episodeId: string) => InfoPage,
    private createPublishPage: (
      seasonId: string,
      episodeId: string,
    ) => PublishPage,
    private createPublishedPage: (
      seasonId: string,
      episodeId: string,
      episode: EpisodeDetails,
    ) => PublishedPage,
    private createUpdateIndexPage: (
      seasonId: string,
      episodeId: string,
      episode: EpisodeDetails,
    ) => UpdateIndexPage,
    private createUpdateInfoPage: (
      seasonId: string,
      episodeId: string,
      episode: EpisodeDetails,
    ) => UpdateInfoPage,
    private createUpdateTracksPage: (
      seasonId: string,
      episodeId: string,
      videoContainer: VideoContainer,
    ) => UpdateTracksPage,
    private appendBodies: AddBodiesFn,
    private seasonId: string,
    private episodeId: string,
  ) {
    super();
    this.pageSwitcher.goTo(
      Page.INFO,
      () => this.addInfoPage(),
      () => this.infoPage.remove(),
    );
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage(this.seasonId, this.episodeId)
      .on("back", () => this.emit("back"))
      .on("editName", (episode) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_INFO,
          () => this.addUpdateInfoPage(episode),
          () => this.updateInfoPage.remove(),
        ),
      )
      .on("editIndex", (episode) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_INDEX,
          () => this.addUpdateIndexPage(episode),
          () => this.updateIndexPage.remove(),
        ),
      )
      .on("editDraftState", () =>
        this.pageSwitcher.goTo(
          Page.PUBLISH,
          () => this.addPublishPage(),
          () => this.publishPage.remove(),
        ),
      )
      .on("editPublishedState", (episode) =>
        this.pageSwitcher.goTo(
          Page.PUBLISHED,
          () => this.addPublishedPage(episode),
          () => this.publishedPage.remove(),
        ),
      )
      .on("upload", (episode) =>
        this.pageSwitcher.goTo(
          Page.UPLOAD,
          () => this.addUploadPage(episode),
          () => this.uploadPage.remove(),
        ),
      )
      .on("editTracks", (episode) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_TRACKS,
          () => this.addUpdateTracksPage(episode),
          () => this.updateTracksPage.remove(),
        ),
      );
    this.appendBodies(this.infoPage.body);
  }

  private addPublishPage(): void {
    this.publishPage = this.createPublishPage(this.seasonId, this.episodeId).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          Page.INFO,
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.publishPage.body);
  }

  private addPublishedPage(episode: EpisodeDetails): void {
    this.publishedPage = this.createPublishedPage(
      this.seasonId,
      this.episodeId,
      episode,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.publishedPage.body);
  }

  private addUpdateIndexPage(episode: EpisodeDetails): void {
    this.updateIndexPage = this.createUpdateIndexPage(
      this.seasonId,
      this.episodeId,
      episode,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateIndexPage.body);
  }

  private addUpdateInfoPage(episode: EpisodeDetails): void {
    this.updateInfoPage = this.createUpdateInfoPage(
      this.seasonId,
      this.episodeId,
      episode,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateInfoPage.body);
  }

  private addUpdateTracksPage(episode: EpisodeDetails): void {
    this.updateTracksPage = this.createUpdateTracksPage(
      this.seasonId,
      this.episodeId,
      episode.videoContainer,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateTracksPage.body);
  }

  private addUploadPage(episode: EpisodeDetails): void {
    this.uploadPage = UploadPage.create(
      this.appendBodies,
      this.seasonId,
      this.episodeId,
      episode.videoContainer.processing?.uploading,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
