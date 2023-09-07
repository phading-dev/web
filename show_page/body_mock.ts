import { AddBodiesFn } from "../common/add_bodies_fn";
import { ShowPage } from "./body";
import { ConsumerPageMock } from "./consumer_page/body_mock";
import { PublisherPageMock } from "./publisher_page/body_mock";
import { AppVariant } from "@phading/user_service_interface/app_variant";
import { GetAppVariantResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class ShowPageMock extends ShowPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super(
      (appendBodies, prependMenuBodies, appendMenuBodies) =>
        new ConsumerPageMock(appendBodies, prependMenuBodies, appendMenuBodies),
      (appendBodies, prependMenuBodies, appendMenuBodies) =>
        new PublisherPageMock(
          appendBodies,
          prependMenuBodies,
          appendMenuBodies
        ),
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return { appVariant: AppVariant.Consumer } as GetAppVariantResponse;
        }
      })(),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }
}
