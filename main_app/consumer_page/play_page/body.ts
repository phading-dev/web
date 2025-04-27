import { E } from "@selfage/element/factory";
import { EventEmitter } from "events";
import { SCHEME } from "../../../common/color_scheme";

export class PlayPage extends EventEmitter {
  public static create(): PlayPage {
    return new PlayPage();
  }

  public body: HTMLElement;

  public constructor() {
    super();
    this.body = E.div({
      style: `width: 100%; height: 100%; background-color: ${SCHEME.neutral2};`,
    });
  }

  public remove(): void {
    this.body.remove();
  }
}
