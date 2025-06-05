import { StatementsPage } from "./body";
import { ListTransactionStatementsResponse } from "@phading/commerce_service_interface/web/statements/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class StatementsPageMock extends StatementsPage {
  public constructor(getNowdate: () => Date, canEarn: boolean) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: ListTransactionStatementsResponse = {
            statements: [],
          };
          return response;
        }
      })(),
      getNowdate,
      canEarn,
    );
  }
}
