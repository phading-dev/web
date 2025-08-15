import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../common/page_navigator";
import { DeletePage } from "./delete_page/body";
import { InfoPage } from "./info_page/body";
import { PlayerPage } from "./player_page/body";
import { PublishPage } from "./publish_page/body";
import { UnpublishPage } from "./unpublish_page/body";
import { UpdateIndexPage } from "./update_index_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdatePremiereTimePage } from "./update_premiere_time_page/body";
import { UpdateTracksPage } from "./update_tracks_page/body";
import { UploadPage } from "./upload_page/body";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";

export interface EpisodeDetailsPage {
  on(event: "viewSeason", listener: (seasonId: string) => void): this;
}

export class EpisodeDetailsPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    seasonId: string,
    episodeId: string,
  ): EpisodeDetailsPage {
    return new EpisodeDetailsPage(
      DeletePage.create,
      InfoPage.create,
      PlayerPage.create,
      PublishPage.create,
      UnpublishPage.create,
      UpdateIndexPage.create,
      UpdateInfoPage.create,
      UpdatePremiereTimePage.create,
      UpdateTracksPage.create,
      UploadPage.create,
      appendBodies,
      seasonId,
      episodeId,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public deletePage: DeletePage;
  public infoPage: InfoPage;
  public playerPage: PlayerPage;
  public publishPage: PublishPage;
  public unpublishPage: UnpublishPage;
  public updateIndexPage: UpdateIndexPage;
  public updateInfoPage: UpdateInfoPage;
  public updatePremiereTimePage: UpdatePremiereTimePage;
  public updateTracksPage: UpdateTracksPage;
  public uploadPage: UploadPage;

  public constructor(
    private createDeletePage: typeof DeletePage.create,
    private createInfoPage: typeof InfoPage.create,
    private createPlayerPage: typeof PlayerPage.create,
    private createPublishPage: typeof PublishPage.create,
    private createUnpublishPage: typeof UnpublishPage.create,
    private createUpdateIndexPage: typeof UpdateIndexPage.create,
    private createUpdateInfoPage: typeof UpdateInfoPage.create,
    private createUpdatePremiereTimePage: typeof UpdatePremiereTimePage.create,
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

  private addDeletePage(episode: EpisodeDetails): void {
    this.deletePage = this.createDeletePage(this.seasonId, this.episodeId)
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
      )
      .on("delete", () => this.emit("viewSeason", this.seasonId));
    this.appendBodies(this.deletePage.body);
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage(this.seasonId, this.episodeId)
      .on("back", () => this.emit("viewSeason", this.seasonId))
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
      .on("watch", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addPlayerPage(episode),
          () => this.playerPage.remove(),
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
      )
      .on("publish", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addPublishPage(episode),
          () => this.publishPage.remove(),
        ),
      )
      .on("updatePremiereTime", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addUpdatePremiereTimePage(episode),
          () => this.updatePremiereTimePage.remove(),
        ),
      )
      .on("delete", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addDeletePage(episode),
          () => this.deletePage.remove(),
        ),
      )
      .on("unpublish", (episode) =>
        this.pageSwitcher.goTo(
          () => this.addUnpublishPage(episode),
          () => this.unpublishPage.remove(),
        ),
      );
    this.appendBodies(this.infoPage.body);
  }

  private addPlayerPage(episode: EpisodeDetails): void {
    this.playerPage = this.createPlayerPage(episode.videoUrl).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.playerPage.body);
  }

  private addPublishPage(episode: EpisodeDetails): void {
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

  private addUnpublishPage(episode: EpisodeDetails): void {
    this.unpublishPage = this.createUnpublishPage(
      this.seasonId,
      this.episodeId,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.unpublishPage.body);
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

  private addUpdatePremiereTimePage(episode: EpisodeDetails): void {
    this.updatePremiereTimePage = this.createUpdatePremiereTimePage(
      this.seasonId,
      this.episodeId,
      episode,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updatePremiereTimePage.body);
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
