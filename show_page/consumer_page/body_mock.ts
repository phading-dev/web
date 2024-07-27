import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AccountPageMock } from "./account_page/body_mock";
import { ConsumerPage } from "./body";
import { PlayPageMock } from "./play_page/body_mock";
import { RecommendationPageMock } from "./recommendation_page/body_mock";

export class ConsumerPageMock extends ConsumerPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new AccountPageMock(),
      (episodeId) => new PlayPageMock(episodeId, 1),
      (state) => new RecommendationPageMock(state, 8),
      appendBodies,
    );
  }
}
