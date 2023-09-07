import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ConsumerPageState } from "./state";

export interface ConsumerPage {
  on(event: "toPublish", listener: () => void): this;
  on(event: "newState", listener: (newState: ConsumerPageState) => void): this;
}

export class ConsumerPage extends EventEmitter {
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
  ): ConsumerPage {
    return new ConsumerPage(appendBodies, prependMenuBodies, appendMenuBodies);
  }

  public updateState(newState?: ConsumerPageState): void {}

  public remove(): void {}
}
