import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ConsumerState } from "./state";

export interface ConsumerPage {
  on(event: "toPublish", listener: () => void): this;
}

export class ConsumerPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn
  ): ConsumerPage {
    return new ConsumerPage();
  }

  public updateState(newState?: ConsumerState): void {}

  public remove(): void {}
}
