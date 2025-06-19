import { SCHEME } from "../../../common/color_scheme";
import {
  calculateEstimatedMoney,
  formatMoney,
} from "../../../common/formatter/price";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { FONT_L, FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { eBox } from "../../../common/value_box";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  eContainerTitle,
  eContinueEpisodeItem,
  eContinueEpisodeItemContainerRef,
  eFullItemsPage,
} from "../common/elements";
import { newListMeterReadingsPerDayRequest } from "@phading/meter_service_interface/show/web/consumer/client";
import { newListWatchSessionsRequest } from "@phading/play_activity_service_interface/show/web/client";
import { ProductID } from "@phading/price";
import { newGetEpisodeWithSeasonSummaryRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { SeasonSummaryAndEpisode } from "@phading/product_service_interface/show/web/consumer/info";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface HistoryPage {
  on(event: "viewUsage", listener: () => void): this;
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "loaded", listener: () => void): this;
}

export class HistoryPage extends EventEmitter {
  public static create(): HistoryPage {
    return new HistoryPage(SERVICE_CLIENT, () => new Date());
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  public estimatesCard = new Ref<HTMLDivElement>();
  private dateToContentContainer = new Map<string, Ref<HTMLDivElement>>();
  private loadingSection = new Ref<ScrollLoadingSection>();
  private updatedTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = eFullItemsPage();
    this.loadEstimates();
  }

  private async loadEstimates(): Promise<void> {
    let today = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    let startDate = today
      .clone()
      .moveToFirstDayOfMonth()
      .toLocalDateISOString();
    let endDate = today.clone().moveToLastDayOfMonth().toLocalDateISOString();
    let response = await this.serviceClient.send(
      newListMeterReadingsPerDayRequest({
        startDate,
        endDate,
      }),
    );

    let thisMonthStr = today.toLocalMonthISOString();
    let { amount, price } = calculateEstimatedMoney(
      ProductID.SHOW,
      response.readings.reduce(
        (acc, reading) => acc + reading.watchTimeSecGraded,
        0,
      ),
      thisMonthStr,
    );
    this.body.append(
      E.div(
        {
          class: "history-page-estimates-container",
          style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center;`,
        },
        assign(
          this.estimatesCard,
          eBox(
            [
              E.div(
                {
                  class: "history-page-estimates-title",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(LOCALIZED_TEXT.estimatedChargeTitle),
              ),
              E.div(
                {
                  class: "history-page-estimates-amount",
                  style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(formatMoney(amount, price.currency)),
              ),
              E.div(
                {
                  class: "history-page-estimates-month",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${LOCALIZED_TEXT.billingMonth[0]}${thisMonthStr}${LOCALIZED_TEXT.billingMonth[1]}`,
                ),
              ),
              E.div(
                {
                  class: "history-page-estimates-view-details",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; align-self: flex-end;`,
                },
                E.text(`${LOCALIZED_TEXT.viewDetailedUsageLabel}`),
              ),
            ],
            {
              customeStyle: `flex: 1; max-width: 60rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; gap: 1rem;`,
            },
          ),
        ),
      ),
      E.div({
        style: `style: 0 0 auot; height: 2rem;`,
      }),
      eContainerTitle(LOCALIZED_TEXT.watchHistoryTitle),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val
      .addLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();

    this.estimatesCard.val.addEventListener("click", () =>
      this.emit("viewUsage"),
    );
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListWatchSessionsRequest({
        limit: HistoryPage.LIMIT,
        updatedTimeCursor: this.updatedTimeCursor,
      }),
    );
    let summaries = new Array<SeasonSummaryAndEpisode>(
      response.sessions.length,
    );
    await Promise.all(
      response.sessions.map(async (session, i) => {
        try {
          let summaryResponse = await this.serviceClient.send(
            newGetEpisodeWithSeasonSummaryRequest({
              seasonId: session.seasonId,
              episodeId: session.episodeId,
            }),
          );
          summaries[i] = summaryResponse.summary;
        } catch (e) {
          console.log(e);
          return;
        }
      }),
    );

    response.sessions.forEach((session, i) => {
      let summary = summaries[i];
      if (!summary || !summary.episode.canPlay) {
        return;
      }

      let contentContainer = this.dateToContentContainer.get(session.date);
      if (!contentContainer) {
        contentContainer = new Ref<HTMLDivElement>();
        this.loadingSection.val.body.before(
          E.div({
            style: `flex: 0 0 auto; height: 2rem;`,
          }),
          eContainerTitle(session.date),
          E.div({
            style: `flex: 0 0 auto; height: 1rem;`,
          }),
          eContinueEpisodeItemContainerRef(contentContainer),
        );
        this.dateToContentContainer.set(session.date, contentContainer);
      }
      let item = eContinueEpisodeItem(
        summary.season,
        summary.episode,
        session.latestWatchedVideoTimeMs,
      );
      item.addEventListener("click", () => {
        this.emit("play", session.seasonId, session.episodeId);
      });
      contentContainer.val.append(item);
    });
    this.updatedTimeCursor = response.updatedTimeCursor;
    return Boolean(response.updatedTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection?.val.stopLoading();
    this.removeAllListeners();
  }
}
