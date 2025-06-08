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
      UploadPage.create,
      appendBodies,
      seasonId,
      episodeId,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public infoPage: InfoPage;
  public publishPage: PublishPage;
  public publishedPage: PublishedPage;
  public updateIndexPage: UpdateIndexPage;
  public updateInfoPage: UpdateInfoPage;
  public updateTracksPage: UpdateTracksPage;
  public uploadPage: UploadPage;

  public constructor(
    private createInfoPage: typeof InfoPage.create,
    private createPublishPage: typeof PublishPage.create,
    private createPublishedPage: typeof PublishedPage.create,
    private createUpdateIndexPage: typeof UpdateIndexPage.create,
    private createUpdateInfoPage: typeof UpdateInfoPage.create,
    private createUpdateTracksPage: typeof UpdateTracksPage.create,
    private createUploadPage: typeof UploadPage.create,
    private appendBodies: AddBodiesFn,
    public seasonId: string,
    public episodeId: string,
  ) {
    super();
    this.pageSwitcher.goTo(
      () => this.addInfoPage(),
      () => this.infoPage.remove(),
    );
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage(this.seasonId, this.episodeId)
      .on("back", () => this.emit("back"))
      .on("editName", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateInfoPage(episode),
          () => this.updateInfoPage.remove(),
        ),
      )
      .on("editIndex", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateIndexPage(episode),
          () => this.updateIndexPage.remove(),
        ),
      )
      .on("editDraftState", () =>
        this.pageSwitcher.goTo(
          () => this.addPublishPage(),
          () => this.publishPage.remove(),
        ),
      )
      .on("editPublishedState", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addPublishedPage(episode),
          () => this.publishedPage.remove(),
        ),
      )
      .on("upload", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addUploadPage(episode),
          () => this.uploadPage.remove(),
        ),
      )
      .on("editTracks", (episode) =>
        this.pageSwitcher.goTo(
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
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateTracksPage.body);
  }

  private addUploadPage(episode: EpisodeDetails): void {
    this.uploadPage = this.createUploadPage(
      this.appendBodies,
      this.seasonId,
      this.episodeId,
      episode.videoContainer.processing?.uploading,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
