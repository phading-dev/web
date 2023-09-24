import EventEmitter = require("events");
import { getAppName } from "../../../../../common/app_name";
import { TEXT_BUTTON_STYLE } from "../../../../../common/button_styles";
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { LARGE_CARD_STYLE, PAGE_STYLE } from "../../../../../common/page_style";
import { getPlaytimeMeterReport } from "@phading/consumer_product_interaction_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UsageReportPage {
  on(event: "loaded", listener: () => void): this;
  on(event: "chooseReports", listener: () => void): this;
}

export class UsageReportPage extends EventEmitter {
  private static LABEL_WIDTH = "5rem";

  public body: HTMLDivElement;
  // Visible for testing
  public seeOtherButton: HTMLDivElement;
  private card: HTMLDivElement;

  public constructor(
    private consumerProductInteractionServiceClient: WebServiceClient,
    private reportId?: string
  ) {
    super();
    let cardRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "usage-report",
        style: PAGE_STYLE,
      },
      E.divRef(cardRef, {
        class: "usage-report-card",
        style: `${LARGE_CARD_STYLE}; display: flex; flex-flow: column nowrap; gap: 2rem;`,
      })
    );
    this.card = cardRef.val;

    this.loadReport();
  }

  private async loadReport(): Promise<void> {
    let playtimeMeterReport = (
      await getPlaytimeMeterReport(
        this.consumerProductInteractionServiceClient,
        {
          reportId: this.reportId,
        }
      )
    ).playtimeMeterReport;

    let startDate = new Date(
      playtimeMeterReport.startTimestamp * 1000
    ).toLocaleDateString();
    let title = `${LOCALIZED_TEXT.usageReportRangePartOneLabel}${startDate}`;
    if (playtimeMeterReport.endTimestamp) {
      let endDate = new Date(
        playtimeMeterReport.endTimestamp * 1000
      ).toLocaleDateString();
      title = `${title}${LOCALIZED_TEXT.usageReportRangePartTwoLabel}${endDate}`;
    }
    this.card.append(
      E.div(
        {
          class: "usage-report-title",
          style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
        },
        E.text(title)
      )
    );

    let mostPlaytimePerApp = 0;
    for (let playtimeMeterPerApp of playtimeMeterReport.playtimeMeterPerApp) {
      if (mostPlaytimePerApp < playtimeMeterPerApp.playtime) {
        mostPlaytimePerApp = playtimeMeterPerApp.playtime;
      }
    }
    for (let playtimeMeterPerApp of playtimeMeterReport.playtimeMeterPerApp) {
      let percentOfMostPlaytime =
        mostPlaytimePerApp > 0
          ? Math.ceil((playtimeMeterPerApp.playtime / mostPlaytimePerApp) * 100)
          : 0;
      this.card.append(
        E.div(
          {
            class: "usage-report-row",
            style: `width: 85%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          E.div(
            {
              class: "usage-report-app-name",
              style: `flex: 0 0 ${UsageReportPage.LABEL_WIDTH}; font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(getAppName(playtimeMeterPerApp.appType))
          ),
          E.div(
            {
              class: "usage-report-usage-bar-wrapper",
              style: `flex: 1 0 0; height: 2rem; position: relative;`,
            },
            E.div({
              class: "usage-report-usage-bar",
              style: `position: absolute; left: 0; top: 0; width: ${percentOfMostPlaytime}%; height: 100%; background-color: ${SCHEME.primary1};`,
            }),
            E.div(
              {
                class: "usage-report-usage-value",
                style: `position: relative; font-size: 1.4rem; width: ${percentOfMostPlaytime}%; line-height: 2rem; text-align: center; color: ${SCHEME.neutral0};`,
              },
              E.text(`${playtimeMeterPerApp.playtime}`)
            )
          )
        )
      );
    }

    let seeOtherButtonRef = new Ref<HTMLDivElement>();
    this.card.append(
      E.div(
        {
          class: "usage-report-sum",
          style: `width: 85%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
        },
        E.div(
          {
            class: "usage-report-sum-label",
            style: `flex: 0 0 ${UsageReportPage.LABEL_WIDTH}; font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.usageSumLabel)
        ),
        E.div(
          {
            class: "usage-report-sum-value",
            style: `flex: 1 0 0; font-size: 1.4rem; color: ${SCHEME.neutral0}; text-align: center;`,
          },
          E.text(`${playtimeMeterReport.totalPlaytime}`)
        )
      ),
      E.divRef(
        seeOtherButtonRef,
        {
          class: "usage-report-see-others-button",
          style: `${TEXT_BUTTON_STYLE} color: ${SCHEME.primary0}; cursor: pointer;`,
        },
        E.text(LOCALIZED_TEXT.usageReportSeeOtherButtonLabel)
      )
    );
    this.seeOtherButton = seeOtherButtonRef.val;

    this.seeOtherButton.addEventListener("click", () =>
      this.emit("chooseReports")
    );
    this.emit("loaded");
  }

  public remove(): void {
    this.body.remove();
  }
}
