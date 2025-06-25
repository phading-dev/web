import { SCHEME } from "../../../common/color_scheme";
import { DateRangeInput, DateType } from "../../../common/date_range_input";
import { ExpandableLineItems } from "../../../common/expandable_line_items";
import {
  calculateEstimatedMoney,
  formatMoney,
} from "../../../common/formatter/price";
import { formatWatchTimeSeconds } from "../../../common/formatter/quantity";
import { DATE_INPUT_STYLE } from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { OptionPill, RadioOptionsGroup } from "../../../common/option_buttons";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../common/page_elements";
import { FONT_M, FONT_S, FONT_WEIGHT_600 } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import { MAX_DAY_RANGE, MAX_MONTH_RANGE } from "@phading/constants/meter";
import {
  newListMeterReadingPerSeasonRequest,
  newListMeterReadingsPerDayRequest,
  newListMeterReadingsPerMonthRequest,
} from "@phading/meter_service_interface/show/web/publisher/client";
import {
  MeterReadingPerDay,
  MeterReadingPerMonth,
} from "@phading/meter_service_interface/show/web/publisher/meter_reading";
import { ProductID } from "@phading/price";
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

export interface StatsPage {
  on(event: "loaded", listener: (result: any) => void): this;
}

export class StatsPage extends EventEmitter {
  public static create(): StatsPage {
    return new StatsPage(SERVICE_CLIENT, () => new Date());
  }

  private static INIT_MONTH = 6;
  private static INIT_DAYS = 30;

