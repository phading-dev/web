import { AT_USER } from "../../../common/at_user";
import {
  BlockingButton,
  OutlineBlockingButton,
} from "../../../common/blocking_button";
import {
  CLICKABLE_TEXT_STYLE,
  NULLIFIED_BUTTON_STYLE,
  OUTLINE_BUTTON_STYLE,
} from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import {
  formatPremieredTime,
  formatUpcomingPremiereTime,
} from "../../../common/formatter/date";
import {
  calculateShowMoneyAndFormat,
  formatShowPrice,
} from "../../../common/formatter/price";
import {
  formatRating,
  formatRatingsCountShort,
} from "../../../common/formatter/rating";
import { formatSecondsAsHHMMSS } from "../../../common/formatter/timestamp";
import {
  createArrowIcon,
  createBookmarkIcon,
  createCheckmarkIcon,
  createCircularProgressIcon,
  createClockIcon,
  createFilledBookmarkIcon,
  createFilledStarIcon,
  createPlayIcon,
  createPlusIcon,
  createReplayIcon,
  createShareIcon,
  createStarIcon,
} from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_COMMON_TOP_DOWN_CARD_STYLE, PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE } from "../../../common/page_style";
import { getRootFontSize } from "../../../common/root_font_size";
import {
  AVATAR_S,
  FONT_L,
  FONT_M,
  FONT_WEIGHT_600,
  ICON_BUTTON_M,
  ICON_L,
  ICON_M,
  ICON_S,
  ICON_XL,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../common/elements";
import {
  newAddToWatchLaterListRequest,
  newCheckInWatchLaterListRequest,
  newDeleteFromWatchLaterListRequest,
  newGetLatestWatchedVideoTimeOfEpisodeRequest,
} from "@phading/play_activity_service_interface/show/web/client";
import {
  newGetContinueEpisodeRequest,
  newGetIndividualSeasonRatingRequest,
  newGetSeasonDetailsRequest,
  newListEpisodesRequest,
  newRateSeasonRequest,
  newUnrateSeasonRequest,
} from "@phading/product_service_interface/show/web/consumer/client";
import {
  Episode,
  SeasonDetails,
} from "@phading/product_service_interface/show/web/consumer/info";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import { newGetAccountSummaryRequest } from "@phading/user_service_interface/web/third_person/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SeasonDetailsPage {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "publisherShowroom", listener: (publisherId: string) => void): this;
  on(event: "gotContinueTime", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "rated", listener: () => void): this;
  on(event: "watchedLater", listener: () => void): this;
  on(event: "shareLinkCopied", listener: () => void): this;
  on(event: "prevEpisodesLoaded", listener: () => void): this;
  on(event: "nextEpisodesLoaded", listener: () => void): this;
}

export class SeasonDetailsPage extends EventEmitter {
  public static create(seasonId: string): SeasonDetailsPage {
    return new SeasonDetailsPage(SERVICE_CLIENT, () => new Date(), seasonId);
  }

  private static INIT_PREV_LIMIT = 1;
  private static INIT_NEXT_LIMIT = 3;
  private static LIST_EPISODES_LIMIT = 10;
  private static MAX_DAYS_TO_SHOW_INCREASED_PRICE = 10;

