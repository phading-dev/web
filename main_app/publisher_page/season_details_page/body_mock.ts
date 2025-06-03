import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { SeasonDetailsPage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";

export class SeasonDetailsPageMock extends SeasonDetailsPage {
  public constructor(
    seasonDetails: SeasonDetails,
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    seasonId: string,
  ) {
    super(
      (seasonId: string) =>
        new InfoPageMock(seasonDetails, getNowDate, seasonId),
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
