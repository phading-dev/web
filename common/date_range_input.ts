import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { DATE_INPUT_STYLE } from "./input_styles";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { FONT_M } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";

export enum DateType {
  DAY = 1,
  MONTH = 2,
}

export interface DateRangeInput {
  on(event: "input", listener: () => void): this;
  on(event: "invalid", listener: () => void): this;
}

export class DateRangeInput extends EventEmitter {
  public static create(
    type: DateType,
    maxRange: number,
    customStyle?: string,
  ): DateRangeInput {
    return new DateRangeInput(type, maxRange, customStyle);
  }

  public body: HTMLDivElement;
  public startRangeInput = new Ref<HTMLInputElement>();
  public endRangeInput = new Ref<HTMLInputElement>();
  private differenceFn: (startDate: TzDate, endDate: TzDate) => number;

  public constructor(
    type: DateType,
    private maxRange: number,
    customStyle: string = "",
  ) {
    super();
    let typeString = type === DateType.MONTH ? "month" : "date";
    this.differenceFn =
      type === DateType.MONTH
        ? DateRangeInput.getMonthDifference
        : DateRangeInput.getDayDifference;
    this.body = E.div(
      {
        class: "date-range-inputs",
        style: `flex-flow: row wrap; align-items: center; justify-content: flex-end; column-gap: 2rem; row-gap: 1rem; ${customStyle}`,
      },
      E.div(
        {
          class: "statements-page-start-range-input-container",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "statements-page-start-range-input-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.rangeStart),
        ),
        E.inputRef(this.startRangeInput, {
          class: "statements-page-start-range-input",
          style: `${DATE_INPUT_STYLE}`,
          type: typeString,
        }),
      ),
      E.div(
        {
          class: "statements-page-end-range-input-container",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "statements-page-end-range-input-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.rangeEnd),
        ),
        E.inputRef(this.endRangeInput, {
          class: "statements-page-end-range-input",
          style: `${DATE_INPUT_STYLE}`,
          type: typeString,
        }),
      ),
    );
    this.startRangeInput.val.addEventListener("input", () => this.input());
    this.endRangeInput.val.addEventListener("input", () => this.input());
  }

  private static getDayDifference(startDate: TzDate, endDate: TzDate): number {
    return endDate.minusDateInDays(startDate) + 1;
  }

  private static getMonthDifference(
    startDate: TzDate,
    endDate: TzDate,
  ): number {
    return endDate.minusDateInMonths(startDate) + 1;
  }

  private input(): void {
    if (this.validateInput()) {
      this.emit("input");
    } else {
      this.emit("invalid");
    }
  }

  private validateInput(): boolean {
    let startRange = this.startRangeInput.val.value;
    let endRange = this.endRangeInput.val.value;
    let startDate = TzDate.fromLocalDateString(startRange, 0);
    let endDate = TzDate.fromLocalDateString(endRange, 0);
    if (
      startDate.toTimestampMs() > endDate.toTimestampMs() ||
      this.differenceFn(startDate, endDate) > this.maxRange
    ) {
      return false;
    }
    return true;
  }

  public getValues(): { startRange: string; endRange: string } {
    return {
      startRange: this.startRangeInput.val.value,
      endRange: this.endRangeInput.val.value,
    };
  }

  public setValues(startRange: string, endRange: string): boolean {
    this.startRangeInput.val.value = startRange;
    this.endRangeInput.val.value = endRange;
    return this.validateInput();
  }

  public show(): this {
    this.body.style.display = "flex";
    return this;
  }

  public hide(): this {
    this.body.style.display = "none";
    return this;
  }
}
