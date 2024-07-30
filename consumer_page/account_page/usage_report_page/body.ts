import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import {
  toISODateString,
  toISODateString2,
  toISOMonthString,
  toISOMonthString2,
} from "../../../common/date_formatter";
import { DropdownList } from "../../../common/dropdown_list";
import { BASIC_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { formatSecondsAsHHMMSS } from "../../../common/timestamp_formatter";
import { COMMERCE_SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  Granularity,
  USAGE_REPORT_PAGE_STATE,
  UsageReportPageState,
} from "./state";
import {
  listMeterReadingsPerDay,
  listMeterReadingsPerMonth,
  listMeterReadingsPerSeason,
} from "@phading/commerce_service_interface/consumer/frontend/show/client_requests";
import { Money } from "@phading/commerce_service_interface/money";
import { E } from "@selfage/element/factory";
import { copyMessage } from "@selfage/message/copier";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UsageReportPage {
  on(
    event: "newState",
    listener: (newState: UsageReportPageState) => void,
  ): this;
  on(event: "loaded", listener: () => void): this;
}

export class UsageReportPage extends EventEmitter {
  public static create(): UsageReportPage {
    return new UsageReportPage(() => Date.now(), COMMERCE_SERVICE_CLIENT);
  }

  private static TIMEZONE_ID = "America/Los_Angeles"; // The same timezone used by backends to cut usage reports between days.
  private static NANO_TO_INTEGER = 1000000000;

  public body: HTMLDivElement;
  public startDateInput = new Ref<HTMLInputElement>();
  public startMonthInput = new Ref<HTMLInputElement>();
  public endDateInput = new Ref<HTMLInputElement>();
  public endMonthInput = new Ref<HTMLInputElement>();
  public granularityDropdown = new Ref<DropdownList<Granularity>>();
  private inputError = new Ref<HTMLDivElement>();
  private readingsContainer = new Ref<HTMLDivElement>();
  private queryIndex = 0;
  private state: UsageReportPageState;

  public constructor(
    private now: () => number,
    private webServiceClient: WebServiceClient,
  ) {
    super();
    this.body = E.div(
      {
        class: "usage-report",
        style: PAGE_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "usage-report-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "usage-report-range-controllers",
            style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; align-items: flex-start;`,
          },
          E.div(
            {
              class: "usage-report-range",
              style: `flex: 1 1 0; min-width: 0; display: flex; flex-flow: row wrap; gap: .5rem 1rem;`,
            },
            E.div(
              {
                class: "usage-report-range-from",
                style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
              },
              E.div(
                {
                  class: "usage-report-range-from-label",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.usageReportRangeFrom),
              ),
              E.inputRef(this.startDateInput, {
                class: "usage-report-start-date-input",
                style: `${BASIC_INPUT_STYLE} width: 10rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                type: "date",
              }),
              E.inputRef(this.startMonthInput, {
                class: "usage-report-start-month-input",
                style: `${BASIC_INPUT_STYLE} width: 10rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                type: "month",
              }),
            ),
            E.div(
              {
                class: "usage-report-range-to",
                style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
              },
              E.div(
                {
                  class: "usage-report-range-to-label",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.usageReportRangeTo),
              ),
              E.inputRef(this.endDateInput, {
                class: "usage-report-end-date-input",
                style: `${BASIC_INPUT_STYLE} width: 10rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                type: "date",
              }),
              E.inputRef(this.endMonthInput, {
                class: "usage-report-end-month-input",
                style: `${BASIC_INPUT_STYLE} width: 10rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                type: "month",
              }),
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; width: 3rem;`,
          }),
          assign(
            this.granularityDropdown,
            DropdownList.create(
              [
                {
                  kind: Granularity.DAY,
                  localizedMsg: LOCALIZED_TEXT.usageReportRangeGranularityAsDay,
                },
                {
                  kind: Granularity.MONTH,
                  localizedMsg:
                    LOCALIZED_TEXT.usageReportRangeGranularityAsMonth,
                },
              ],
              Granularity.DAY,
              `flex: 0 0 auto; width: 7rem;`,
            ),
          ).body,
        ),
        E.div({
          style: `height: .5rem;`,
        }),
        E.divRef(
          this.inputError,
          {
            class: "usage-report-range-error",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1"),
        ),
        E.div({
          style: `height: 1rem;`,
        }),
        E.divRef(this.readingsContainer, {
          class: "usage-report-readings-container",
          style: `display: grid; column-gap: .2rem; row-gap: 1rem;`,
        }),
      ),
    );

    this.granularityDropdown.val.on("select", () =>
      this.updateStateAndBubbleUp((newState) => {
        newState.granularity = this.granularityDropdown.val.selectedKind;
      }),
    );
    this.startDateInput.val.addEventListener("input", () =>
      this.updateStateAndBubbleUp((newState) => {
        newState.dateRange.startDate = this.startDateInput.val.value;
      }),
    );
    this.endDateInput.val.addEventListener("input", () =>
      this.updateStateAndBubbleUp((newState) => {
        newState.dateRange.endDate = this.endDateInput.val.value;
      }),
    );
    this.startMonthInput.val.addEventListener("input", () =>
      this.updateStateAndBubbleUp((newState) => {
        newState.monthRange.startMonth = this.startMonthInput.val.value;
      }),
    );
    this.endMonthInput.val.addEventListener("input", () =>
      this.updateStateAndBubbleUp((newState) => {
        newState.monthRange.endMonth = this.endMonthInput.val.value;
      }),
    );
  }

  private updateStateAndBubbleUp(
    setField: (newState: UsageReportPageState) => void,
  ): void {
    let newState = copyMessage(this.state, USAGE_REPORT_PAGE_STATE);
    setField(newState);
    this.updateState(newState);
    this.emit("newState", this.state);
  }

  public updateState(newState?: UsageReportPageState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.granularity) {
      newState.granularity = Granularity.DAY;
    }
    switch (newState.granularity) {
      case Granularity.DAY:
        newState.monthRange = undefined;
        if (
          !newState.dateRange ||
          (!newState.dateRange.startDate && !newState.dateRange.endDate)
        ) {
          let nowDate = this.getNowDate();
          let dateIsoString = toISODateString(nowDate);
          newState.dateRange = {
            startDate: dateIsoString,
            endDate: dateIsoString,
          };
        }
        if (
          this.state &&
          this.state.granularity === Granularity.DAY &&
          this.state.dateRange.startDate === newState.dateRange.startDate &&
          this.state.dateRange.endDate === newState.dateRange.endDate
        ) {
          return;
        }
        break;
      case Granularity.MONTH:
        newState.dateRange = undefined;
        if (
          !newState.monthRange ||
          (!newState.monthRange.startMonth && !newState.monthRange.endMonth)
        ) {
          let nowDate = this.getNowDate();
          let monthIsoString = toISOMonthString(nowDate);
          newState.monthRange = {
            startMonth: monthIsoString,
            endMonth: monthIsoString,
          };
        }
        if (
          this.state &&
          this.state.granularity === Granularity.MONTH &&
          this.state.monthRange.startMonth === newState.monthRange.startMonth &&
          this.state.monthRange.endMonth === newState.monthRange.endMonth
        ) {
          return;
        }
        break;
      default:
        throw new Error("Unsupported granularity");
    }
    this.state = newState;

    this.inputError.val.style.visibility = "hidden";
    switch (this.state.granularity) {
      case Granularity.DAY: {
        this.granularityDropdown.val.setValue(Granularity.DAY);
        this.startDateInput.val.style.display = "block";
        this.endDateInput.val.style.display = "block";
        this.startMonthInput.val.style.display = "none";
        this.endMonthInput.val.style.display = "none";
        this.startDateInput.val.value = this.state.dateRange.startDate;
        this.endDateInput.val.value = this.state.dateRange.endDate;

        let startDate = this.startDateInput.val.valueAsDate;
        let endDate = this.endDateInput.val.valueAsDate;
        if (!startDate || !endDate) {
          return;
        }

        let startTime = startDate.getTime();
        let endTime = endDate.getTime();
        if (endTime < startTime) {
          this.inputError.val.textContent =
            LOCALIZED_TEXT.usageReportEndDateSmallerThanStartDate;
          this.inputError.val.style.visibility = "visible";
        } else if (endTime === startTime) {
          this.listMeterReadingsPerSeason(startDate);
        } else {
          this.listMeterReadingsPerDay(startDate, endDate);
        }
        break;
      }
      case Granularity.MONTH: {
        this.granularityDropdown.val.setValue(Granularity.MONTH);
        this.startDateInput.val.style.display = "none";
        this.endDateInput.val.style.display = "none";
        this.startMonthInput.val.style.display = "block";
        this.endMonthInput.val.style.display = "block";
        this.startMonthInput.val.value = this.state.monthRange.startMonth;
        this.endMonthInput.val.value = this.state.monthRange.endMonth;

        let startDate = this.startMonthInput.val.valueAsDate;
        let endDate = this.endMonthInput.val.valueAsDate;
        if (!startDate || !endDate) {
          return;
        }

        let startTime = startDate.getTime();
        let endTime = endDate.getTime();
        if (endTime < startTime) {
          this.inputError.val.textContent =
            LOCALIZED_TEXT.usageReportEndDateSmallerThanStartDate;
          this.inputError.val.style.visibility = "visible";
        } else if (endTime === startTime) {
          this.listMeterReadingsPerDay(
            startDate,
            new Date(
              Date.UTC(
                startDate.getUTCFullYear(),
                startDate.getUTCMonth() + 1,
                0,
              ),
            ),
          );
        } else {
          this.listMeterReadingsPerMonth(startDate, endDate);
        }
        break;
      }
    }
  }

  private getNowDate(): Date {
    // Use this hack to convert current timestamp to the specified time zone.
    // now() gets the current timestamp in local time zone. toLocaleString()
    // converts the timestamp to the specified timezone and output a date
    // string but without a timezone in the string. Date() will then parse the
    // date string as UTC. Therefore, we should always use getUTC*() functions.
    return new Date(
      new Date(this.now()).toLocaleString("en-US", {
        timeZone: UsageReportPage.TIMEZONE_ID,
      }),
    );
  }

  private listMeterReadingsPerSeason(date: Date): Promise<void> {
    return this.createMeterReadings(
      "1fr 8rem 5.5rem",
      LOCALIZED_TEXT.usageReportShowTitleColumn,
      (reading) => reading.season.name,
      (reading) => reading.watchTimeMs,
      (reading) => reading.charges,
      async () =>
        (
          await listMeterReadingsPerSeason(this.webServiceClient, {
            date: {
              day: date.getUTCDate(),
              month: date.getUTCMonth() + 1,
              year: date.getUTCFullYear(),
            },
          })
        ).readings,
      (readings) => readings.sort((a, b) => b.watchTimeMs - a.watchTimeMs),
    );
  }

  private async listMeterReadingsPerDay(
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    return this.createMeterReadings(
      "3fr 3fr 2fr",
      LOCALIZED_TEXT.usageReportShowDateColumn,
      (reading) =>
        toISODateString2(
          reading.date.year,
          reading.date.month,
          reading.date.day,
        ),
      (reading) => reading.watchTimeMs,
      (reading) => reading.charges,
      async () =>
        (
          await listMeterReadingsPerDay(this.webServiceClient, {
            startDate: {
              day: startDate.getUTCDate(),
              month: startDate.getUTCMonth() + 1,
              year: startDate.getUTCFullYear(),
            },
            endDate: {
              day: endDate.getUTCDate(),
              month: endDate.getUTCMonth() + 1,
              year: endDate.getUTCFullYear(),
            },
          })
        ).readings,
      (readings) =>
        readings.sort(
          (a, b) =>
            Date.UTC(b.date.year, b.date.month - 1, b.date.day) -
            Date.UTC(a.date.year, a.date.month - 1, a.date.day),
        ),
    );
  }

  private listMeterReadingsPerMonth(
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    return this.createMeterReadings(
      "2fr 3fr 2fr",
      LOCALIZED_TEXT.usageReportShowDateColumn,
      (reading) => toISOMonthString2(reading.month.year, reading.month.month),
      (reading) => reading.watchTimeMs,
      (reading) => reading.charges,
      async () =>
        (
          await listMeterReadingsPerMonth(this.webServiceClient, {
            startMonth: {
              month: startDate.getUTCMonth() + 1,
              year: startDate.getUTCFullYear(),
            },
            endMonth: {
              month: endDate.getUTCMonth() + 1,
              year: endDate.getUTCFullYear(),
            },
          })
        ).readings,
      (readings) =>
        readings.sort(
          (a, b) =>
            Date.UTC(b.month.year, b.month.month - 1) -
            Date.UTC(a.month.year, a.month.month - 1),
        ),
    );
  }

  private async createMeterReadings<T>(
    gridTemplateColumns: string,
    firstColumnName: string,
    getName: (reading: T) => string,
    getWatchTimeMs: (reading: T) => number,
    getCharges: (reading: T) => Money,
    listReadings: () => Promise<Array<T>>,
    sortReadings: (readings: Array<T>) => void,
  ): Promise<void> {
    this.queryIndex++;
    let queryIndex = this.queryIndex;
    while (this.readingsContainer.val.lastChild) {
      this.readingsContainer.val.lastChild.remove();
    }

    let readings = await listReadings();
    if (queryIndex !== this.queryIndex) {
      // If queryIndex changed, then a newer query was executed.
      return;
    }
    sortReadings(readings);
    this.readingsContainer.val.style.gridTemplateColumns = gridTemplateColumns;
    this.readingsContainer.val.append(
      E.div(
        {
          class: "usage-report-name-column",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(firstColumnName),
      ),
      E.div(
        {
          class: "usage-report-watch-time-column",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.usageReportShowWatchTimeColumn),
      ),
      E.div(
        {
          class: "usage-report-charges-column",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.usageReportShowChargesColumn),
      ),
    );
    let totalWatchTimeMs = 0;
    let totalCharges = 0;
    for (let reading of readings) {
      this.readingsContainer.val.append(
        E.div(
          {
            class: "usage-report-name",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(getName(reading)),
        ),
        E.div(
          {
            class: "usage-report-watch-time",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(formatSecondsAsHHMMSS(getWatchTimeMs(reading) / 1000)),
        ),
        E.div(
          {
            class: "usage-report-charges",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `$${(getCharges(reading).integer + getCharges(reading).nano / UsageReportPage.NANO_TO_INTEGER).toFixed(2)}`,
          ),
        ),
      );
      totalWatchTimeMs += getWatchTimeMs(reading);
      totalCharges +=
        getCharges(reading).integer +
        getCharges(reading).nano / UsageReportPage.NANO_TO_INTEGER;
    }
    this.readingsContainer.val.append(
      E.div(
        {
          class: "usage-report-total",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(LOCALIZED_TEXT.usageReportTotal),
      ),
      E.div(
        {
          class: "usage-report-total-watch-time",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(formatSecondsAsHHMMSS(totalWatchTimeMs / 1000)),
      ),
      E.div(
        {
          class: "usage-report-total-charges",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`$${totalCharges.toFixed(2)}`),
      ),
    );
    this.emit("loaded");
  }

  public remove(): void {
    this.body.remove();
  }
}
