import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { SeasonDetailsPage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";

export class SeasonDetailsPageMock extends SeasonDetailsPage {
  public constructor(
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    seasonId: string,
  ) {
    super(
      (seasonId: string) => new InfoPageMock(getNowDate, seasonId),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      appendBodies,
      seasonId,
    );
  }
}
