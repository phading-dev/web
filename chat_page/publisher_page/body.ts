import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PublisherPageState } from "./state";

export interface PublisherPage {
  on(event: "toConsume", listener: () => void): this;
  on(event: "newState", listener: (newState: PublisherPageState) => void): this;
}

export class PublisherPage extends EventEmitter {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super();
  }

  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): PublisherPage {
    return new PublisherPage(appendBodies, prependMenuBodies, appendMenuBodies);
  }

  public updateState(newState?: PublisherPageState): void {}

  public remove(): void {}
}