  public body: HTMLDivElement;
  public continueEpisodeButton = new Ref<HTMLDivElement>();
  public ratingOneStarButton = new Ref<HTMLDivElement>();
  public ratingTwoStarButton = new Ref<HTMLDivElement>();
  public ratingThreeStarButton = new Ref<HTMLDivElement>();
  public ratingFourStarButton = new Ref<HTMLDivElement>();
  public ratingFiveStarButton = new Ref<HTMLDivElement>();
  public watchLaterButton = new Ref<BlockingButton>();
  public removeWatchLaterButton = new Ref<BlockingButton>();
  public shareButton = new Ref<HTMLDivElement>();
  public publisherButton = new Ref<HTMLDivElement>();
  private descriptionText = new Ref<HTMLDivElement>();
  public showMoreDescriptionButton = new Ref<HTMLDivElement>();
  public showLessDescriptionButton = new Ref<HTMLDivElement>();
  private episodesList = new Ref<HTMLDivElement>();
  public loadMorePrevEpisodesButton = new Ref<LoadMoreEpisodesButton>();
  public loadMoreNextEpisodesButton = new Ref<LoadMoreEpisodesButton>();
  public episodeItems = new Array<HTMLDivElement>();
  private seasonDetails: SeasonDetails;
  private individualRating: number;
  private prevIndexCursor: number;
  private nextIndexCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private seasonId: string,
  ) {
    super();
    this.body = E.div({
      class: "season-details-page",
      style: PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let [
      { seasonDetails, publisher },
      {
        continueEpisode,
        continueTimeMs,
        rewatching,
        episodes,
        prevIndexCursor,
        nextIndexCursor,
      },
      checkInWatchLaterListResponse,
      individualRatingResponse,
    ] = await Promise.all([
      this.getSeasonDetails(),
      this.getEpisodes(),
      this.serviceClient.send(
        newCheckInWatchLaterListRequest({
          seasonId: this.seasonId,
        }),
      ),
      this.serviceClient.send(
        newGetIndividualSeasonRatingRequest({
          seasonId: this.seasonId,
        }),
      ),
    ]);
    this.seasonDetails = seasonDetails;
    this.prevIndexCursor = prevIndexCursor;
    this.nextIndexCursor = nextIndexCursor;
    let nowDate = this.getNowDate();
    let continueEpisodePremiered =
      continueEpisode.premiereTimeMs <= nowDate.getTime();
    let newPricingStartingText: string;
    if (
      seasonDetails.nextGrade &&
      seasonDetails.nextGrade.grade > seasonDetails.grade
    ) {
      let days = TzDate.fromLocalDateString(
        seasonDetails.nextGrade.effectiveDate,
        ENV_VARS.timezoneNegativeOffset,
      ).minusDateInDays(
        TzDate.fromDate(nowDate, ENV_VARS.timezoneNegativeOffset),
      );
      if (days <= SeasonDetailsPage.MAX_DAYS_TO_SHOW_INCREASED_PRICE) {
        newPricingStartingText =
          LOCALIZED_TEXT.newPricingStarting[0] +
          formatShowPrice(seasonDetails.nextGrade.grade, nowDate) +
          LOCALIZED_TEXT.newPricingStarting[1] +
          days +
          (days > 1
            ? LOCALIZED_TEXT.newPricingStarting[2]
            : LOCALIZED_TEXT.newPricingStarting[3]);
      }
    }
    this.body.append(
      E.div(
        {
          class: "season-details-card",
          style: `${PAGE_COMMON_TOP_DOWN_CARD_STYLE} max-width: 120rem; padding: 1rem 1rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 1rem; display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "season-details-info",
            style: `display: flex; flex-flow: row wrap; gap: 2rem;`,
          },
          E.div(
            {
              class: "season-details-cover-image",
              style: `flex: 1 0 0; min-width: 26rem;`,
            },
            E.image({
              class: "season-details-cover-image",
              style: `width: 100%; aspect-ratio: 2/3; object-fit: contain;`,
              src: seasonDetails.coverImageUrl,
            }),
          ),
          E.div(
            {
              class: "season-details-info-section",
              style: `flex: 2 0 0; min-width: 35rem; display: flex; flex-flow: column nowrap;`,
            },
            E.div(
              {
                class: "season-details-title",
                style: `font-size: ${FONT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
              },
              E.text(seasonDetails.name),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 1.5rem;`,
            }),
            E.div(
              {
                class: "season-item-price",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.currentRate}${formatShowPrice(seasonDetails.grade, nowDate)}${newPricingStartingText ? newPricingStartingText : LOCALIZED_TEXT.billedMonthly}`,
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 2rem;`,
            }),
            E.divRef(
              this.continueEpisodeButton,
              {
                class: "season-details-continue-episode",
                style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; padding: 2rem; border-radius: 1rem; border: .2rem solid ${continueEpisodePremiered ? SCHEME.primary1 : SCHEME.neutral2}; cursor: ${continueEpisodePremiered ? "pointer" : "default"};`,
              },
              E.div(
                {
                  class: "season-details-continue-episode-icon",
                  style: `flex: 0 0 auto; width: ${ICON_XL}rem; height: ${ICON_XL}rem;`,
                },
                continueEpisodePremiered
                  ? rewatching
                    ? createReplayIcon(SCHEME.neutral1)
                    : createPlayIcon(SCHEME.neutral1)
                  : createClockIcon(SCHEME.neutral1),
              ),
              E.div(
                {
                  class: "season-details-continue-episode-info",
                  style: `flex: 1; display: flex; flex-flow: column nowrap; gap: 1rem;`,
                },
                E.div(
                  {
                    class: "season-details-continue-episode-title",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
                  },
                  E.text(continueEpisode.name),
                ),
                E.div(
                  {
                    class: "season-details-continue-episode-premiere-time",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
                  },
                  E.text(
                    `${continueEpisodePremiered ? LOCALIZED_TEXT.episodePremieredOn + formatPremieredTime(continueEpisode.premiereTimeMs) : LOCALIZED_TEXT.episodePremieresAt + formatUpcomingPremiereTime(continueEpisode.premiereTimeMs)}`,
                  ),
                ),
                E.div(
                  {
                    class: "season-details-continue-episode-progress-line",
                    style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center;`,
                  },
                  E.div(
                    {
                      class: "season-details-continue-episode-progress-icon",
                      style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                    },
                    createCircularProgressIcon(
                      SCHEME.progress,
                      SCHEME.neutral2,
                      continueTimeMs / 1000 / continueEpisode.videoDurationSec,
                    ),
                  ),
                  E.div({
                    style: `flex: 0 0 auto; width: 1rem;`,
                  }),
                  E.div(
                    {
                      class: "season-details-continue-episode-conintue-at",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(
                      `${formatSecondsAsHHMMSS(Math.round(continueTimeMs / 1000))} (${calculateShowMoneyAndFormat(seasonDetails.grade, continueTimeMs / 1000, nowDate)}) / ${formatSecondsAsHHMMSS(continueEpisode.videoDurationSec)} (${calculateShowMoneyAndFormat(seasonDetails.grade, continueEpisode.videoDurationSec, nowDate)})`,
                    ),
                  ),
                ),
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 2rem;`,
            }),
            E.div(
              {
                class: "season-details-actions",
                style: `display: flex; flex-flow: row wrap; align-items: center; gap: 2rem;`,
              },
              E.div(
                {
                  class: "season-details-rating",
                  style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center;`,
                },
                E.div(
                  {
                    class: "season-item-rating-icon",
                    style: `flex: 0 0 auto; width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                  },
                  createFilledStarIcon(SCHEME.star),
                ),
                E.div({
                  style: `flex: 0 0 auto; width: .5rem;`,
                }),
                E.div(
                  {
                    class: "season-item-rating",
                    style: `flex: 0 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    `${formatRating(seasonDetails.averageRating)} (${formatRatingsCountShort(seasonDetails.ratingsCount)})`,
                  ),
                ),
                E.div({
                  style: `flex: 0 0 auto; width: 1rem;`,
                }),
                E.div(
                  {
                    style: `display: flex; flex-flow: row nowrap; align-items: center; border-radius: .5rem; border: .1rem solid ${SCHEME.neutral1}; `,
                  },
                  E.divRef(this.ratingOneStarButton, {
                    class: "season-item-rating-one-star-icon",
                    style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem; cursor: pointer;`,
                  }),
                  E.divRef(this.ratingTwoStarButton, {
                    class: "season-item-rating-two-star-icon",
                    style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem; cursor: pointer;`,
                  }),
                  E.divRef(this.ratingThreeStarButton, {
                    class: "season-item-rating-three-star-icon",
                    style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem; cursor: pointer;`,
                  }),
                  E.divRef(this.ratingFourStarButton, {
                    class: "season-item-rating-four-star-icon",
                    style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem; cursor: pointer;`,
                  }),
                  E.divRef(this.ratingFiveStarButton, {
                    class: "season-item-rating-five-star-icon",
                    style: `flex: 0 0 auto; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem; cursor: pointer;`,
                  }),
                ),
              ),
              assign(
                this.watchLaterButton,
                OutlineBlockingButton.create(
                  `display: flex; flex-flow: row nowrap; align-items: center; gap: .7rem;`,
                )
                  .append(
                    E.div(
                      {
                        class: "season-details-watch-later-icon",
                        style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                      },
                      createBookmarkIcon(SCHEME.neutral1),
                    ),
                    E.text(LOCALIZED_TEXT.watchLaterLabel),
                  )
                  .enable(),
              ).body,
              assign(
                this.removeWatchLaterButton,
                OutlineBlockingButton.create(
                  `display: flex; flex-flow: row nowrap; align-items: center; gap: .7rem;`,
                )
                  .append(
                    E.div(
                      {
                        class: "season-details-watch-later-icon",
                        style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                      },
                      createFilledBookmarkIcon(SCHEME.neutral1),
                    ),
                    E.text(LOCALIZED_TEXT.watchLaterRemoveLabel),
                  )
                  .enable(),
              ).body,
              E.divRef(
                this.shareButton,
                {
                  class: "season-details-share",
                  style: `${OUTLINE_BUTTON_STYLE} display: flex; flex-flow: row nowrap; align-items: center; gap: .7rem;`,
                },
                E.div(
                  {
                    class: "season-details-share-icon",
                    style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                  },
                  createShareIcon(SCHEME.neutral1),
                ),
                E.text(LOCALIZED_TEXT.shareLabel),
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 2rem;`,
            }),
            E.divRef(
              this.publisherButton,
              {
                class: "publisher-item",
                style: `cursor: pointer; max-width: 50rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; padding: 1.5rem 2rem; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
              },
              E.image({
                class: "publisher-item-avatar",
                style: `flex: 0 0 auto; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: 100%;`,
                src: publisher.avatarSmallUrl,
                alt: publisher.naturalName,
              }),
              E.div(
                {
                  class: "publisher-item-info",
                  style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: .5rem;`,
                },
                E.div(
                  {
                    class: "publisher-item-name",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
                  },
                  E.text(publisher.naturalName),
                ),
                E.div(
                  {
                    class: "publisher-item-id",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
                  },
                  E.text(`${AT_USER}${publisher.accountId}`),
                ),
              ),
              E.div(
                {
                  class: "text-values-group-edit-icon",
                  style: `flex: 0 0 auto; height: ${ICON_M}rem; transform: rotate(180deg);`,
                },
                createArrowIcon(SCHEME.neutral1),
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 1.5rem;`,
            }),
            E.divRef(
              this.descriptionText,
              {
                class: "season-details-description-text",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
              },
              E.text(seasonDetails.description),
            ),
            E.div({
              style: `flex: 0 0 auto; height: .5rem;`,
            }),
            E.divRef(
              this.showMoreDescriptionButton,
              {
                class: "season-details-show-more-description-button",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.showMoreButtonLabel),
            ),
            E.divRef(
              this.showLessDescriptionButton,
              {
                class: "season-details-show-more-description-button",
                style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem;`,
              },
              E.text(LOCALIZED_TEXT.showLessButtonLabel),
            ),
          ),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        E.divRef(
          this.episodesList,
          {
            class: "season-details-episodes-list",
            style: `align-self: center; width: max(70%, min(50rem, 100%)); display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "season-details-total-episodes",
              style: `width: 100%; text-align: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1};`,
            },
            E.text(
              `${LOCALIZED_TEXT.totalEpisodes[0]}${seasonDetails.totalEpisodes}${LOCALIZED_TEXT.totalEpisodes[1]}`,
            ),
          ),
          assign(
            this.loadMorePrevEpisodesButton,
            LoadMoreEpisodesButton.create(
              LOCALIZED_TEXT.loadMorePrevEpisodesButtonLabel,
            ).enable(),
          ).body,
          ...episodes.map((episode) => this.createEpisodeItem(episode)),
          assign(
            this.loadMoreNextEpisodesButton,
            LoadMoreEpisodesButton.create(
              LOCALIZED_TEXT.loadMoreNextEpisodesButtonLabel,
            ).enable(),
          ).body,
        ),
      ),
    );
    this.setIndividualRating(individualRatingResponse.rating);
    if (checkInWatchLaterListResponse.isIn) {
      this.watchLaterButton.val.hide();
      this.removeWatchLaterButton.val.show();
    } else {
      this.watchLaterButton.val.show();
      this.removeWatchLaterButton.val.hide();
    }
    this.checkDescriptionLength();
    this.hideLoadMorePrevButtonIfNoMore();
    this.hideLoadMoreNextButtonIfNoMore();

    if (continueEpisodePremiered) {
      this.continueEpisodeButton.val.addEventListener("click", () => {
        this.emit("play", this.seasonId, continueEpisode.episodeId);
      });
    }
    this.ratingOneStarButton.val.addEventListener("click", () =>
      this.toggleIndividualRating(1),
    );
    this.ratingTwoStarButton.val.addEventListener("click", () =>
      this.toggleIndividualRating(2),
    );
    this.ratingThreeStarButton.val.addEventListener("click", () =>
      this.toggleIndividualRating(3),
    );
    this.ratingFourStarButton.val.addEventListener("click", () =>
      this.toggleIndividualRating(4),
    );
    this.ratingFiveStarButton.val.addEventListener("click", () =>
      this.toggleIndividualRating(5),
    );
    this.watchLaterButton.val.addAction(
      () => this.addToWatchLater(),
      () => this.postAddToWatchLater(),
    );
    this.removeWatchLaterButton.val.addAction(
      () => this.removeFromWatchLater(),
      () => this.postRemoveFromWatchLater(),
    );
    this.shareButton.val.addEventListener("click", () => this.copyShareLink());
    this.publisherButton.val.addEventListener("click", () =>
      this.emit("publisherShowroom", publisher.accountId),
    );
    this.showMoreDescriptionButton.val.addEventListener("click", () =>
      this.showMoreDescription(),
    );
    this.showLessDescriptionButton.val.addEventListener("click", () =>
      this.showLessDescription(),
    );
    this.loadMorePrevEpisodesButton.val.addAction(
      () => this.loadMorePreviousEpisodes(),
      () => this.hideLoadMorePrevButtonIfNoMore(),
    );
    this.loadMoreNextEpisodesButton.val.addAction(
      () => this.loadMoreNextEpisodes(),
      () => this.hideLoadMoreNextButtonIfNoMore(),
    );
    this.emit("loaded");
  }

  private async getSeasonDetails(): Promise<{
    seasonDetails: SeasonDetails;
    publisher: AccountSummary;
  }> {
    let { seasonDetails } = await this.serviceClient.send(
      newGetSeasonDetailsRequest({
        seasonId: this.seasonId,
      }),
    );
    let { account } = await this.serviceClient.send(
      newGetAccountSummaryRequest({
        accountId: seasonDetails.publisherId,
      }),
    );
    return {
      seasonDetails,
      publisher: account,
    };
  }

  private async getEpisodes(): Promise<{
    continueEpisode: Episode;
    continueTimeMs: number;
    rewatching: boolean;
    episodes: Array<Episode>;
    prevIndexCursor: number;
    nextIndexCursor: number;
  }> {
    let response = await this.serviceClient.send(
      newGetContinueEpisodeRequest({
        seasonId: this.seasonId,
      }),
    );
    let [
      { watchedVideoTimeMs },
      { episodes: nextEpisodes, indexCursor: nextIndexCursor },
      { episodes: prevEpisodes, indexCursor: prevIndexCursor },
    ] = await Promise.all([
      this.serviceClient.send(
        newGetLatestWatchedVideoTimeOfEpisodeRequest({
          seasonId: this.seasonId,
          episodeId: response.episode.episodeId,
        }),
      ),
      this.serviceClient.send(
        newListEpisodesRequest({
          seasonId: this.seasonId,
          limit: SeasonDetailsPage.INIT_NEXT_LIMIT,
          next: true,
          indexCursor: response.episode.index - 1,
        }),
      ),
      this.serviceClient.send(
        newListEpisodesRequest({
          seasonId: this.seasonId,
          limit: SeasonDetailsPage.INIT_PREV_LIMIT,
          next: false,
          indexCursor: response.episode.index,
        }),
      ),
    ]);
    return {
      continueEpisode: response.episode,
      continueTimeMs: watchedVideoTimeMs ?? 0,
      rewatching: response.rewatching,
      episodes: [...prevEpisodes, ...nextEpisodes],
      prevIndexCursor,
      nextIndexCursor,
    };
  }

  private createEpisodeItem(episode: Episode): HTMLDivElement {
    let nowDate = this.getNowDate();
    let hasPremiered = episode.premiereTimeMs <= nowDate.getTime();
    let progressIcon = new Ref<HTMLDivElement>();
    let continueAtText = new Ref<Text>();
    let body = E.div(
      {
        class: "season-details-episode-item",
        style: `padding: 1rem 1.5rem; border-bottom: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: 1.5rem; align-items: center; cursor: ${hasPremiered ? "pointer" : "default"};`,
      },
      E.div(
        {
          class: "season-details-episode-item-icon",
          style: `flex: 0 0 auto; width: ${ICON_L}rem; height: ${ICON_L}rem;`,
        },
        hasPremiered
          ? createPlayIcon(SCHEME.neutral1)
          : createClockIcon(SCHEME.neutral1),
      ),
      E.div(
        {
          class: "season-details-episode-item-info",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "season-details-episode-item-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(episode.name),
        ),
        hasPremiered
          ? E.div(
              {
                class: "season-details-episode-progress-line",
                style: `display: flex; flex-flow: row nowrap; align-items: center;`,
              },
              E.divRef(
                progressIcon,
                {
                  class: "season-details-episode-progress-icon",
                  style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
                },
                createCircularProgressIcon(SCHEME.progress, SCHEME.neutral2, 0),
              ),
              E.div({
                style: `flex: 0 0 auto; width: 1rem;`,
              }),
              E.div(
                {
                  class: "season-details-episode-conintue-at",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.textRef(continueAtText, `${formatSecondsAsHHMMSS(0)}`),
                E.text(
                  ` / ${formatSecondsAsHHMMSS(episode.videoDurationSec)} (${calculateShowMoneyAndFormat(this.seasonDetails.grade, episode.videoDurationSec, nowDate)})`,
                ),
              ),
            )
          : E.div(
              {
                class: "season-details-episode-premiere-time",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.episodePremieresAt}${formatUpcomingPremiereTime(episode.premiereTimeMs)}`,
              ),
            ),
      ),
    );
    this.episodeItems.push(body);
    if (hasPremiered) {
      this.getContinueTimeMsForEpisode(
        episode.episodeId,
        episode.videoDurationSec,
        progressIcon.val,
        continueAtText.val,
      );
      body.addEventListener("click", () => {
        this.emit("play", this.seasonId, episode.episodeId);
      });
    }
    return body;
  }

  private async getContinueTimeMsForEpisode(
    episodeId: string,
    videoDurationSec: number,
    progressIcon: HTMLDivElement,
    continueAtText: Text,
  ): Promise<void> {
    let response = await this.serviceClient.send(
      newGetLatestWatchedVideoTimeOfEpisodeRequest({
        seasonId: this.seasonId,
        episodeId: episodeId,
      }),
    );
    let continueTimeMs = response.watchedVideoTimeMs ?? 0;
    progressIcon.lastElementChild.remove();
    progressIcon.append(
      createCircularProgressIcon(
        SCHEME.progress,
        SCHEME.neutral2,
        continueTimeMs / 1000 / videoDurationSec,
      ),
    );
    continueAtText.textContent = formatSecondsAsHHMMSS(continueTimeMs / 1000);
    this.emit("gotContinueTime");
  }

  private async loadMorePreviousEpisodes(): Promise<void> {
    let response = await this.serviceClient.send(
      newListEpisodesRequest({
        seasonId: this.seasonId,
        limit: SeasonDetailsPage.LIST_EPISODES_LIMIT,
        next: false,
        indexCursor: this.prevIndexCursor,
      }),
    );
    response.episodes.forEach((episode) => {
      this.loadMorePrevEpisodesButton.val.body.after(
        this.createEpisodeItem(episode),
      );
    });
    this.prevIndexCursor = response.indexCursor;
  }

  private hideLoadMorePrevButtonIfNoMore(): void {
    if (!this.prevIndexCursor) {
      this.loadMorePrevEpisodesButton.val.hide();
    }
    this.emit("prevEpisodesLoaded");
  }

  private async loadMoreNextEpisodes(): Promise<void> {
    let response = await this.serviceClient.send(
      newListEpisodesRequest({
        seasonId: this.seasonId,
        limit: SeasonDetailsPage.LIST_EPISODES_LIMIT,
        next: true,
        indexCursor: this.nextIndexCursor,
      }),
    );
    response.episodes.forEach((episode) => {
      this.loadMoreNextEpisodesButton.val.body.before(
        this.createEpisodeItem(episode),
      );
    });
    this.nextIndexCursor = response.indexCursor;
  }

  private hideLoadMoreNextButtonIfNoMore(): void {
    if (!this.nextIndexCursor) {
      this.loadMoreNextEpisodesButton.val.hide();
    }
    this.emit("nextEpisodesLoaded");
  }

  private setIndividualRating(rating: number = 0): void {
    this.individualRating = rating;
    this.ratingOneStarButton.val.lastElementChild?.remove();
    if (this.individualRating >= 1) {
      this.ratingOneStarButton.val.append(createFilledStarIcon(SCHEME.star));
    } else {
      this.ratingOneStarButton.val.append(createStarIcon(SCHEME.star));
    }
    this.ratingTwoStarButton.val.lastElementChild?.remove();
    if (this.individualRating >= 2) {
      this.ratingTwoStarButton.val.append(createFilledStarIcon(SCHEME.star));
    } else {
      this.ratingTwoStarButton.val.append(createStarIcon(SCHEME.star));
    }
    this.ratingThreeStarButton.val.lastElementChild?.remove();
    if (this.individualRating >= 3) {
      this.ratingThreeStarButton.val.append(createFilledStarIcon(SCHEME.star));
    } else {
      this.ratingThreeStarButton.val.append(createStarIcon(SCHEME.star));
    }
    this.ratingFourStarButton.val.lastElementChild?.remove();
    if (this.individualRating >= 4) {
      this.ratingFourStarButton.val.append(createFilledStarIcon(SCHEME.star));
    } else {
      this.ratingFourStarButton.val.append(createStarIcon(SCHEME.star));
    }
    this.ratingFiveStarButton.val.lastElementChild?.remove();
    if (this.individualRating >= 5) {
      this.ratingFiveStarButton.val.append(createFilledStarIcon(SCHEME.star));
    } else {
      this.ratingFiveStarButton.val.append(createStarIcon(SCHEME.star));
    }
  }

  private async toggleIndividualRating(rating: number): Promise<void> {
    if (this.individualRating === rating) {
      this.setIndividualRating();
      await this.serviceClient.send(
        newUnrateSeasonRequest({
          seasonId: this.seasonId,
        }),
      );
    } else {
      this.setIndividualRating(rating);
      await this.serviceClient.send(
        newRateSeasonRequest({
          seasonId: this.seasonId,
          rating,
        }),
      );
    }
    this.emit("rated");
  }

  private async addToWatchLater(): Promise<void> {
    await this.serviceClient.send(
      newAddToWatchLaterListRequest({
        seasonId: this.seasonId,
      }),
    );
  }

  private postAddToWatchLater(): void {
    this.watchLaterButton.val.hide();
    this.removeWatchLaterButton.val.show();
    this.emit("watchedLater");
  }

  private async removeFromWatchLater(): Promise<void> {
    await this.serviceClient.send(
      newDeleteFromWatchLaterListRequest({
        seasonId: this.seasonId,
      }),
    );
  }

  private postRemoveFromWatchLater(): void {
    this.watchLaterButton.val.show();
    this.removeWatchLaterButton.val.hide();
    this.emit("watchedLater");
  }

  private checkDescriptionLength(): void {
    if (
      this.descriptionText.val.scrollHeight >
      LINE_HEIGHT_M * getRootFontSize() * 3
    ) {
      this.showLessDescription();
    } else {
      this.showMoreDescriptionButton.val.style.display = "none";
      this.showLessDescriptionButton.val.style.display = "none";
    }
  }

  private showMoreDescription(): void {
    this.descriptionText.val.style.maxHeight = "none";
    this.showMoreDescriptionButton.val.style.display = "none";
    this.showLessDescriptionButton.val.style.display = "block";
  }

  private showLessDescription(): void {
    this.descriptionText.val.style.maxHeight = `${LINE_HEIGHT_M * 3}rem`;
    this.showMoreDescriptionButton.val.style.display = "block";
    this.showLessDescriptionButton.val.style.display = "none";
  }

  private async copyShareLink(): Promise<void> {
    let url = window.location.href; // TODO: Use UrlBuilder.
    await navigator.clipboard.writeText(url);
    while (this.shareButton.val.lastChild) {
      this.shareButton.val.lastChild.remove();
    }
    this.shareButton.val.append(
      E.div(
        {
          class: "season-details-share-link-copied-icon",
          style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
        },
        createCheckmarkIcon(SCHEME.neutral1),
      ),
      E.text(LOCALIZED_TEXT.shareLinkCopiedLabel),
    );
    this.emit("shareLinkCopied");
  }

  public remove(): void {
    this.body.remove();
  }
}

