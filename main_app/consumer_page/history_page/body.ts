import { SCHEME } from "../../../common/color_scheme";
import {
  toDateISOString,
  toDateWrtTimezone,
  toMonthISOString,
} from "../../../common/date_helper";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { FONT_L, FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  eContinueEpisodeItem,
  eContinueEpisodeItemContainer,
  eFullPage,
} from "../common/elements";
import { newListMeterReadingsPerMonthRequest } from "@phading/meter_service_interface/show/web/consumer/client";
import { newListWatchSessionsRequest } from "@phading/play_activity_service_interface/show/web/client";
import { ProductID } from "@phading/price";
import { CURRENCY_TO_CENTS } from "@phading/price_config/amount_conversion";
import { calculateMoney } from "@phading/price_config/calculator";
import { newGetSeasonAndEpisodeSummaryRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
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
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = eFullPage();
    this.loadEstimates();
  }

  private async loadEstimates(): Promise<void> {
    let formatter = new Intl.NumberFormat([navigator.language], {
      style: "currency",
      currency: ENV_VARS.defaultCurrency,
    });
    let dollarToCents = CURRENCY_TO_CENTS.get(ENV_VARS.defaultCurrency);

    let thisMonth = toMonthISOString(toDateWrtTimezone(this.getNowDate()));
    let response = await this.serviceClient.send(
      newListMeterReadingsPerMonthRequest({
        startMonth: thisMonth,
        endMonth: thisMonth,
      }),
    );
    let amount: number = 0;
    if (response.readings.length > 0) {
      ({ amount } = calculateMoney(
        ProductID.SHOW,
        ENV_VARS.defaultCurrency,
        thisMonth,
        response.readings[0].watchTimeSecGraded,
      ));
    }
    this.body.append(
      E.div(
        {
          class: "history-page-estimates-container",
          style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center;`,
        },
        E.divRef(
          this.estimatesCard,
          {
            class: "history-page-estimates-card",
            style: `flex: 1; max-width: 60rem; border-radius: 1rem; border: .1rem solid ${SCHEME.neutral1}; cursor: pointer; display: flex; flex-flow: column nowrap; gap: 1rem; padding: 1rem;`,
          },
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
            E.text(formatter.format(amount / dollarToCents)),
          ),
          E.div(
            {
              class: "history-page-estimates-month",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.billingMonth[0]}${thisMonth}${LOCALIZED_TEXT.billingMonth[1]}`,
            ),
          ),
          E.div(
            {
              class: "history-page-estimates-view-details",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; align-self: flex-end;`,
            },
            E.text(`${LOCALIZED_TEXT.viewDetailedUsageLabel}`),
          ),
        ),
      ),
      E.div(
        {
          class: "continue-watching-title",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.watchHistoryTitle),
      ),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.startLoading(() => this.load());

    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
    this.estimatesCard.val.addEventListener("click", () =>
      this.emit("viewUsage"),
    );
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListWatchSessionsRequest({
        limit: HistoryPage.LIMIT,
        createdTimeCursor: this.createdTimeCursor,
      }),
    );
    await Promise.all(
      response.sessions.map(async (session) => {
        let summaryResponse = await this.serviceClient.send(
          newGetSeasonAndEpisodeSummaryRequest({
            seasonId: session.seasonId,
            episodeId: session.episodeId,
          }),
        );

        let createdDate = toDateISOString(
          toDateWrtTimezone(new Date(session.createdTimeMs)),
        );
        let contentContainer = this.dateToContentContainer.get(createdDate);
        if (!contentContainer) {
          contentContainer = new Ref<HTMLDivElement>();
          this.body.insertBefore(
            eContinueEpisodeItemContainer(createdDate, contentContainer),
            this.loadingSection.val.body,
          );
          this.dateToContentContainer.set(createdDate, contentContainer);
        }
        let item = eContinueEpisodeItem(
          summaryResponse.summary.season,
          summaryResponse.summary.episode,
          session.latestWatchedTimeMs,
        );
        item.addEventListener("click", () => {
          this.emit("play", session.seasonId, session.episodeId);
        });
        contentContainer.val.append(item);
      }),
    );
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.createdTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection?.val.stopLoading();
  }
}
