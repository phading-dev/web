import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { getMonthDifference } from "../../../common/date_helper";
import { BASIC_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FONT_M } from "../../../common/sizes";
import { MAX_MONTH_RANGE } from "@phading/constants/commerce";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface MonthRangeInput {
  on(event: "input", listener: () => void): this;
  on(event: "invalid", listener: () => void): this;
}

export class MonthRangeInput extends EventEmitter {
  public static create(startMonth: string, endMonth: string): MonthRangeInput {
    return new MonthRangeInput(startMonth, endMonth);
  }

  public body: HTMLDivElement;
  public startMonthInput = new Ref<HTMLInputElement>();
  public endMonthInput = new Ref<HTMLInputElement>();

  public constructor(startMonth: string, endMonth: string) {
    super();
    this.body = E.div(
      {
        class: "statements-page-month-inputs",
        style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center; justify-content: flex-end; column-gap: 2rem; row-gap: 1rem;`,
      },
      E.div(
        {
          class: "statements-page-start-month-input-container",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "statements-page-start-month-input-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.rangeStart),
        ),
        E.inputRef(this.startMonthInput, {
          type: "month",
          pattern: "[0-9]{4}-[0-9]{2}",
          class: "statements-page-start-month-input",
          style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
          value: startMonth,
        }),
      ),
      E.div(
        {
          class: "statements-page-end-month-input-container",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "statements-page-end-month-input-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.rangeEnd),
        ),
        E.inputRef(this.endMonthInput, {
          type: "month",
          pattern: "[0-9]{4}-[0-9]{2}",
          class: "statements-page-end-month-input",
          style: `${BASIC_INPUT_STYLE} width: 15rem; border-color: ${SCHEME.neutral1};`,
          value: endMonth,
        }),
      ),
    );
    this.startMonthInput.val.addEventListener("input", () =>
      this.validateInput(),
    );
    this.endMonthInput.val.addEventListener("input", () =>
      this.validateInput(),
    );
  }

  private validateInput(): void {
    let startMonth = this.startMonthInput.val.value;
    let endMonth = this.endMonthInput.val.value;
    let startDate = new Date(startMonth);
    let endDate = new Date(endMonth);
    if (
      isNaN(startDate.valueOf()) ||
      isNaN(endDate.valueOf()) ||
      startDate > endDate ||
      getMonthDifference(startDate, endDate) > MAX_MONTH_RANGE
    ) {
      this.emit("invalid");
      return;
    }
    this.emit("input");
  }

  public getValues(): { startMonth: string; endMonth: string } {
    return {
      startMonth: this.startMonthInput.val.value,
      endMonth: this.endMonthInput.val.value,
    };
  }
}