export class LoadMoreEpisodesButton<
  Response = void,
> extends BlockingButton<Response> {
  public static create<Response = void>(
    label: string,
  ): LoadMoreEpisodesButton<Response> {
    return new LoadMoreEpisodesButton<Response>(label);
  }

  private plusIcon = new Ref<SVGSVGElement>();
  private text = new Ref<HTMLDivElement>();

  public constructor(label: string) {
    super(
      `${NULLIFIED_BUTTON_STYLE} width: 100%; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; cursor: pointer; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: 1rem;`,
    );
    this.append(
      E.div(
        {
          class: "season-details-episodes-load-more-prev-icon",
          style: `width: ${ICON_S}rem; height: ${ICON_S}rem;`,
        },
        assign(this.plusIcon, createPlusIcon("")),
      ),
      E.divRef(
        this.text,
        {
          class: "season-details-episodes-load-more-prev-text",
          style: `font-size: ${FONT_M}rem;`,
        },
        E.text(label),
      ),
    );
  }

  protected enableOverride(): void {
    this.plusIcon.val.style.stroke = SCHEME.neutral1;
    this.text.val.style.color = SCHEME.neutral0;
  }

  protected disableOverride(): void {
    this.plusIcon.val.style.stroke = SCHEME.neutral2;
    this.text.val.style.color = SCHEME.neutral2;
  }
}