  public body: HTMLDivElement;
  public oneDayOption = new Ref<OptionPill<RangeType>>();
  public daysOption = new Ref<OptionPill<RangeType>>();
  public oneMonthOption = new Ref<OptionPill<RangeType>>();
  public monthsOption = new Ref<OptionPill<RangeType>>();
  public dayRangeInput = new Ref<DateRangeInput>();
  public monthRangeInput = new Ref<DateRangeInput>();
  private updateFrequencyNote = new Ref<HTMLDivElement>();
  public oneDayInput = new Ref<HTMLInputElement>();
  public oneMonthInput = new Ref<HTMLInputElement>();
  private resultList = new Ref<HTMLDivElement>();
  private rangeTypeInput: RadioOptionsGroup<RangeType>;
  public lines = new Array<ExpandableLineItems>();
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
    this.body = ePageWithTopDownCard(
      new Ref<HTMLDivElement>(),
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem; display: flex; flex-flow: column nowrap;`,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "stats-page-title",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600}; padding: 0 2rem;`,
        },
        E.text(LOCALIZED_TEXT.statsTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "stats-page-graunularity-pills",
          style: `width: 100%; box-sizing: border-box; padding: 0 2rem; display: flex; flex-flow: row wrap; justify-content: flex-end; align-items: center; gap: 1rem;`,
        },
        E.div(
          {
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
          },
          assign(
            this.oneDayOption,
            new OptionPill(
              LOCALIZED_TEXT.statsSelectOneDayLabel,
              RangeType.ONE_DAY,
            ),
          ).body,
          assign(
            this.daysOption,
            new OptionPill(LOCALIZED_TEXT.statsSelectDaysLabel, RangeType.DAYS),
          ).body,
        ),
        E.div(
          {
            style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
          },
          assign(
            this.oneMonthOption,
            new OptionPill(
              LOCALIZED_TEXT.statsSelectOneMonthLabel,
              RangeType.ONE_MONTH,
            ),
          ).body,
          assign(
            this.monthsOption,
            new OptionPill(LOCALIZED_TEXT.statsSelectMonths, RangeType.MONTHS),
          ).body,
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.inputRef(this.oneDayInput, {
        class: "stats-page-one-day-input",
        style: `${DATE_INPUT_STYLE} align-self: flex-end; margin: 0 2rem;`,
        type: "date",
      }),
      E.inputRef(this.oneMonthInput, {
        class: "stats-page-one-month-input",
        style: `${DATE_INPUT_STYLE} align-self: flex-end; margin: 0 2rem;`,
        type: "month",
      }),
      assign(
        this.dayRangeInput,
        DateRangeInput.create(
          DateType.DAY,
          MAX_DAY_RANGE,
          `width: 100%; box-sizing: border-box; padding: 0 2rem;`,
        ),
      ).body,
      assign(
        this.monthRangeInput,
        DateRangeInput.create(
          DateType.MONTH,
          MAX_MONTH_RANGE,
          `width: 100%; box-sizing: border-box; padding: 0 2rem;`,
        ),
      ).body,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.divRef(this.updateFrequencyNote, {
        class: "usage-update-frequency-note",
        style: `align-self: flex-end; box-sizing: border-box; padding: 0 2rem; font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
      }),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.divRef(this.resultList, {
        class: "stats-page-result-list",
        style: `width: 100%; box-sizing: border-box; padding: 0 2rem; display: flex; flex-flow: column nowrap; gap: 1.5rem;`,
      }),
    );

    this.oneDayInput.val.value = nowDate
      .clone()
      .addDays(-1)
      .toLocalDateISOString();
    this.oneDayInput.val.addEventListener("change", () => this.loadOneDay());

    this.dayRangeInput.val.setValues(
      nowDate.clone().addDays(-StatsPage.INIT_DAYS).toLocalDateISOString(),
      nowDate.clone().addDays(-1).toLocalDateISOString(),
    );
    this.dayRangeInput.val.on("change", () => this.loadFromDayRange());
    this.dayRangeInput.val.on("invalid", () => this.showInvalidRange());

    this.oneMonthInput.val.value = nowDate.toLocalMonthISOString();
    this.oneMonthInput.val.addEventListener("change", () =>
      this.loadOneMonth(),
    );

    this.monthRangeInput.val.setValues(
      nowDate
        .clone()
        .moveToFirstDayOfMonth()
        .addMonths(-StatsPage.INIT_MONTH)
        .toLocalMonthISOString(),
      nowDate
        .clone()
        .moveToFirstDayOfMonth()
        .addMonths(-1)
        .toLocalMonthISOString(),
    );
    this.monthRangeInput.val.on("change", () => this.loadFromMonthRange());
    this.monthRangeInput.val.on("invalid", () => this.showInvalidRange());

    this.rangeTypeInput = new RadioOptionsGroup([
      this.oneDayOption.val,
      this.daysOption.val,
      this.oneMonthOption.val,
      this.monthsOption.val,
    ]);
    this.rangeTypeInput.setValue(RangeType.ONE_MONTH);
    this.setRangeTypeAndLoad(RangeType.ONE_MONTH);
    this.rangeTypeInput.on("select", (value) =>
      this.setRangeTypeAndLoad(value),
    );
  }

  private setRangeTypeAndLoad(value: RangeType): void {
    this.oneDayInput.val.style.display = "none";
    this.oneMonthInput.val.style.display = "none";
    this.dayRangeInput.val.hide();
    this.monthRangeInput.val.hide();
    switch (value) {
      case RangeType.ONE_DAY:
        this.oneDayInput.val.style.display = "block";
        this.updateFrequencyNote.val.textContent =
          LOCALIZED_TEXT.statsUpdateDaily;
        this.loadOneDay();
        break;
      case RangeType.ONE_MONTH:
        this.oneMonthInput.val.style.display = "block";
        this.updateFrequencyNote.val.textContent =
          LOCALIZED_TEXT.statsUpdateMonthly;
        this.loadOneMonth();
        break;
      case RangeType.DAYS:
        this.dayRangeInput.val.show();
        this.updateFrequencyNote.val.textContent =
          LOCALIZED_TEXT.statsUpdateDaily;
        this.loadFromDayRange();
        break;
      case RangeType.MONTHS:
        this.monthRangeInput.val.show();
        this.updateFrequencyNote.val.textContent =
          LOCALIZED_TEXT.statsUpdateMonthly;
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
      this.renderThreeColumns(
        labels[i],
        reading.watchTimeSec,
        reading.watchTimeSecGraded,
        date.toLocalMonthISOString(),
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
    this.lines.length = 0;

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
    let dateToReadings = new Map<string, MeterReadingPerDay>();
    response.readings.forEach((reading) => {
      dateToReadings.set(reading.date, reading);
    });
    for (
      let iDate = startDate.clone();
      iDate.toTimestampMs() <= endDate.toTimestampMs();
      iDate.addDays(1)
    ) {
      this.renderCollapsibleItems(
        iDate.toLocalDateISOString(),
        dateToReadings.get(iDate.toLocalDateISOString())?.watchTimeSecGraded ??
          0,
        (dateToReadings.get(iDate.toLocalDateISOString())?.uploadedKb ?? 0) /
          1024,
        (dateToReadings.get(iDate.toLocalDateISOString())?.storageMbm ?? 0) /
          60,
        iDate.toLocalMonthISOString(),
      );
    }
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
    this.lines.length = 0;

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
    let monthToWatchTimeGraded = new Map<string, MeterReadingPerMonth>();
    response.readings.forEach((reading) => {
      monthToWatchTimeGraded.set(reading.month, reading);
    });
    for (
      let iMonth = startMonth.clone();
      iMonth.toTimestampMs() <= endMonth.toTimestampMs();
      iMonth.addMonths(1)
    ) {
      this.renderCollapsibleItems(
        iMonth.toLocalMonthISOString(),
        monthToWatchTimeGraded.get(iMonth.toLocalMonthISOString())
          ?.watchTimeSecGraded ?? 0,
        monthToWatchTimeGraded.get(iMonth.toLocalMonthISOString())
          ?.uploadedMb ?? 0,
        monthToWatchTimeGraded.get(iMonth.toLocalMonthISOString())
          ?.storageMbh ?? 0,
        iMonth.toLocalMonthISOString(),
      );
    }
  }

  private renderThreeColumns(
    name: string,
    watchTimeSec: number,
    watchTimeSecGraded: number,
    monthStr: string,
  ): void {
    let { amount, price } = calculateEstimatedMoney(
      ProductID.SHOW_CREDIT,
      watchTimeSecGraded,
      monthStr,
    );
    this.resultList.val.append(
      E.div(
        {
          class: "usage-page-three-columns-item",
          style: `display: flex; flex-flow: row nowrap; align-items: flex-start;`,
        },
        E.div(
          {
            class: "usage-page-three-columns-title",
            style: `max-width: 25rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(name),
        ),
        E.div({
          style: `flex: 1 0 auto; width: 1rem;`,
        }),
        E.div(
          {
            class: "usage-page-three-columns-money",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(formatMoney(amount, price.currency)),
        ),
        E.div({
          style: `flex: 1 0 auto; width: 1rem;`,
        }),
        E.div(
          {
            class: "usage-page-three-columns-seconds",
            style: `max-width: 25rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: end;`,
          },
          E.text(formatWatchTimeSeconds(watchTimeSec)),
        ),
      ),
    );
  }

