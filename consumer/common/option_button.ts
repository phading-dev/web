import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";

export interface OptionButton {
  on(event: "select", listener: () => void): this;
}

export class OptionButton extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(
    private selected_: boolean,
    style: string,
    ...childNodes: Array<Node>
  ) {
    super();
    this.body = E.div(
      {
        class: "option-button",
        style: style,
      },
      ...childNodes
    );
    if (this.selected_) {
      this.highlight();
    } else {
      this.lowlight();
    }

    this.body.addEventListener("click", () => this.select());
  }

  public static create(
    selected: boolean,
    style: string,
    ...childNodes: Array<Node>
  ) {
    return new OptionButton(selected, style, ...childNodes);
  }

  private lowlight(): void {
    this.body.style.color = SCHEME.neutral0;
    this.body.style.borderColor = SCHEME.neutral2;
  }

  private highlight(): void {
    this.body.style.color = SCHEME.primary0;
    this.body.style.borderColor = SCHEME.primary1;
  }

  public select(): void {
    this.selected_ = true;
    this.highlight();
    this.emit("select");
  }

  public unselect(): void {
    this.selected_ = false;
    this.lowlight();
  }

  public selected() {
    return this.selected_;
  }
}
