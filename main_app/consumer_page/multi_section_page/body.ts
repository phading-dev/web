import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import {
  createAccountIcon,
  createHistoryIcon,
  createHomeIcon,
  createSearchIcon,
} from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FULL_PAGE_CARD_STYLE } from "../../../common/page_style";
import { FONT_M, FONT_S, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ContinueEpisodeItem } from "./continue_episode_item";
import { SeasonItem } from "./season_item";
import {
  newListContinueWatchingSeasonsRequest,
  newListSeasonsByRecentPremiereTimeRequest,
} from "@phading/product_service_interface/show/web/consumer/client";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface MultiSectionPage {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "listContinueWatching", listener: () => void): this;
  on(event: "listRecentPremieres", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class MultiSectionPage extends EventEmitter {
  public static create(): MultiSectionPage {
    return new MultiSectionPage(SERVICE_CLIENT);
  }

  private static NAVIGATION_BUTTON_STYLE = `flex: 1 0 0; padding: .5rem 0; display: flex; flex-flow: column nowrap; align-items: center; cursor: pointer;`;
  private static NAVIGATION_ICON_STYLE = `width: 2.6rem;`;
  private static NAVIGATION_TEXT_STYLE = `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0}; padding-top: .5rem;`;
  public body: HTMLDivElement;
  public continueWatchingViewMore = new Ref<HTMLDivElement>();
  public recentPremiereViewMore = new Ref<HTMLDivElement>();

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.body = E.div(
      {
        class: "multi-section-page",
        style: `${FULL_PAGE_CARD_STYLE} padding: 1rem 1rem 7rem 1rem; gap: 2rem;`,
      },
      E.div(
        {
          class: "multi-section-navigation-bar-container",
          style: `position: fixed; left: 0; bottom: 0; z-index: 1; width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center;`,
        },
        E.div(
          {
            class: "multi-section-navigation-bar",
            style: `background-color: ${SCHEME.neutral4}; width: 100%; max-width: 60rem; border-top-left-radius: .5rem; border-top-right-radius: .5rem; display: flex; flex-flow: row nowrap; gap: 1rem;`,
          },
          E.div(
            {
              class: "multi-section-navigation-bar-home-button",
              style: MultiSectionPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-home-icon",
                style: MultiSectionPage.NAVIGATION_ICON_STYLE,
              },
              createHomeIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-home-text",
                style: MultiSectionPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.homeLabel),
            ),
          ),
          E.div(
            {
              class: "multi-section-navigation-bar-explore-button",
              style: MultiSectionPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-explore-icon",
                style: MultiSectionPage.NAVIGATION_ICON_STYLE,
              },
              createSearchIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-explore-text",
                style: MultiSectionPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.exploreLabel),
            ),
          ),
          E.div(
            {
              class: "multi-section-navigation-bar-activity-button",
              style: MultiSectionPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-activity-icon",
                style: MultiSectionPage.NAVIGATION_ICON_STYLE,
              },
              createHistoryIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-activity-text",
                style: MultiSectionPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.activityLabel),
            ),
          ),
          E.div(
            {
              class: "multi-section-navigation-bar-account-button",
              style: MultiSectionPage.NAVIGATION_BUTTON_STYLE,
            },
            E.div(
              {
                class: "multi-section-navigation-bar-account-icon",
                style: MultiSectionPage.NAVIGATION_ICON_STYLE,
              },
              createAccountIcon(SCHEME.neutral1),
            ),
            E.div(
              {
                class: "multi-section-navigation-bar-account-text",
                style: MultiSectionPage.NAVIGATION_TEXT_STYLE,
              },
              E.text(LOCALIZED_TEXT.accountLabel),
            ),
          ),
        ),
      ),
    );

    this.load();
  }

  private async load() {
    let [continueWatchingSeasonsResponse, recentPremiereSeasonsResponse] =
      await Promise.all([
        this.serviceClient.send(
          newListContinueWatchingSeasonsRequest({
            limit: 3,
          }),
        ),
        this.serviceClient.send(
          newListSeasonsByRecentPremiereTimeRequest({
            limit: 10,
          }),
        ),
      ]);
    this.body.append(
      ...(continueWatchingSeasonsResponse.continues.length > 0
        ? [
            E.div(
              {
                class: "multi-section-continue-watching-section",
                style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
              },
              E.div(
                {
                  class: "multi-section-continue-watching-title",
                  style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.continueWatchingTitle),
              ),
              E.div(
                {
                  class: "multi-section-continue-watching-content",
                  style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(36rem, 1fr)); gap: 1rem;`,
                },
                ...continueWatchingSeasonsResponse.continues.map((season) => {
                  let item = new ContinueEpisodeItem(
                    season.season,
                    season.episode,
                    `flex: 1 0 37rem; max-width: 58rem;`,
                  );
                  item.on("play", (seasonId, episodeId) => {
                    this.emit("play", seasonId, episodeId);
                  });
                  return item.body;
                }),
              ),
              E.divRef(
                this.continueWatchingViewMore,
                {
                  class: "multi-section-continue-watching-view-more",
                  style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; align-self: flex-end;`,
                },
                E.text(LOCALIZED_TEXT.viewMoreLink),
              ),
            ),
          ]
        : []),
      E.div(
        {
          class: "multi-section-recent-premiere-section",
          style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "multi-section-recent-premiere-title",
            style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.recentPremiereTitle),
        ),
        E.div(
          {
            class: "multi-section-recent-premiere-content",
            style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(17.6rem, 1fr)); gap: 1rem;`,
          },
          ...recentPremiereSeasonsResponse.seasons.map((season) => {
            let item = new SeasonItem(season, `width: 100%;`);
            item.on("showDetails", (seasonId) => {
              this.emit("showDetails", seasonId);
            });
            return item.body;
          }),
        ),
        E.divRef(
          this.recentPremiereViewMore,
          {
            class: "multi-section-recent-premiere-view-more",
            style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; align-self: flex-end;`,
          },
          E.text(LOCALIZED_TEXT.viewMoreLink),
        ),
      ),
    );

    if (continueWatchingSeasonsResponse.continues.length > 0) {
      this.continueWatchingViewMore.val.addEventListener("click", () => {
        this.emit("listContinueWatching");
      });
    }
    this.recentPremiereViewMore.val.addEventListener("click", () => {
      this.emit("listRecentPremieres");
    });
    this.emit("loaded");
  }
}
