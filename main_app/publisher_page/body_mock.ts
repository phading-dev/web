import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PublisherPage } from "./body";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPageMock } from "./list_page/body_mock";

export class PublisherPageMock extends PublisherPage {
  public constructor(getNowDate: () => Date, appendBodies: AddBodiesFn) {
    super(
      () => new CreateSeasonPage(undefined),
      undefined,
      () => new ListPageMock(getNowDate),
      undefined,
      undefined,
      undefined,
      appendBodies,
    );
  }
}
