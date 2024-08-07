import path = require("path");
import { UsageReportPage } from "./body";
import {
  Granularity,
  USAGE_REPORT_PAGE_STATE,
  UsageReportPageState,
} from "./state";
import {
  LIST_METER_READINGS_PER_DAY,
  LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
  LIST_METER_READINGS_PER_MONTH,
  LIST_METER_READINGS_PER_MONTH_REQUEST_BODY,
  LIST_METER_READINGS_PER_SEASON,
  LIST_METER_READINGS_PER_SEASON_REQUEST_BODY,
  ListMeterReadingsPerDayResponse,
  ListMeterReadingsPerMonthRequestBody,
  ListMeterReadingsPerSeasonResponse,
} from "@phading/commerce_service_interface/consumer/frontend/show/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";
import "../../../common/normalize_body";

let timestampMs = 1721343532818; // 2024/07/18 PT

TEST_RUNNER.run({
  name: "UsageReportPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_InvalidDate_DateRange_SelectMonthNoReadings_InvalidMonth_MonthRange";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
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
            {
              season: {
                name: "Some some thing thing Some some thing thing Some some thing thing Some some thing thing Some some thing thing",
              },
              watchTimeMs: 102020000,
              charges: {
                integer: 200,
                nano: 0,
              },
            },
          ],
        } as ListMeterReadingsPerSeasonResponse;
        this.cut = new UsageReportPage(() => timestampMs, clientMock);
        let newStateCaptured: UsageReportPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.updateState();
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_SEASON),
          "list per season",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              date: {
                year: 2024,
                month: 7,
                day: 18,
              },
            },
            LIST_METER_READINGS_PER_SEASON_REQUEST_BODY,
          ),
          "list per season body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_default.png"),
          path.join(__dirname, "/golden/usage_report_page_default.png"),
          path.join(__dirname, "/usage_report_page_default_diff.png"),
        );

        // Execute
        this.cut.endDateInput.val.value = "2024-07-17";
        this.cut.endDateInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.DAY,
              dateRange: {
                startDate: "2024-07-18",
                endDate: "2024-07-17",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "invalid end date",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_invalid_date_range.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_invalid_date_range.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_invalid_date_range_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {
          readings: [
            {
              date: {
                year: 2024,
                month: 7,
                day: 15,
              },
              watchTimeMs: 2020000,
              charges: {
                integer: 1,
                nano: 1230000000,
              },
            },
            {
              date: {
                year: 2024,
                month: 7,
                day: 16,
              },
              watchTimeMs: 1020000,
              charges: {
                integer: 1,
                nano: 0,
              },
            },
            {
              date: {
                year: 2024,
                month: 7,
                day: 14,
              },
              watchTimeMs: 1020000,
              charges: {
                integer: 1,
                nano: 0,
              },
            },
          ],
        } as ListMeterReadingsPerDayResponse;

        // Execute
        this.cut.startDateInput.val.value = "2024-07-16";
        this.cut.startDateInput.val.dispatchEvent(new Event("input"));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_DAY),
          "list per day",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              startDate: {
                year: 2024,
                month: 7,
                day: 16,
              },
              endDate: {
                year: 2024,
                month: 7,
                day: 17,
              },
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "list per day body",
        );
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.DAY,
              dateRange: {
                startDate: "2024-07-16",
                endDate: "2024-07-17",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "new state per day",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_per_day.png"),
          path.join(__dirname, "/golden/usage_report_page_per_day.png"),
          path.join(__dirname, "/usage_report_page_per_day_diff.png"),
        );

        // Execute
        this.cut.granularityDropdown.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_select_granularity.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_select_granularity.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_select_granularity_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {
          readings: [],
        } as ListMeterReadingsPerDayResponse;

        // Execute
        this.cut.granularityDropdown.val.dropdownEntries[1].select();
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_DAY),
          "list per day for same month",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              startDate: {
                year: 2024,
                month: 7,
                day: 1,
              },
              endDate: {
                year: 2024,
                month: 7,
                day: 31,
              },
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "list per day for same month body",
        );
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.MONTH,
              monthRange: {
                startMonth: "2024-07",
                endMonth: "2024-07",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "new state default month granularity",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/usage_report_page_select_month_no_readings.png",
          ),
          path.join(
            __dirname,
            "/golden/usage_report_page_select_month_no_readings.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_select_month_no_readings_diff.png",
          ),
        );

        // Execute
        this.cut.startMonthInput.val.value = "2024-08";
        this.cut.startMonthInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.MONTH,
              monthRange: {
                startMonth: "2024-08",
                endMonth: "2024-07",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "invalid start month",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_invalid_month_range.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_invalid_month_range.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_invalid_month_range_diff.png",
          ),
        );

        // Prepare
        clientMock.response = {
          readings: [
            {
              month: {
                year: 2024,
                month: 8,
              },
              watchTimeMs: 2020000,
              charges: {
                integer: 1,
                nano: 1230000000,
              },
            },
            {
              month: {
                year: 2024,
                month: 9,
              },
              watchTimeMs: 1020000,
              charges: {
                integer: 1,
                nano: 0,
              },
            },
            {
              month: {
                year: 2025,
                month: 5,
              },
              watchTimeMs: 1020000,
              charges: {
                integer: 1,
                nano: 0,
              },
            },
          ],
        } as ListMeterReadingsPerMonthRequestBody;

        // Execute
        this.cut.endMonthInput.val.value = "2025-12";
        this.cut.endMonthInput.val.dispatchEvent(new Event("input"));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_MONTH),
          "list per month",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              startMonth: {
                year: 2024,
                month: 8,
              },
              endMonth: {
                year: 2025,
                month: 12,
              },
            },
            LIST_METER_READINGS_PER_MONTH_REQUEST_BODY,
          ),
          "list per month body",
        );
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.MONTH,
              monthRange: {
                startMonth: "2024-08",
                endMonth: "2025-12",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "new state per month",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_per_month.png"),
          path.join(__dirname, "/golden/usage_report_page_per_month.png"),
          path.join(__dirname, "/usage_report_page_per_month_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "UpdateStateWithEmptyDateRange_MalformedEndDate_MalformedStartDate";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          readings: [
            {
              season: {
                name: "Titanic",
              },
              watchTimeMs: 2020000,
              charges: {
                integer: 1,
                nano: 1230000000,
              },
            },
          ],
        } as ListMeterReadingsPerSeasonResponse;
        this.cut = new UsageReportPage(() => timestampMs, clientMock);
        let newStateCaptured: UsageReportPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.updateState({
          granularity: Granularity.DAY,
        });
        document.body.append(this.cut.body);

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_SEASON),
          "list per season for same day",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              date: {
                year: 2024,
                month: 7,
                day: 18,
              },
            },
            LIST_METER_READINGS_PER_SEASON_REQUEST_BODY,
          ),
          "list per season for same day body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_empty_date_range.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_empty_date_range.png",
          ),
          path.join(__dirname, "/usage_report_page_empty_date_range_diff.png"),
        );

        // Execute
        this.cut.endDateInput.val.value = "2024";
        this.cut.endDateInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.DAY,
              dateRange: {
                startDate: "2024-07-18",
                endDate: "",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "empty end date",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_malformed_end_date.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_malformed_end_date.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_malformed_end_date_diff.png",
          ),
        );

        // Execute
        this.cut.startDateInput.val.value = "2024";
        this.cut.startDateInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.DAY,
              dateRange: {
                startDate: "2024-07-18",
                endDate: "2024-07-18",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "back to default",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_malformed_start_date.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_empty_date_range.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_malformed_start_date_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "UpdateStateWithEmptyMonthRange_MalformedEndMonth_MalformedStartMonth";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
          readings: [
            {
              date: {
                year: 2024,
                month: 7,
                day: 1,
              },
              watchTimeMs: 2020000,
              charges: {
                integer: 1,
                nano: 1230000000,
              },
            },
          ],
        } as ListMeterReadingsPerDayResponse;
        this.cut = new UsageReportPage(() => timestampMs, clientMock);
        let newStateCaptured: UsageReportPageState;
        this.cut.on("newState", (newState) => (newStateCaptured = newState));

        // Execute
        this.cut.updateState({
          granularity: Granularity.MONTH,
        });
        document.body.append(this.cut.body);

        // Verify
        assertThat(
          clientMock.request,
          eqService(LIST_METER_READINGS_PER_DAY),
          "list per day for same month",
        );
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              startDate: {
                year: 2024,
                month: 7,
                day: 1,
              },
              endDate: {
                year: 2024,
                month: 7,
                day: 31,
              },
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "list per day for same month body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_empty_month_range.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_empty_month_range.png",
          ),
          path.join(__dirname, "/usage_report_page_empty_month_range_diff.png"),
        );

        // Execute
        this.cut.endMonthInput.val.value = "2024";
        this.cut.endMonthInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.MONTH,
              monthRange: {
                startMonth: "2024-07",
                endMonth: "",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "empty end month",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_malformed_end_month.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_malformed_end_month.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_malformed_end_month_diff.png",
          ),
        );

        // Execute
        this.cut.startMonthInput.val.value = "2024";
        this.cut.startMonthInput.val.dispatchEvent(new Event("input"));

        // Verify
        assertThat(
          newStateCaptured,
          eqMessage(
            {
              granularity: Granularity.MONTH,
              monthRange: {
                startMonth: "2024-07",
                endMonth: "2024-07",
              },
            },
            USAGE_REPORT_PAGE_STATE,
          ),
          "back to default",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_malformed_start_month.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_empty_month_range.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_malformed_start_month_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DedupDateRangeUpdate";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let counter = 0;
        let clientMock = new (class extends WebServiceClientMock {
          public async send(
            request: any,
          ): Promise<ListMeterReadingsPerSeasonResponse> {
            counter++;
            return {
              readings: [],
            };
          }
        })();
        this.cut = new UsageReportPage(() => timestampMs, clientMock);
        document.body.append(this.cut.body);
        this.cut.updateState();
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        this.cut.updateState({
          granularity: Granularity.DAY,
          dateRange: {
            startDate: "2024-07-18",
            endDate: "2024-07-18",
          },
        });

        // Verify
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        assertThat(counter, eq(1), "no duplicate updates");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DedupMonthRangeUpdate";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let counter = 0;
        let clientMock = new (class extends WebServiceClientMock {
          public async send(
            request: any,
          ): Promise<ListMeterReadingsPerDayResponse> {
            counter++;
            return {
              readings: [],
            };
          }
        })();
        this.cut = new UsageReportPage(() => timestampMs, clientMock);
        document.body.append(this.cut.body);
        this.cut.updateState({
          granularity: Granularity.MONTH,
        });
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        this.cut.updateState({
          granularity: Granularity.MONTH,
          dateRange: {
            startDate: "2024-07",
            endDate: "2024-07",
          },
        });

        // Verify
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        assertThat(counter, eq(1), "no duplicate updates");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Wide";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 600);
        let clientMock = new WebServiceClientMock();
        clientMock.response = {
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
          ],
        } as ListMeterReadingsPerSeasonResponse;
        this.cut = new UsageReportPage(() => timestampMs, clientMock);

        // Execute
        this.cut.updateState();
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_wide.png"),
          path.join(__dirname, "/golden/usage_report_page_wide.png"),
          path.join(__dirname, "/usage_report_page_wide_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ConcurrentQueries";
      private cut: UsageReportPage;
      public async execute() {
        // Prepare
        await setViewport(350, 600);
        let counter = 0;
        let clientMock = new (class extends WebServiceClientMock {
          public async send(
            request: any,
          ): Promise<ListMeterReadingsPerSeasonResponse> {
            counter++;
            switch (counter) {
              case 1:
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
                  ],
                };
              case 2:
                return {
                  readings: [
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
              default:
                throw new Error("unexpected");
            }
          }
        })();
        this.cut = new UsageReportPage(() => timestampMs, clientMock);

        // Execute
        document.body.append(this.cut.body);
        this.cut.updateState({
          granularity: Granularity.DAY,
          dateRange: {
            startDate: "2024-07-18",
            endDate: "2024-07-18",
          },
        });
        this.cut.updateState({
          granularity: Granularity.DAY,
          dateRange: {
            startDate: "2024-07-19",
            endDate: "2024-07-19",
          },
        });
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_report_page_concurrent_queries.png"),
          path.join(
            __dirname,
            "/golden/usage_report_page_concurrent_queries.png",
          ),
          path.join(
            __dirname,
            "/usage_report_page_concurrent_queries_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
