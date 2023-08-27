import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";

export interface PublisherSelectionPage {
  on(event: "selected", listener: () => void): this;
}

export class PublisherSelectionPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): PublisherSelectionPage {
    return new PublisherSelectionPage();
  }

  public remove(): void {}
}
