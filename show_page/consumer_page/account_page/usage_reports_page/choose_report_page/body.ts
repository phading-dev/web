import EventEmitter = require("events");
import { TEXT_BUTTON_STYLE } from "../../../../../common/button_styles";
import { SCHEME } from "../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import { LARGE_CARD_STYLE, PAGE_STYLE } from "../../../../../common/page_style";
import { CONSUMER_PRODUCT_INTERACTION_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { listHistoryPlaytimeMeterReports } from "@phading/consumer_product_interaction_service_interface/client_requests";
import { PlaytimeMeterReportRange } from "@phading/consumer_product_interaction_service_interface/playtime_meter_report_range";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ChooseReportPage {
  on(event: "chosen", listener: (reportId?: string) => void): this;
  on(event: "back", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ChooseReportPage extends EventEmitter {
  public static create(): ChooseReportPage {
    return new ChooseReportPage(CONSUMER_PRODUCT_INTERACTION_SERVICE_CLIENT);
  }

  public body: HTMLDivElement;
  public backMenuBody: HTMLDivElement;
  // Visible for testing
  public backMenuItem: MenuItem;
  public currentRangeButton: HTMLDivElement;
  public historyRangeButtons: Array<HTMLDivElement>;
  private card: HTMLDivElement;

  public constructor(
    private consumerProductInteractionServiceClient: WebServiceClient
  ) {
    super();
    let cardRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "choose-report",
        style: PAGE_STYLE,
      },
      E.divRef(cardRef, {
        class: "choose-report-card",
        style: `${LARGE_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
      })
    );
    this.card = cardRef.val;

    this.backMenuItem = createBackMenuItem();
    this.backMenuBody = this.backMenuItem.body;
    this.backMenuItem.on("action", () => this.emit("back"));

    this.load();
  }

  private async load(): Promise<void> {
    let response = await listHistoryPlaytimeMeterReports(
      this.consumerProductInteractionServiceClient,
      {}
    );

    let rangeContainerRef = new Ref<HTMLDivElement>();
    let currentRangeButtonRef = new Ref<HTMLDivElement>();
    let historyRangeButtonsRef = new Ref<Array<HTMLDivElement>>();
    this.card.append(
      E.div(
        {
          class: "choose-report-title",
          style: `font-size: 1.6rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.chooseReportTitle)
      ),
      E.divRef(
        rangeContainerRef,
        {
          class: "choose-report-ranges",
          style: `display: flex; flex-flow: row wrap; gap: 2rem;`,
        },
        E.divRef(
          currentRangeButtonRef,
          {
            class: "choose-report-range-button",
            style: `${TEXT_BUTTON_STYLE} color: ${SCHEME.primary0}; cursor: pointer;`,
          },
          E.text(LOCALIZED_TEXT.chooseReportCurrentButtonLabel)
        ),
        ...assign(
          historyRangeButtonsRef,
          this.createHistoryRangeButtons(response.playtimeMeterReportRanges)
        )
      )
    );
    this.currentRangeButton = currentRangeButtonRef.val;
    this.historyRangeButtons = historyRangeButtonsRef.val;

    this.currentRangeButton.addEventListener("click", () =>
      this.emit("chosen")
    );
    this.emit("loaded");
  }

  private createHistoryRangeButtons(
    playtimeMeterReportRanges: Array<PlaytimeMeterReportRange>
  ): Array<HTMLDivElement> {
    let historyRangeButtons = new Array<HTMLDivElement>();
    for (let range of playtimeMeterReportRanges) {
      let endDate = new Date(range.endTimestamp * 1000).toLocaleDateString();
      let historyRangeButton = E.div(
        {
          class: "choose-report-range-button",
          style: `${TEXT_BUTTON_STYLE} color: ${SCHEME.primary0}; cursor: pointer;`,
        },
        E.text(`${LOCALIZED_TEXT.chooseReportRangeEndedInDateLabel}${endDate}`)
      );
      historyRangeButtons.push(historyRangeButton);
      historyRangeButton.addEventListener("click", () =>
        this.emit("chosen", range.reportId)
      );
    }
    return historyRangeButtons;
  }

  public remove() {
    this.body.remove();
    this.backMenuItem.remove();
  }
}
