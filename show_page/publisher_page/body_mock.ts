import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PublisherPage } from "./body";

export class PublisherPageMock extends PublisherPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super(appendBodies, prependMenuBodies, appendMenuBodies);
  }
}
