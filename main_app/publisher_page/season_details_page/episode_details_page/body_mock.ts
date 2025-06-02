import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { EpisodeDetailsPage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";

export class EpisodeDetailsPageMock extends EpisodeDetailsPage {
  public constructor(
    episode: EpisodeDetails,
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    seasonId: string,
    episodeId: string,
  ) {
    super(
      (seasonId, episodeId) =>
        new InfoPageMock(episode, getNowDate, seasonId, episodeId),
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
