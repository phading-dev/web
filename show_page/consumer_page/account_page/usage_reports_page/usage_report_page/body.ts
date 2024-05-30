import EventEmitter = require("events");
import { getAppName } from "../../../../../common/app_name";
import { TEXT_BUTTON_STYLE } from "../../../../../common/button_styles";
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { PRODUCT_METER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { getPlaytimeMeterReport } from "@phading/product_meter_service_interface/consumer/web/client_requests";
import {
  PlaytimeMeterPerApp,
  PlaytimeMeterReport,
} from "@phading/product_meter_service_interface/consumer/web/playtime_meter_report";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { FONT_L, FONT_M } from "../../../../../common/sizes";

export interface UsageReportPage {
  on(event: "loaded", listener: () => void): this;
  on(event: "chooseReport", listener: () => void): this;
}

export class UsageReportPage extends EventEmitter {
  public static create(reportId?: string): UsageReportPage {
    return new UsageReportPage(PRODUCT_METER_SERVICE_CLIENT, reportId);
  }

  private static LABEL_WIDTH = "5rem";

  public body: HTMLDivElement;
  // Visible for testing
  public seeOtherButton: HTMLDivElement;
  private card: HTMLDivElement;

  public constructor(
    private webServiceClient: WebServiceClient,
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
        style: `${MEDIUM_CARD_STYLE}; display: flex; flex-flow: column nowrap; gap: 2rem;`,
      })
    );
    this.card = cardRef.val;

    this.load();
  }

  private async load(): Promise<void> {
    let playtimeMeterReport = (
      await getPlaytimeMeterReport(this.webServiceClient, {
        reportId: this.reportId,
      })
    ).playtimeMeterReport;

    let seeOtherButtonRef = new Ref<HTMLDivElement>();
    this.card.append(
      E.div(
        {
          class: "usage-report-title",
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(UsageReportPage.createTitle(playtimeMeterReport))
      ),
      ...UsageReportPage.createUsageRows(
        playtimeMeterReport.playtimeMetersPerApp
      ),
      E.div(
        {
          class: "usage-report-sum",
          style: `width: 85%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
        },
        E.div(
          {
            class: "usage-report-sum-label",
            style: `flex: 0 0 ${UsageReportPage.LABEL_WIDTH}; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.usageSumLabel)
        ),
        E.div(
          {
            class: "usage-report-sum-value",
            style: `flex: 1 1 0; min-width: 0; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
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
      this.emit("chooseReport")
    );
    this.emit("loaded");
  }

  private static createTitle(playtimeMeterReport: PlaytimeMeterReport): string {
    let startDate = new Date(
      playtimeMeterReport.startTimestamp * 1000
    ).toLocaleDateString();
    let title = `${LOCALIZED_TEXT.usageReportRangePartOne}${startDate}`;
    if (playtimeMeterReport.endTimestamp) {
      let endDate = new Date(
        playtimeMeterReport.endTimestamp * 1000
      ).toLocaleDateString();
      title = `${title}${LOCALIZED_TEXT.usageReportRangePartTwo}${endDate}`;
    }
    return title;
  }

  private static createUsageRows(
    playtimeMetersPerApp: Array<PlaytimeMeterPerApp>
  ): Array<HTMLDivElement> {
    let rows = new Array<HTMLDivElement>();
    let mostPlaytimePerApp = 0;
    for (let playtimeMeterPerApp of playtimeMetersPerApp) {
      if (mostPlaytimePerApp < playtimeMeterPerApp.playtime) {
        mostPlaytimePerApp = playtimeMeterPerApp.playtime;
      }
    }
    for (let playtimeMeterPerApp of playtimeMetersPerApp) {
      let percentOfMostPlaytime =
        mostPlaytimePerApp > 0
          ? Math.ceil((playtimeMeterPerApp.playtime / mostPlaytimePerApp) * 100)
          : 0;
      rows.push(
        E.div(
          {
            class: "usage-report-row",
            style: `width: 85%; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          E.div(
            {
              class: "usage-report-app-name",
              style: `flex: 0 0 ${UsageReportPage.LABEL_WIDTH}; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(getAppName(playtimeMeterPerApp.appType))
          ),
          E.div(
            {
              class: "usage-report-usage-bar-wrapper",
              style: `flex: 1 1 0; min-width: 0; height: 2rem; position: relative;`,
            },
            E.div({
              class: "usage-report-usage-bar",
              style: `position: absolute; left: 0; top: 0; width: ${percentOfMostPlaytime}%; height: 100%; background-color: ${SCHEME.primary1};`,
            }),
            E.div(
              {
                class: "usage-report-usage-value",
                style: `position: relative; font-size: ${FONT_M}rem; width: ${percentOfMostPlaytime}%; line-height: 2rem; text-align: center; color: ${SCHEME.neutral0};`,
              },
              E.text(`${playtimeMeterPerApp.playtime}`)
            )
          )
        )
      );
    }
    return rows;
  }

  public remove(): void {
    this.body.remove();
  }
}
