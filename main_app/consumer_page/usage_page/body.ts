import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { formatMoney } from "../../../common/formatter/price";
import { formatWatchTimeSeconds } from "../../../common/formatter/quantity";
import { DATE_INPUT_STYLE } from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { OptionPill, RadioOptionPills } from "../../../common/option_pills";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_M, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { MAX_DAY_RANGE, MAX_MONTH_RANGE } from "@phading/constants/meter";
import {
  newListMeterReadingPerSeasonRequest,
  newListMeterReadingsPerDayRequest,
  newListMeterReadingsPerMonthRequest,
} from "@phading/meter_service_interface/show/web/consumer/client";
import { ProductID } from "@phading/price";
import { calculateMoney } from "@phading/price_config/calculator";
import { newGetSeasonNameRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export enum RangeType {
  ONE_DAY = 1,
  DAYS = 2,
  ONE_MONTH = 3,
  MONTHS = 4,
}

export interface UsagePageResult {
  on(event: "loaded", listener: (result: any) => void): this;
}

export class UsagePage extends EventEmitter {
  public static create(): UsagePage {
    return new UsagePage(SERVICE_CLIENT, () => new Date());
  }

  private static INIT_MONTH = 5;
  private static INIT_DAYS = 30;

  public body: HTMLDivElement;
  public rangeTypeInput = new Ref<RadioOptionPills<RangeType>>();
  public dayRangeInput = new Ref<DateRangeInput>();
  public monthRangeInput = new Ref<DateRangeInput>();
  public oneDayInput = new Ref<HTMLInputElement>();
  public oneMonthInput = new Ref<HTMLInputElement>();
  private resultList = new Ref<HTMLDivElement>();
  private loadIndex = 0;

  public constructor(
    public serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    let nowDate = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    );
    this.body = E.div(
      {
        class: "usage-page",
        style: PAGE_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "usage-page-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        E.div(
          {
            class: "usage-page-title",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
          },
          E.text(LOCALIZED_TEXT.usageReportTitle),
        ),
        E.div(
          {
            class: "usage-page-graunularity-pills",
            style: `width: 100%; display: flex; flex-flow: row wrap; justify-content: flex-end; align-items: center; gap: 1rem;`,
          },
          ...assign(
            this.rangeTypeInput,
            RadioOptionPills.create([
              OptionPill.create(
                LOCALIZED_TEXT.usageReportSelectOneDayLabel,
                RangeType.ONE_DAY,
              ),
              OptionPill.create(
                LOCALIZED_TEXT.usageReportSelectDaysLabel,
                RangeType.DAYS,
              ),
              OptionPill.create(
                LOCALIZED_TEXT.usageReportSelectOneMonthLabel,
                RangeType.ONE_MONTH,
              ),
              OptionPill.create(
                LOCALIZED_TEXT.usageReportSelectMonths,
                RangeType.MONTHS,
              ),
            ]),
          ).elements,
        ),
        E.inputRef(this.oneDayInput, {
          class: "usage-page-one-day-input",
          style: `${DATE_INPUT_STYLE} align-self: flex-end;`,
          type: "date",
        }),
        E.inputRef(this.oneMonthInput, {
          class: "usage-page-one-month-input",
          style: `${DATE_INPUT_STYLE} align-self: flex-end;`,
          type: "month",
        }),
        assign(
          this.dayRangeInput,
          DateRangeInput.create(DateType.DAY, MAX_DAY_RANGE, `width: 100%;`),
        ).body,
        assign(
          this.monthRangeInput,
          DateRangeInput.create(
            DateType.MONTH,
            MAX_MONTH_RANGE,
            `width: 100%;`,
          ),
        ).body,
        E.divRef(this.resultList, {
          class: "usage-page-result-list",
          style: `display: flex; flex-flow: column nowrap; gap: 2rem;`,
        }),
      ),
    );
    this.oneDayInput.val.value = nowDate
      .clone()
      .addDays(-1)
      .toLocalDateISOString();
    this.oneMonthInput.val.value = nowDate.toLocalMonthISOString();
    this.dayRangeInput.val.setValues(
      nowDate.clone().addDays(-UsagePage.INIT_DAYS).toLocalDateISOString(),
      nowDate.clone().addDays(-1).toLocalDateISOString(),
    );
    this.monthRangeInput.val.setValues(
      nowDate
        .clone()
        .moveToFirstDayOfMonth()
        .addMonths(-UsagePage.INIT_MONTH)
        .toLocalMonthISOString(),
      nowDate.toLocalMonthISOString(),
    );
    this.rangeTypeInput.val.setValue(RangeType.ONE_MONTH);
    this.setRangeTypeAndLoad(RangeType.ONE_MONTH);

    this.rangeTypeInput.val.on("selected", (value) =>
      this.setRangeTypeAndLoad(value),
    );
    this.oneDayInput.val.addEventListener("input", () => this.loadOneDay());
    this.oneMonthInput.val.addEventListener("input", () => this.loadOneMonth());
    this.dayRangeInput.val.on("input", () => this.loadFromDayRange());
    this.dayRangeInput.val.on("invalid", () => this.showInvalidRange());
    this.monthRangeInput.val.on("input", () => this.loadFromMonthRange());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());
  }

  private setRangeTypeAndLoad(value: RangeType): void {
    this.oneDayInput.val.style.display = "none";
    this.oneMonthInput.val.style.display = "none";
    this.dayRangeInput.val.hide();
    this.monthRangeInput.val.hide();
    switch (value) {
      case RangeType.ONE_DAY:
        this.oneDayInput.val.style.display = "block";
        this.loadOneDay();
        break;
      case RangeType.ONE_MONTH:
        this.oneMonthInput.val.style.display = "block";
        this.loadOneMonth();
        break;
      case RangeType.DAYS:
        this.dayRangeInput.val.show();
        this.loadFromDayRange();
        break;
      case RangeType.MONTHS:
        this.monthRangeInput.val.show();
        this.loadFromMonthRange();
        break;
    }
  }

  private async loadOneDay(): Promise<void> {
    let day = this.oneDayInput.val.value;
    let date = TzDate.fromLocalDateString(day, 0);
    await this.loadReadingsPerSeason(date);
    this.emit("loaded");
  }

  private async loadFromDayRange(): Promise<void> {
    let { startRange, endRange } = this.dayRangeInput.val.getValues();
    await this.loadReadingsPerDay(
      TzDate.fromLocalDateString(startRange, 0),
      TzDate.fromLocalDateString(endRange, 0),
    );
    this.emit("loaded");
  }

  private async loadOneMonth(): Promise<void> {
    let month = this.oneMonthInput.val.value;
    let startDate = TzDate.fromLocalDateString(month, 0);
    let endDate = startDate.clone().moveToLastDayOfMonth();
    await this.loadReadingsPerDay(startDate, endDate);
    this.emit("loaded");
  }

  private async loadFromMonthRange(): Promise<void> {
    let { startRange, endRange } = this.monthRangeInput.val.getValues();
    await this.loadReadingsPerMonth(
      TzDate.fromLocalDateString(startRange, 0),
      TzDate.fromLocalDateString(endRange, 0),
    );
    this.emit("loaded");
  }

  private async loadReadingsPerSeason(date: TzDate): Promise<void> {
    this.loadIndex++;
    let currentLoadIndex = this.loadIndex;
    while (this.resultList.val.lastElementChild) {
      this.resultList.val.lastElementChild.remove();
    }

    let response = await this.serviceClient.send(
      newListMeterReadingPerSeasonRequest({
        date: date.toLocalDateISOString(),
      }),
    );
    response.readings.sort(
      (a, b) => b.watchTimeSecGraded - a.watchTimeSecGraded,
    );
    let labels = new Array<string>(response.readings.length);
    await Promise.all(
      response.readings.map(async (reading, i) => {
        try {
          let { name } = await this.serviceClient.send(
            newGetSeasonNameRequest({
              seasonId: reading.seasonId,
            }),
          );
          labels[i] = name;
        } catch (e) {
          console.error(e);
          labels[i] = reading.seasonId;
        }
      }),
    );
    if (currentLoadIndex !== this.loadIndex) {
      // Abort if the load index has changed.
      return;
    }

    response.readings.forEach((reading, i) => {
      this.renderDetailedItem(
        labels[i],
        reading.watchTimeSec,
        reading.watchTimeSecGraded,
        date.toLocalDateISOString(),
      );
    });
  }

  private async loadReadingsPerDay(
    startDate: TzDate,
    endDate: TzDate,
  ): Promise<void> {
    this.loadIndex++;
    let currentLoadIndex = this.loadIndex;
    while (this.resultList.val.lastElementChild) {
      this.resultList.val.lastElementChild.remove();
    }
    let response = await this.serviceClient.send(
      newListMeterReadingsPerDayRequest({
        startDate: startDate.toLocalDateISOString(),
        endDate: endDate.toLocalDateISOString(),
      }),
    );
    if (currentLoadIndex !== this.loadIndex) {
      // Abort if the load index has changed.
      return;
    }
    let dateToWatchTimeGraded = new Map<string, number>();
    response.readings.forEach((reading) => {
      dateToWatchTimeGraded.set(reading.date, reading.watchTimeSecGraded);
    });
    this.renderHistogram(
      dateToWatchTimeGraded,
      startDate.clone(),
      (iDate) => iDate.toLocalDateISOString(),
      (iDate) => iDate.toTimestampMs() <= endDate.toTimestampMs(),
      (iDate) => iDate.addDays(1),
    );
  }

  private async loadReadingsPerMonth(
    startMonth: TzDate,
    endMonth: TzDate,
  ): Promise<void> {
    this.loadIndex++;
    let currentLoadIndex = this.loadIndex;
    while (this.resultList.val.lastElementChild) {
      this.resultList.val.lastElementChild.remove();
    }
    let response = await this.serviceClient.send(
      newListMeterReadingsPerMonthRequest({
        startMonth: startMonth.toLocalMonthISOString(),
        endMonth: endMonth.toLocalMonthISOString(),
      }),
    );
    if (currentLoadIndex !== this.loadIndex) {
      // Abort if the load index has changed.
      return;
    }
    let monthToWatchTimeGraded = new Map<string, number>();
    response.readings.forEach((reading) => {
      monthToWatchTimeGraded.set(reading.month, reading.watchTimeSecGraded);
    });
    this.renderHistogram(
      monthToWatchTimeGraded,
      startMonth.clone(),
      (iMonth) => iMonth.toLocalMonthISOString(),
      (iMonth) => iMonth.toTimestampMs() <= endMonth.toTimestampMs(),
      (iMonth) => iMonth.addMonths(1),
    );
  }

  private renderDetailedItem(
    name: string,
    watchTimeSec: number,
    watchTimeSecGraded: number,
    date: string,
  ): void {
    let { amount, price } = calculateMoney(
      ProductID.SHOW,
      ENV_VARS.defaultCurrency,
      date,
      watchTimeSecGraded,
    );
    this.resultList.val.append(
      E.div(
        {
          class: "usage-page-histogram-item",
          style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
        },
        E.div(
          {
            class: "usage-page-histogram-title",
            style: `flex: 10; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(name),
        ),
        E.div(
          {
            class: "usage-page-histogram-seconds",
            style: `flex: 1 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(formatWatchTimeSeconds(watchTimeSec)),
        ),
        E.div(
          {
            class: "usage-page-histogram-money",
            style: `flex: 1 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(formatMoney(amount, price.currency)),
        ),
      ),
    );
  }

  private renderHistogram(
    labelsToWatchTimeSecGraded: Map<string, number>,
    iDate: TzDate,
    toLabel: (iDate: TzDate) => string,
    condition: (iDate: TzDate) => boolean,
    proceed: (iDate: TzDate) => void,
  ): void {
    let maxWatchTimeGraded = 0;
    labelsToWatchTimeSecGraded.forEach((value) => {
      if (maxWatchTimeGraded < value) {
        maxWatchTimeGraded = value;
      }
    });
    for (; condition(iDate); proceed(iDate)) {
      let label = toLabel(iDate);
      let watchTimeSecGraded = labelsToWatchTimeSecGraded.get(label) ?? 0;
      let percentage =
        maxWatchTimeGraded === 0
          ? 0
          : (watchTimeSecGraded / maxWatchTimeGraded) * 100;
      let { amount, price } = calculateMoney(
        ProductID.SHOW,
        ENV_VARS.defaultCurrency,
        label,
        watchTimeSecGraded,
      );
      this.resultList.val.append(
        E.div(
          {
            class: "usage-page-histogram-item",
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
          },
          E.div(
            {
              class: "usage-page-histogram-label",
              style: `flex: 0 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(label),
          ),
          E.div(
            {
              class: "usage-page-histogram-percentage",
              style: `flex: 1 0 0; height: 2rem; position: relative;`,
            },
            E.div({
              class: "usage-page-histogram-percentage-bar",
              style: `width: ${percentage}%; height: 100%; background-color: ${SCHEME.primary1};`,
            }),
            E.div(
              {
                class: "usage-page-histogram-value",
                style: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
              },
              E.text(formatMoney(amount, price.currency)),
            ),
          ),
        ),
      );
    }
  }

  public showInvalidRange(): void {
    this.loadIndex++;
    while (this.resultList.val.lastElementChild) {
      this.resultList.val.lastElementChild.remove();
    }
    this.resultList.val.append(
      E.div(
        {
          class: "usage-page-invalid-range",
          style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.invaliRange),
      ),
    );
  }

  public remove(): void {
    this.body.remove();
  }
}
