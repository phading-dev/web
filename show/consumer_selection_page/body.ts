import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";

export interface ConsumerSelectionPage {
  on(event: "selected", listener: () => void): this;
}

export class ConsumerSelectionPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): ConsumerSelectionPage {
    return new ConsumerSelectionPage();
  }

  public remove(): void {}
}
