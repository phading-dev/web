import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { EpisodeDetailsPage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";

export class EpisodeDetailsPageMock extends EpisodeDetailsPage {
  public constructor(
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    seasonId: string,
    episodeId: string,
  ) {
    super(
      undefined,
      (seasonId, episodeId) =>
        new InfoPageMock(getNowDate, seasonId, episodeId),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      appendBodies,
      seasonId,
      episodeId,
    );
  }
}
