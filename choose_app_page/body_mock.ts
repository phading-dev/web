import { AppType } from "../app_type";
import { AddBodiesFn } from "../common/add_bodies_fn";
import { ChooseAppPage } from "./body";

export class ChooseAppPageMock extends ChooseAppPage {
  public constructor(currentApp: AppType, appendBodies: AddBodiesFn) {
    super(currentApp, appendBodies);
  }
}
