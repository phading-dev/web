import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../common/page_navigator";
import { CreateEpisodePage } from "./create_episode_page/body";
import { DraftStatePage } from "./draft_state_page/body";
import { EpisodeDetailsPage } from "./episode_details_page/body";
import { InfoPage } from "./info_page/body";
import { PublishedStatePage } from "./published_state_page/body";
import { UpdateCoverImagePage } from "./update_cover_image_page/body";
import { UpdateDraftPricingPage } from "./update_draft_pricing_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdatePublishedPricingPage } from "./update_published_pricing_page/body";
import {
  NextGrade,
  SeasonDetails,
} from "@phading/product_service_interface/show/web/publisher/details";

export class SeasonDetailsPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    seasonId: string,
  ): SeasonDetailsPage {
    return new SeasonDetailsPage(
      InfoPage.create,
      UpdateCoverImagePage.create,
      UpdateInfoPage.create,
      UpdateDraftPricingPage.create,
      UpdatePublishedPricingPage.create,
      DraftStatePage.create,
      PublishedStatePage.create,
      CreateEpisodePage.create,
      EpisodeDetailsPage.create,
      appendBodies,
      seasonId,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public infoPage: InfoPage;
  public updateCoverImagePage: UpdateCoverImagePage;
  public updateInfoPage: UpdateInfoPage;
  public updateDraftPricingPage: UpdateDraftPricingPage;
  public updatePublishedPricingPage: UpdatePublishedPricingPage;
  public draftStatePage: DraftStatePage;
  public publishedStatePage: PublishedStatePage;
  public createEpisodePage: CreateEpisodePage;
  public episodeDetailsPage: EpisodeDetailsPage;

  public constructor(
    private createInfoPage: (seasonId: string) => InfoPage,
    private createUpdateCoverImagePage: (
      seasonId: string,
      season: SeasonDetails,
    ) => UpdateCoverImagePage,
    private createUpdateInfoPage: (
      seasonId: string,
      season: SeasonDetails,
    ) => UpdateInfoPage,
    private createUpdateDraftPricingPage: (
      seasonId: string,
      grade: number,
    ) => UpdateDraftPricingPage,
    private createUpdatePublishedPricingPage: (
      seasonId: string,
      grade: number,
      nextGrade?: NextGrade,
    ) => UpdatePublishedPricingPage,
    private createDraftStatePage: (seasonId: string) => DraftStatePage,
    private createPublishedStatePage: (seasonId: string) => PublishedStatePage,
    private createCreateEpisodePage: (seasonId: string) => CreateEpisodePage,
    private createEpisodeDetailsPage: (
      appendBodies: AddBodiesFn,
      seasonId: string,
      episodeId: string,
    ) => EpisodeDetailsPage,
    private appendBodies: AddBodiesFn,
    private seasonId: string,
  ) {
    super();
    this.pageSwitcher.goTo(
      () => this.addInfoPage(),
      () => this.infoPage.remove(),
    );
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage(this.seasonId)
      .on("editCoverImage", (season) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateCoverImagePage(season),
          () => this.updateCoverImagePage.remove(),
        ),
      )
      .on("editSeasonInfo", (season) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateInfoPage(season),
          () => this.updateInfoPage.remove(),
        ),
      )
      .on("editSeasonDraftPricing", (season) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateDraftPricingPage(season),
          () => this.updateDraftPricingPage.remove(),
        ),
      )
      .on("editSeasonPublishedPricing", (season) =>
        this.pageSwitcher.goTo(
          () => this.addUpdatePublishedPricingPage(season),
          () => this.updatePublishedPricingPage.remove(),
        ),
      )
      .on("editSeasonDraftState", () =>
        this.pageSwitcher.goTo(
          () => this.addDraftStatePage(),
          () => this.draftStatePage.remove(),
        ),
      )
      .on("editSeasonPublishedState", () =>
        this.pageSwitcher.goTo(
          () => this.addPublishedStatePage(),
          () => this.publishedStatePage.remove(),
        ),
      )
      .on("createDraftEpisode", () =>
        this.pageSwitcher.goTo(
          () => this.addCreateEpisodePage(),
          () => this.createEpisodePage.remove(),
        ),
      )
      .on("editEpisode", (episodeId) =>
        this.pageSwitcher.goTo(
          () => this.addEpisodeDetailsPage(episodeId),
          () => this.episodeDetailsPage.remove(),
        ),
      );
    this.appendBodies(this.infoPage.body);
  }

  private addUpdateCoverImagePage(season: SeasonDetails): void {
    this.updateCoverImagePage = this.createUpdateCoverImagePage(
      this.seasonId,
      season,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateCoverImagePage.body);
  }

  private addUpdateInfoPage(season: SeasonDetails): void {
    this.updateInfoPage = this.createUpdateInfoPage(this.seasonId, season).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.updateInfoPage.body);
  }

  private addUpdateDraftPricingPage(season: SeasonDetails): void {
    this.updateDraftPricingPage = this.createUpdateDraftPricingPage(
      this.seasonId,
      season.grade,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateDraftPricingPage.body);
  }

  private addUpdatePublishedPricingPage(season: SeasonDetails): void {
    this.updatePublishedPricingPage = this.createUpdatePublishedPricingPage(
      this.seasonId,
      season.grade,
      season.nextGrade,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updatePublishedPricingPage.body);
  }

  private addDraftStatePage(): void {
    this.draftStatePage = this.createDraftStatePage(this.seasonId).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.draftStatePage.body);
  }

  private addPublishedStatePage(): void {
    this.publishedStatePage = this.createPublishedStatePage(this.seasonId).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.publishedStatePage.body);
  }

  private addCreateEpisodePage(): void {
    this.createEpisodePage = this.createCreateEpisodePage(this.seasonId)
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
      )
      .on("editEpisode", (episodeId) =>
        this.pageSwitcher.goTo(
          () => this.addEpisodeDetailsPage(episodeId),
          () => this.episodeDetailsPage.remove(),
        ),
      );
    this.appendBodies(this.createEpisodePage.body);
  }

  private addEpisodeDetailsPage(episodeId: string): void {
    this.episodeDetailsPage = this.createEpisodeDetailsPage(
      this.appendBodies,
      this.seasonId,
      episodeId,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
