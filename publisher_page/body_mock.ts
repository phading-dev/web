import { AddBodiesFn } from "../common/add_bodies_fn";
import { PublisherPage } from "./body";

export class PublisherPageMock extends PublisherPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(appendBodies);
  }
}
