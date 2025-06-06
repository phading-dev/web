import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ConsumerPage } from "./body";
import { ListRecentPremieresPageMock } from "./list_recent_premieres_page/body_mock";
import { MultiSectionPageMock } from "./multi_section_page/body_mock";

export class ConsumerPageMock extends ConsumerPage {
  public constructor(getNowDate: () => Date, appendBodies: AddBodiesFn) {
    super(
      undefined,
      () => new ListRecentPremieresPageMock(getNowDate),
      undefined,
      () => new MultiSectionPageMock(getNowDate),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      appendBodies,
    );
  }
}
