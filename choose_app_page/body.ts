import EventEmitter = require("events");
import { AppType } from "../app_type";
import { AddBodiesFn } from "../common/add_bodies_fn";

export interface ChooseAppPage {
  on(event: "back", listener: () => void): this;
  on(event: "chosen", listener: (chosenApp: AppType) => void): this;
}

export class ChooseAppPage extends EventEmitter {
  public constructor(currentApp: AppType, appendBodies: AddBodiesFn) {
    super();
  }

  public static create(
    currentApp: AppType,
    appendBodies: AddBodiesFn
  ): ChooseAppPage {
    return new ChooseAppPage(currentApp, appendBodies);
  }

  public remove(): void {}
}
