import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { createBoxIcon, createCheckedBoxIcon } from "../icons";
import { FONT_M, GAP_d_5X, ICON_M, LINE_HEIGHT_M } from "../sizes";
import { InputField } from "./input_field";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export class MandatoryCheckboxInput extends EventEmitter implements InputField {
  public body: HTMLDivElement;
  private boxIcon = new Ref<HTMLDivElement>();
  private checkedIcon = new Ref<HTMLDivElement>();
  private checked_ = false;

  public constructor(customStyle: string, label: string) {
    super();
    this.body = E.div(
      {
        class: "checkbox-input",
        style: `width: 100%; display: flex; flex-flow: row nowrap; align-items: flex-start; gap: ${GAP_d_5X}rem; ${customStyle}`,
      },
      E.divRef(
        this.boxIcon,
        {
          class: "checkbox-input-box",
          style: `flex: 0 0 auto; width: ${ICON_M}rem; height: ${ICON_M}rem; padding: ${(LINE_HEIGHT_M - ICON_M) / 2}rem 0;`,
        },
        createBoxIcon(SCHEME.neutral1),
      ),
      E.divRef(
        this.checkedIcon,
        {
          class: "checkbox-input-checked",
          style: `flex: 0 0 auto; width: ${ICON_M}rem; height: ${ICON_M}rem; padding: ${(LINE_HEIGHT_M - ICON_M) / 2}rem 0;`,
        },
        createCheckedBoxIcon(SCHEME.neutral1),
      ),
      E.div(
        {
          class: "checkbox-input-label",
          style: `flex: 1 0 0; min-width: 0; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem;`,
        },
        E.text(label),
      ),
    );
    this.body.addEventListener("click", () => this.toggle());
  }

  private render(): void {
    if (!this.checked_) {
      this.boxIcon.val.style.display = "block";
      this.checkedIcon.val.style.display = "none";
    } else {
      this.boxIcon.val.style.display = "none";
      this.checkedIcon.val.style.display = "block";
    }
  }

  private toggle(): void {
    this.checked_ = !this.checked_;
    this.render();
    this.emit("refresh");
  }

  public enable(): this {
    this.body.style.cursor = "pointer";
    this.body.style.pointerEvents = "auto";
    this.render();
    return this;
  }

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.body.style.pointerEvents = "none";
    return this;
  }

  public set value(checked: boolean) {
    this.checked_ = checked;
  }

  public get isValid() {
    return this.checked_;
  }

  public remove(): void {
    this.body.remove();
  }

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }

  public click(): void {
    this.body.click();
  }
}
