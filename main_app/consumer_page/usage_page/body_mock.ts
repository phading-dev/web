import { UsagePage } from "./body";
import { ListMeterReadingsPerDayResponse } from "@phading/meter_service_interface/show/web/consumer/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class UsagePageMock extends UsagePage {
  public constructor(getNowDate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: ListMeterReadingsPerDayResponse = {
            readings: [
              {
                date: "2023-10-01",
                watchTimeSecGraded: 360000000,
              },
              {
                date: "2023-10-10",
                watchTimeSecGraded: 300000000,
              },
            ],
          };
          return response;
        }
      })(),
      getNowDate,
    );
  }
}
