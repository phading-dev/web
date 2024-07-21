import { UsageReportPage } from "./body";
import { ListMeterReadingsPerSeasonResponse } from "@phading/commerce_service_interface/consumer/frontend/show/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class UsageReportPageMock extends UsageReportPage {
  public constructor() {
    super(
      () => 1721343532818, // 2024/07/18 PT
      new (class extends WebServiceClientMock {
        public async send(
          request: any,
        ): Promise<ListMeterReadingsPerSeasonResponse> {
          return {
            readings: [
              {
                season: {
                  name: "Men in black",
                },
                watchTimeMs: 2020000,
                charges: {
                  integer: 1,
                  nano: 1230000000,
                },
              },
              {
                season: {
                  name: "Titanic",
                },
                watchTimeMs: 1020000,
                charges: {
                  integer: 1,
                  nano: 0,
                },
              },
            ],
          };
        }
      })(),
    );
  }
}
