import { AT_USER } from "../../../common/at_user";
import {
  BlockingButton,
  Button,
  CLICKABLE_TEXT_STYLE,
  COMMENT_BUTTON_WITHOUT_BORDER_STYLE,
  IconButton,
  OutlineButton,
  createBackButton,
} from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import {
  formatPremieredTime,
  formatUpcomingPremiereTime,
} from "../../../common/formatter/date";
import {
  calculateEstimatedShowMoneyAndFormat,
  formatShowPrice,
} from "../../../common/formatter/price";
import {
  formatRating,
  formatRatingsCountShort,
} from "../../../common/formatter/rating";
import { formatSecondsAsHHMMSS } from "../../../common/formatter/timestamp";
import {
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
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../common/page_elements";
import { getRootFontSize } from "../../../common/root_font_size";
import { eCoverImage } from "../../../common/season_cover_image";
import {
  AVATAR_S,
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  BORDER_WIDTH_2,
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_1X,
  GAP_2X,
  GAP_0_25X,
  GAP_0_5X,
  ICON_BUTTON_L,
  ICON_BUTTON_M,
  ICON_L,
  ICON_M,
  ICON_S,
  ICON_XL,
  LINE_HEIGHT_L,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_XL,
} from "../../../common/sizes";
import { eRowBoxWithArrow } from "../../../common/value_box";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  newAddToWatchLaterListRequest,
  newCheckInWatchLaterListRequest,
  newDeleteFromWatchLaterListRequest,
  newGetLatestWatchedVideoTimeOfEpisodeRequest,
} from "@phading/play_activity_service_interface/show/web/client";
import {
  newGetContinueEpisodeRequest,
  newGetIndividualSeasonRatingRequest,
  newRateSeasonRequest,
  newUnrateSeasonRequest,
} from "@phading/product_service_interface/show/web/consumer/client";
import {
  newGetSeasonDetailsRequest,
  newListEpisodesRequest,
} from "@phading/product_service_interface/show/web/public/client";
import {
  Episode,
  SeasonDetails,
} from "@phading/product_service_interface/show/web/public/info";
import { AccountSummary } from "@phading/user_service_interface/web/third_person/account";
import { newGetAccountSummaryRequest } from "@phading/user_service_interface/web/third_person/client";
import { buildUrl } from "@phading/web_interface/url_builder";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SeasonDetailsPage {
  on(event: "back", listener: () => void): this;
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "showroom", listener: (publisherId: string) => void): this;
  on(event: "gotContinueTime", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "rated", listener: () => void): this;
  on(event: "watchedLater", listener: () => void): this;
  on(event: "shareLinkCopied", listener: (url: string) => void): this;
  on(event: "prevEpisodesLoaded", listener: () => void): this;
  on(event: "nextEpisodesLoaded", listener: () => void): this;
}

export class SeasonDetailsPage extends EventEmitter {
  public static create(seasonId: string): SeasonDetailsPage {
    return new SeasonDetailsPage(
      window,
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
    );
  }

  private static INIT_PREV_LIMIT = 1;
  private static INIT_NEXT_LIMIT = 3;
  private static LIST_EPISODES_LIMIT = 10;
  private static MAX_DAYS_TO_SHOW_INCREASED_PRICE = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<IconButton>();
  public continueEpisodeButton = new Ref<HTMLDivElement>();
  public ratingOneStarButton = new Ref<HTMLDivElement>();
  public ratingTwoStarButton = new Ref<HTMLDivElement>();
  public ratingThreeStarButton = new Ref<HTMLDivElement>();
  public ratingFourStarButton = new Ref<HTMLDivElement>();
  public ratingFiveStarButton = new Ref<HTMLDivElement>();
  public watchLaterButton = new Ref<BlockingButton>();
  public removeWatchLaterButton = new Ref<BlockingButton>();
  public shareButton = new Ref<Button>();
  public publisherButton = new Ref<HTMLDivElement>();
  private descriptionText = new Ref<HTMLDivElement>();
  public showMoreDescriptionButton = new Ref<HTMLDivElement>();
  public showLessDescriptionButton = new Ref<HTMLDivElement>();
  private episodesList = new Ref<HTMLDivElement>();
  public loadMorePrevEpisodesButton = new Ref<BlockingButton>();
  public loadMoreNextEpisodesButton = new Ref<BlockingButton>();
  public episodeItems = new Array<HTMLDivElement>();
  private seasonDetails: SeasonDetails;
  private individualRating: number;
  private prevIndexCursor: number;
  private nextIndexCursor: number;
  private removed = false;

