import { AddBodiesFn } from "../../common/add_bodies_fn";
import { ConsumerSelectionPage } from "./body";
import { ConsumerCreationPageMock } from "./consumer_creation_page/body_mock";
import { ListOwnedAccountsResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class ConsumerSelectionPageMock extends ConsumerSelectionPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new ConsumerCreationPageMock(),
      undefined,
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return { accounts: [] } as ListOwnedAccountsResponse;
        }
      })(),
      appendBodies
    );
  }
}
