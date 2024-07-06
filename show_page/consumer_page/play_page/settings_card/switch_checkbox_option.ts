import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { INPUT_WIDTH, LABEL_STYLE } from "./styles";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface SwitchCheckboxOption {
  on(event: "update", listener: (value: boolean) => void): this;
}

export class SwitchCheckboxOption extends EventEmitter {
  public static create(
    label: string,
    defaultValue: boolean,
    value: boolean,
  ): SwitchCheckboxOption {
    return new SwitchCheckboxOption(label, defaultValue, value);
  }

  private static RADIUS = ".9rem";
  private static SWITCHER_HEIGHT = "1.8rem";
  private static TRANSITION_DURATION = ".2s";

  public body: HTMLDivElement;
  public switchBarWrapper = new Ref<HTMLDivElement>();
  private switchBarLeft = new Ref<HTMLDivElement>();
  private switchBarRight = new Ref<HTMLDivElement>();
  private switchCircle = new Ref<HTMLDivElement>();

  public constructor(
    label: string,
    private defaultValue: boolean,
    private value: boolean,
  ) {
    super();
    this.body = E.div(
      {
        class: "switch-checkbox-option",
        style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
      },
      E.div(
        {
          class: "switch-checkbox-option-label",
          style: LABEL_STYLE,
          title: label,
        },
        E.text(label),
      ),
      E.divRef(
        this.switchBarWrapper,
        {
          class: "switch-checkbox-option-wrapper",
          style: `position: relative; width: ${INPUT_WIDTH}rem; cursor: pointer;`,
        },
        E.divRef(this.switchBarLeft, {
          class: "switch-checkbox-option-bar-left",
          style: `display: inline-block; height: ${SwitchCheckboxOption.SWITCHER_HEIGHT}; border-radius: ${SwitchCheckboxOption.RADIUS} 0 0 ${SwitchCheckboxOption.RADIUS}; background-color: ${SCHEME.neutral2}; transition: width ${SwitchCheckboxOption.TRANSITION_DURATION};`,
        }),
        E.divRef(this.switchBarRight, {
          class: "switch-checkbox-option-bar-right",
          style: `display: inline-block; height: ${SwitchCheckboxOption.SWITCHER_HEIGHT}; border-radius: 0 ${SwitchCheckboxOption.RADIUS} ${SwitchCheckboxOption.RADIUS} 0; background-color: ${SCHEME.primary1}; transition: width ${SwitchCheckboxOption.TRANSITION_DURATION};`,
        }),
        E.divRef(this.switchCircle, {
          class: "switch-checkbox-option-circle",
          style: `position: absolute; height: ${SwitchCheckboxOption.SWITCHER_HEIGHT}; width: ${SwitchCheckboxOption.SWITCHER_HEIGHT}; box-sizing: border-box; top: 0; left: -${SwitchCheckboxOption.RADIUS}; background-color: ${SCHEME.neutral4}; border: .1rem solid ${SCHEME.neutral1}; border-radius: 50%; transition: margin-left ${SwitchCheckboxOption.TRANSITION_DURATION};`,
        }),
      ),
    );
    this.setValue(value);

    this.switchBarWrapper.val.addEventListener("click", () =>
      this.toggleSwitch(),
    );
  }

  private setValue(value: boolean): void {
    this.value = value;
    if (this.value) {
      this.switchBarLeft.val.style.width = SwitchCheckboxOption.RADIUS;
      this.switchBarRight.val.style.width = `calc(100% - ${SwitchCheckboxOption.RADIUS})`;
      this.switchCircle.val.style.marginLeft = SwitchCheckboxOption.RADIUS;
    } else {
      this.switchBarLeft.val.style.width = `calc(100% - ${SwitchCheckboxOption.RADIUS})`;
      this.switchBarRight.val.style.width = SwitchCheckboxOption.RADIUS;
      this.switchCircle.val.style.marginLeft = `calc(100% - ${SwitchCheckboxOption.RADIUS})`;
    }
  }

  private toggleSwitch(): void {
    this.setValue(!this.value);
    this.emit("update", this.value);
  }

  public reset(): boolean {
    this.setValue(this.defaultValue);
    return this.value;
  }
}
