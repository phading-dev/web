import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PublisherState } from "./state";

export interface PublisherPage {
  on(event: "toConsume", listener: () => void): this;
}

export class PublisherPage {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): PublisherPage {
    return new PublisherPage();
  }

  public updateState(newState?: PublisherState): void {}

  public remove(): void {}
}
