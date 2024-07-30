import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PublisherPageState } from "./state";

export interface PublisherPage {
  on(event: "newState", listener: (newState: PublisherPageState) => void): this;
}

export class PublisherPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): PublisherPage {
    return new PublisherPage(appendBodies);
  }

  public constructor(appendBodies: AddBodiesFn) {
    super();
  }

  public updateState(newState?: PublisherPageState): void {}

  public remove(): void {}
}
