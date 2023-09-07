import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ConsumerPage } from "./body";

export class ConsumerPageMock extends ConsumerPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super(appendBodies, prependMenuBodies, appendMenuBodies);
  }
}