  public constructor(
    private window: Window,
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_XL}rem; padding: ${ICON_BUTTON_L + GAP_0_5X}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
    );
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
    if (this.removed) {
      return;
    }
    document.title = seasonDetails.name;
    this.seasonDetails = seasonDetails;
    this.prevIndexCursor = prevIndexCursor;
    this.nextIndexCursor = nextIndexCursor;
    let nowDate = this.getNowDate();
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
    this.card.val.append(
      assign(this.backButton, createBackButton()).body,
      E.div(
        {
          class: "season-details-info",
          style: `display: flex; flex-flow: row wrap; gap: ${GAP_1X}rem;`,
        },
        E.div(
          {
            class: "season-details-cover-image",
            style: `flex: 1 0 0; min-width: 15rem;`,
          },
          eCoverImage(`100%`, seasonDetails.coverImageUrl),
        ),
        E.div(
          {
            class: "season-details-info-section",
            style: `flex: 2 0 0; min-width: 19rem; display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "season-details-title",
              style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(seasonDetails.name),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          E.div(
            {
              class: "season-item-price",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.currentRate}${formatShowPrice(seasonDetails.grade, nowDate)}${newPricingStartingText ? newPricingStartingText : LOCALIZED_TEXT.billedMonthly}`,
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          E.divRef(
            this.continueEpisodeButton,
            {
              class: "season-details-continue-episode",
              style: `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem; padding: ${GAP_1X}rem; border-radius: ${BORDER_RADIUS_S}rem; border: ${BORDER_WIDTH_2}rem solid ${continueEpisode.canPlay ? SCHEME.primary1 : SCHEME.neutral2}; cursor: ${continueEpisode.canPlay ? "pointer" : "default"};`,
            },
            E.div(
              {
                class: "season-details-continue-episode-icon",
                style: `flex: 0 0 auto; width: ${ICON_XL}rem; height: ${ICON_XL}rem;`,
              },
              continueEpisode.canPlay
                ? rewatching
                  ? createReplayIcon(SCHEME.neutral1)
                  : createPlayIcon(SCHEME.neutral1)
                : createClockIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "season-details-continue-episode-info",
                style: `flex: 1; display: flex; flex-flow: column nowrap; gap: ${GAP_0_5X}rem;`,
              },
              E.div(
                {
                  class: "season-details-continue-episode-title",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(continueEpisode.name),
              ),
              E.div(
                {
                  class: "season-details-continue-episode-premiere-time",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1};`,
                },
                E.text(
                  `${continueEpisode.canPlay ? LOCALIZED_TEXT.episodePremieredOn + formatPremieredTime(continueEpisode.premiereTimeMs) : LOCALIZED_TEXT.episodePremieresAt + formatUpcomingPremiereTime(continueEpisode.premiereTimeMs)}`,
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
                    SCHEME.primary1,
                    SCHEME.neutral2,
                    continueTimeMs / 1000 / continueEpisode.videoDurationSec,
                  ),
                ),
                E.div({
                  style: `flex: 0 0 auto; width: ${GAP_0_5X}rem;`,
                }),
                E.div(
                  {
                    class: "season-details-continue-episode-conintue-at",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    `${formatSecondsAsHHMMSS(Math.round(continueTimeMs / 1000))} (${calculateEstimatedShowMoneyAndFormat(seasonDetails.grade, continueTimeMs / 1000, nowDate)}) / ${formatSecondsAsHHMMSS(continueEpisode.videoDurationSec)} (${calculateEstimatedShowMoneyAndFormat(seasonDetails.grade, continueEpisode.videoDurationSec, nowDate)})`,
                  ),
                ),
              ),
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          E.div(
            {
              class: "season-details-actions",
              style: `display: flex; flex-flow: row wrap; align-items: center; gap: ${GAP_1X}rem;`,
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
                style: `flex: 0 0 auto; width: ${GAP_0_5X}rem;`,
              }),
              E.div(
                {
                  class: "season-item-rating",
                  style: `flex: 0 0 auto; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${formatRating(seasonDetails.averageRating)} (${formatRatingsCountShort(seasonDetails.ratingsCount)})`,
                ),
              ),
              E.div({
                style: `flex: 0 0 auto; width: ${GAP_1X}rem;`,
              }),
              E.div(
                {
                  style: `display: flex; flex-flow: row nowrap; align-items: center; border-radius: ${BORDER_RADIUS_S}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; `,
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
              new BlockingButton(
                new OutlineButton(
                  `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                ).append(
                  E.div(
                    {
                      class: "season-details-watch-later-icon",
                      style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                    },
                    createBookmarkIcon(SCHEME.neutral1),
                  ),
                  E.text(LOCALIZED_TEXT.watchLaterLabel),
                ),
              ),
            ).body,
            assign(
              this.removeWatchLaterButton,
              new BlockingButton(
                new OutlineButton(
                  `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
                ).append(
                  E.div(
                    {
                      class: "season-details-watch-later-icon",
                      style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                    },
                    createFilledBookmarkIcon(SCHEME.neutral1),
                  ),
                  E.text(LOCALIZED_TEXT.watchLaterRemoveLabel),
                ),
              ),
            ).body,
            assign(
              this.shareButton,
              new OutlineButton(
                `display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_0_5X}rem;`,
              ).append(
                E.div(
                  {
                    class: "season-details-share-icon",
                    style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
                  },
                  createShareIcon(SCHEME.neutral1),
                ),
                E.text(LOCALIZED_TEXT.shareLabel),
              ),
            ).body,
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          assign(
            this.publisherButton,
            eRowBoxWithArrow([
              E.div(
                {
                  style: `display: flex; flex-flow: row nowrap; align-items: flex-start; gap: ${GAP_0_5X}rem;`,
                },
                E.image({
                  class: "publisher-item-avatar",
                  style: `flex: 0 0 auto; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; margin-top: ${GAP_0_25X}rem; border-radius: 100%;`,
                  src: publisher.avatarSmallUrl,
                  alt: publisher.name,
                }),
                E.div(
                  {
                    class: "publisher-item-info",
                    style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
                  },
                  E.div(
                    {
                      class: "publisher-item-name",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 2}rem; overflow: hidden;`,
                    },
                    E.text(publisher.name),
                  ),
                  E.div(
                    {
                      class: "publisher-item-id",
                      style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
                    },
                    E.text(`${AT_USER}${publisher.accountId}`),
                  ),
                ),
              ),
            ]),
          ),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
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
            style: `flex: 0 0 auto; height: ${GAP_0_5X}rem;`,
          }),
          E.divRef(
            this.showMoreDescriptionButton,
            {
              class: "season-details-show-more-description-button",
              style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
            },
            E.text(LOCALIZED_TEXT.showMoreButtonLabel),
          ),
          E.divRef(
            this.showLessDescriptionButton,
            {
              class: "season-details-show-more-description-button",
              style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
            },
            E.text(LOCALIZED_TEXT.showLessButtonLabel),
          ),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.divRef(
        this.episodesList,
        {
          class: "season-details-episodes-list",
          style: `align-self: center; width: max(70%, min(32rem, 100%)); display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "season-details-total-episodes",
            style: `width: 100%; text-align: center; font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; padding: ${GAP_0_5X}rem 0; color: ${SCHEME.neutral0}; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1};`,
          },
          E.text(
            `${LOCALIZED_TEXT.totalEpisodes[0]}${seasonDetails.totalEpisodes}${LOCALIZED_TEXT.totalEpisodes[1]}`,
          ),
        ),
        assign(
          this.loadMorePrevEpisodesButton,
          new BlockingButton(
            new LoadMoreEpisodesButton(
              LOCALIZED_TEXT.loadMorePrevEpisodesButtonLabel,
            ),
          ),
        ).body,
        ...episodes.map((episode) => this.createEpisodeItem(episode)),
        assign(
          this.loadMoreNextEpisodesButton,
          new BlockingButton(
            new LoadMoreEpisodesButton(
              LOCALIZED_TEXT.loadMoreNextEpisodesButtonLabel,
            ),
          ),
        ).body,
      ),
    );
    this.backButton.val.addAction(() => this.emit("back"));
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

    if (continueEpisode.canPlay) {
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
    this.shareButton.val.addAction(() => this.copyShareLink());
    this.publisherButton.val.addEventListener("click", () =>
      this.emit("showroom", publisher.accountId),
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
    let progressIcon = new Ref<HTMLDivElement>();
    let continueAtText = new Ref<Text>();
    let body = E.div(
      {
        class: "season-details-episode-item",
        style: `padding: ${GAP_0_5X}rem ${GAP_1X}rem; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; gap: ${GAP_0_5X}rem; align-items: center; cursor: ${episode.canPlay ? "pointer" : "default"};`,
      },
      E.div(
        {
          class: "season-details-episode-item-icon",
          style: `flex: 0 0 auto; width: ${ICON_L}rem; height: ${ICON_L}rem;`,
        },
        episode.canPlay
          ? createPlayIcon(SCHEME.neutral1)
          : createClockIcon(SCHEME.neutral1),
      ),
      E.div(
        {
          class: "season-details-episode-item-info",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "season-details-episode-item-title",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(episode.name),
        ),
        episode.canPlay
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
                createCircularProgressIcon(SCHEME.primary1, SCHEME.neutral2, 0),
              ),
              E.div({
                style: `flex: 0 0 auto; width: ${GAP_0_5X}rem;`,
              }),
              E.div(
                {
                  class: "season-details-episode-continue-at",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.textRef(continueAtText, `${formatSecondsAsHHMMSS(0)}`),
                E.text(
                  ` / ${formatSecondsAsHHMMSS(episode.videoDurationSec)} (${calculateEstimatedShowMoneyAndFormat(this.seasonDetails.grade, episode.videoDurationSec, nowDate)})`,
                ),
              ),
            )
          : E.div(
              {
                class: "season-details-episode-premiere-time",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                `${LOCALIZED_TEXT.episodePremieresAt}${formatUpcomingPremiereTime(episode.premiereTimeMs)}`,
              ),
            ),
      ),
    );
    this.episodeItems.push(body);
    if (episode.canPlay) {
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
        SCHEME.primary1,
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
    let url = buildUrl(this.window.location.origin, {
      main: {
        consumer: {
          seasonDetails: {
            seasonId: this.seasonId,
          },
        },
      },
    });
    await navigator.clipboard.writeText(url);
    this.shareButton.val.clear().append(
      E.div(
        {
          class: "season-details-share-link-copied-icon",
          style: `width: ${ICON_M}rem; height: ${ICON_M}rem; line-height: 1;`,
        },
        createCheckmarkIcon(SCHEME.neutral1),
      ),
      E.text(LOCALIZED_TEXT.shareLinkCopiedLabel),
    );
    this.emit("shareLinkCopied", url);
  }

  public remove(): void {
    this.removed = true;
    document.title = LOCALIZED_TEXT.brandTitle;
    this.body.remove();
    this.removeAllListeners();
  }
}

export class LoadMoreEpisodesButton extends Button {
  private plusIcon = new Ref<SVGSVGElement>();

  public constructor(label: string) {
    super(
      `${COMMENT_BUTTON_WITHOUT_BORDER_STYLE} width: 100%; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
    );
    this.append(
      E.div(
        {
          class: "season-details-episodes-load-more-prev-icon",
          style: `width: ${ICON_S}rem; height: ${ICON_S}rem; line-height: 1;`,
        },
        assign(this.plusIcon, createPlusIcon("")),
      ),
      E.text(label),
    );
    this.enable();
  }

  public enable(): this {
    this.plusIcon.val.style.stroke = SCHEME.neutral1;
    this.body.style.color = SCHEME.neutral0;
    return this;
  }

  public disable(): this {
    this.plusIcon.val.style.stroke = SCHEME.neutral2;
    this.body.style.color = SCHEME.neutral2;
    return this;
  }
}
