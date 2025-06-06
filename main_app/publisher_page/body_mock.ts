import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PublisherPage } from "./body";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPageMock } from "./list_page/body_mock";
import { SeasonState } from "@phading/product_service_interface/show/season_state";

export class PublisherPageMock extends PublisherPage {
  public constructor(getNowDate: () => Date, appendBodies: AddBodiesFn) {
    super(
      () => new CreateSeasonPage(undefined),
      () => new ListPageMock(getNowDate, SeasonState.PUBLISHED),
      undefined,
      undefined,
      appendBodies,
    );
  }
}
