import { AddBodiesFn } from "../common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { AccountPageMock } from "./account_page/body_mock";
import { AuthPageMock } from "./auth_page/body_mock";
import { MainApp } from "./body";
import { ChooseAccountPageMock } from "./choose_account_page/body_mock";
import { ConsumerPageMock } from "./consumer_page/body_mock";
import { PublisherPageMock } from "./publisher_page/body_mock";
import { CheckCapabilityResponse } from "@phading/user_session_service_interface/web/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class MainAppMock extends MainApp {
  public constructor(getNowDate: () => Date, appendBodies: AddBodiesFn) {
    super(
      {
        setInterval: () => {},
        clearInterval: () => {},
      } as any,
      LOCAL_SESSION_STORAGE,
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          let response: CheckCapabilityResponse = {
            capabilities: {
              canConsume: true,
              canPublish: true,
              canEarn: true,
            },
          };
          return response;
        }
      })(),
      (appendBodies, canEarn) =>
        new AccountPageMock(getNowDate, appendBodies, canEarn),
      (appendBodies, initAccountType) =>
        new AuthPageMock(appendBodies, initAccountType),
      (appendBodies, accountId) =>
        new ChooseAccountPageMock(appendBodies, accountId),
      (appendBodies) => new ConsumerPageMock(getNowDate, appendBodies),
      (appendBodies) => new PublisherPageMock(getNowDate, appendBodies),
      appendBodies,
    );
  }
}