  private renderCollapsibleItems(
    label: string,
    watchTimeSecGraded: number,
    uploadedMb: number,
    storageMbh: number,
    monthStr: string,
  ): void {
    let { amount: showCreditAmount, price: showCreditPrice } =
      calculateEstimatedMoney(
        ProductID.SHOW_CREDIT,
        watchTimeSecGraded,
        monthStr,
      );
    let { amount: uploadAmount, price: uploadPrice } = calculateEstimatedMoney(
      ProductID.UPLOAD,
      uploadedMb,
      monthStr,
    );
    let { amount: storageAmount, price: storagePrice } =
      calculateEstimatedMoney(ProductID.STORAGE, storageMbh, monthStr);
    let line = new ExpandableLineItems({
      totalLabel: label,
      totalAmount: showCreditAmount - uploadAmount - storageAmount,
      totalAmountCurrency: showCreditPrice.currency,
      items: [
        {
          label: ProductID[ProductID.SHOW_CREDIT],
          amount: showCreditAmount,
          currency: showCreditPrice.currency,
          quantity: watchTimeSecGraded,
          unit: showCreditPrice.unit,
        },
        {
          label: ProductID[ProductID.UPLOAD],
          amount: -uploadAmount,
          currency: uploadPrice.currency,
          quantity: uploadedMb,
          unit: uploadPrice.unit,
        },
        {
          label: ProductID[ProductID.STORAGE],
          amount: -storageAmount,
          currency: storagePrice.currency,
          quantity: storageMbh,
          unit: storagePrice.unit,
        },
      ],
    });
    this.lines.push(line);
    this.resultList.val.append(line.body);
  }

  public showInvalidRange(): void {
    this.loadIndex++;
    while (this.resultList.val.lastElementChild) {
      this.resultList.val.lastElementChild.remove();
    }
    this.resultList.val.append(
      E.div(
        {
          class: "stats-page-invalid-range",
          style: `width: 100%; text-align: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.invaliRange),
      ),
    );
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
