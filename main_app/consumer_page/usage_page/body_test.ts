import "../../../dev/env";
import "../../../common/normalize_body";
import path from "path";
import { setDesktopView, setPhoneView } from "../../../common/view_port";
import { UsagePage } from "./body";
import {
  LIST_METER_READINGS_PER_DAY,
  LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
  LIST_METER_READINGS_PER_MONTH,
  LIST_METER_READINGS_PER_MONTH_REQUEST_BODY,
  LIST_METER_READING_PER_SEASON,
  LIST_METER_READING_PER_SEASON_REQUEST_BODY,
  ListMeterReadingPerSeasonResponse,
  ListMeterReadingsPerDayResponse,
  ListMeterReadingsPerMonthResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  GET_SEASON_NAME,
  GetSeasonNameResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "UsagePageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_Default_ScrollDown_ChangeOneMonthWithEmptyReadings";
      private cut: UsagePage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READING_PER_SEASON:
              case LIST_METER_READINGS_PER_DAY:
              case LIST_METER_READINGS_PER_MONTH:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          readings: [
            {
              date: "2023-12-20",
              watchTimeSecGraded: 3400000,
            },
            {
              date: "2023-12-10",
              watchTimeSecGraded: 360000,
            },
            {
              date: "2023-12-02",
              watchTimeSecGraded: 32320000,
            },
          ],
        } as ListMeterReadingsPerDayResponse;
        this.cut = new UsagePage(
          serviceClientMock,
          () => new Date("2023-12-20T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_DAY),
          "default RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startDate: "2023-12-01",
              endDate: "2023-12-31",
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "default RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_phone_default.png"),
          path.join(__dirname, "/golden/usage_page_phone_default.png"),
          path.join(__dirname, "/usage_page_phone_default_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_phone_scrolled.png"),
          path.join(__dirname, "/golden/usage_page_phone_scrolled.png"),
          path.join(__dirname, "/usage_page_phone_scrolled_diff.png"),
        );

        // Prepare
        window.scrollTo(0, 0);
        serviceClientMock.response = {
          readings: [],
        } as ListMeterReadingsPerDayResponse;

        // Execute
        this.cut.oneMonthInput.val.value = "2020-09";
        this.cut.oneMonthInput.val.dispatchEvent(new Event("input"));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_DAY),
          "One month input RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startDate: "2020-09-01",
              endDate: "2020-09-30",
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "One month input RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_phone_empty.png"),
          path.join(__dirname, "/golden/usage_page_phone_empty.png"),
          path.join(__dirname, "/usage_page_phone_empty_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DesktopView_SwitchToOneDay_ChangeOneDay";
      private cut: UsagePage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case GET_SEASON_NAME:
                if (request.body.seasonId === "season1") {
                  return { name: "Attack on Titan" } as GetSeasonNameResponse;
                } else if (request.body.seasonId === "season2") {
                  return {
                    name: "ReZero - Starting Life in Another World",
                  } as GetSeasonNameResponse;
                } else {
                  throw new Error("Unknown seasonId");
                }
              case LIST_METER_READING_PER_SEASON:
              case LIST_METER_READINGS_PER_DAY:
              case LIST_METER_READINGS_PER_MONTH:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          readings: [],
        } as ListMeterReadingsPerDayResponse;
        this.cut = new UsagePage(
          serviceClientMock,
          () => new Date("2023-12-20T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        serviceClientMock.response = {
          readings: [
            {
              seasonId: "season1",
              watchTimeSec: 3600,
              watchTimeSecGraded: 36000,
            },
            {
              seasonId: "season2",
              watchTimeSec: 7200000,
              watchTimeSecGraded: 172000000,
            },
            {
              seasonId: "550e8400-e29b-41d4-a716-446655440000",
              watchTimeSec: 500000,
              watchTimeSecGraded: 122000000,
            },
          ],
        } as ListMeterReadingPerSeasonResponse;

        // Execute
        this.cut.rangeTypeInput.val.pills[0].click();
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READING_PER_SEASON),
          "Switch to one day RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              date: "2023-12-19",
            },
            LIST_METER_READING_PER_SEASON_REQUEST_BODY,
          ),
          "Switch to one day RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_desktop_one_day_default.png"),
          path.join(
            __dirname,
            "/golden/usage_page_desktop_one_day_default.png",
          ),
          path.join(__dirname, "/usage_page_desktop_one_day_default_diff.png"),
        );

        // Execute
        this.cut.oneDayInput.val.value = "2020-08-31";
        this.cut.oneDayInput.val.dispatchEvent(new Event("input"));
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READING_PER_SEASON),
          "One day input change RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              date: "2020-08-31",
            },
            LIST_METER_READING_PER_SEASON_REQUEST_BODY,
          ),
          "One day input change RC body",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "DesktopView_SwitchToDayRange_InputInvalidStartDate_InputValidEndDate";
      private cut: UsagePage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READING_PER_SEASON:
              case LIST_METER_READINGS_PER_DAY:
              case LIST_METER_READINGS_PER_MONTH:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          readings: [],
        } as ListMeterReadingsPerDayResponse;
        this.cut = new UsagePage(
          serviceClientMock,
          () => new Date("2023-12-20T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        serviceClientMock.response = {
          readings: [
            {
              date: "2023-11-25",
              watchTimeSecGraded: 3400000,
            },
            {
              date: "2023-11-30",
              watchTimeSecGraded: 13130000,
            },
          ],
        } as ListMeterReadingsPerDayResponse;

        // Execute
        this.cut.rangeTypeInput.val.pills[1].click();
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_DAY),
          "Switch to day range RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startDate: "2023-11-20",
              endDate: "2023-12-19",
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "Switch to day range RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_desktop_day_range_default.png"),
          path.join(
            __dirname,
            "/golden/usage_page_desktop_day_range_default.png",
          ),
          path.join(
            __dirname,
            "/usage_page_desktop_day_range_default_diff.png",
          ),
        );

        // Execute
        this.cut.dayRangeInput.val.startRangeInput.val.value = "2024-01-01";
        this.cut.dayRangeInput.val.startRangeInput.val.dispatchEvent(
          new Event("input"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_desktop_day_range_invalid.png"),
          path.join(
            __dirname,
            "/golden/usage_page_desktop_day_range_invalid.png",
          ),
          path.join(
            __dirname,
            "/usage_page_desktop_day_range_invalid_diff.png",
          ),
        );

        // Execute
        this.cut.dayRangeInput.val.endRangeInput.val.value = "2024-02-04";
        this.cut.dayRangeInput.val.endRangeInput.val.dispatchEvent(
          new Event("input"),
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_DAY),
          "Day range input RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startDate: "2024-01-01",
              endDate: "2024-02-04",
            },
            LIST_METER_READINGS_PER_DAY_REQUEST_BODY,
          ),
          "Day range input RC body",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "DesktopView_SwitchToMonthRange_InputInvalidStartMonth_InputValidEndMonth";
      private cut: UsagePage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            switch (request.descriptor) {
              case LIST_METER_READING_PER_SEASON:
              case LIST_METER_READINGS_PER_DAY:
              case LIST_METER_READINGS_PER_MONTH:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          readings: [],
        } as ListMeterReadingsPerDayResponse;
        this.cut = new UsagePage(
          serviceClientMock,
          () => new Date("2023-12-20T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        serviceClientMock.response = {
          readings: [
            {
              month: "2023-11",
              watchTimeSecGraded: 431300000,
            },
            {
              month: "2023-12",
              watchTimeSecGraded: 9800000,
            },
            {
              month: "2023-10",
              watchTimeSecGraded: 34200000,
            },
          ],
        } as ListMeterReadingsPerMonthResponse;

        // Execute
        this.cut.rangeTypeInput.val.pills[3].click();

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_MONTH),
          "Switch to month range RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2023-07",
              endMonth: "2023-12",
            },
            LIST_METER_READINGS_PER_MONTH_REQUEST_BODY,
          ),
          "Switch to month range RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_desktop_month_range_default.png"),
          path.join(
            __dirname,
            "/golden/usage_page_desktop_month_range_default.png",
          ),
          path.join(
            __dirname,
            "/usage_page_desktop_month_range_default_diff.png",
          ),
        );

        // Execute
        this.cut.monthRangeInput.val.startRangeInput.val.value = "2024-01";
        this.cut.monthRangeInput.val.startRangeInput.val.dispatchEvent(
          new Event("input"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/usage_page_desktop_month_range_invalid.png"),
          path.join(
            __dirname,
            "/golden/usage_page_desktop_month_range_invalid.png",
          ),
          path.join(
            __dirname,
            "/usage_page_desktop_month_range_invalid_diff.png",
          ),
        );

        // Execute
        this.cut.monthRangeInput.val.endRangeInput.val.value = "2024-02";
        this.cut.monthRangeInput.val.endRangeInput.val.dispatchEvent(
          new Event("input"),
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_METER_READINGS_PER_MONTH),
          "Month range input RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2024-01",
              endMonth: "2024-02",
            },
            LIST_METER_READINGS_PER_MONTH_REQUEST_BODY,
          ),
          "Month range input RC body",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
