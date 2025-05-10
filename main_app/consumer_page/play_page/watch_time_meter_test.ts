import { WatchTimeMeter } from "./watch_time_meter";
import {
  RECORD_WATCH_TIME,
  RECORD_WATCH_TIME_REQUEST_BODY,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "WatchTimeMeter",
  cases: [
    new (class implements TestCase {
      public name = "Start_Update_Stop";
      public async execute() {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        let now = 1000;
        let meter = new WatchTimeMeter(
          {
            addEventListener: () => {},
          } as any,
          serviceClientMock,
          () => now,
          "season 1",
          "episode 1",
        );
        let newReading: number;
        meter.on("newReading", (reading) => (newReading = reading));

        // Execute
        meter.stop(1000);
        meter.start(100);
        now = 3000;
        await meter.update(200);

        // Verify
        assertThat(serviceClientMock.request, eq(undefined), "RC");
        assertThat(newReading, eq(undefined), "newReading");

        // Prepare
        now = 12000;

        // Execute
        await meter.update(300);

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(RECORD_WATCH_TIME),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 200, // 300 - 200 + 200 - 100
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newReading, eq(200), "newReading");

        // Execute
        await meter.update(400);
        await meter.update(800);
        await meter.stop(1000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 700, // 1000 - 300
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body 2",
        );
        assertThat(newReading, eq(900), "newReading 2");
      }
    })(),
    new (class implements TestCase {
      public name = "RecordError_CarryOverWatchTime";
      public async execute() {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("fake error");
        let now = 1000;
        let meter = new WatchTimeMeter(
          {
            addEventListener: () => {},
          } as any,
          serviceClientMock,
          () => now,
          "season 1",
          "episode 1",
        );
        meter.start(100);

        let stopped = false;
        meter.on("stopPlaying", () => (stopped = true));
        let newReading: number;
        meter.on("newReading", (reading) => (newReading = reading));

        // Execute
        now = 12000;
        await meter.update(200);

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(RECORD_WATCH_TIME),
          "RC",
        );
        assertThat(stopped, eq(true), "stop event");
        assertThat(newReading, eq(undefined), "newReading");

        // Prepare
        now = 23000;
        serviceClientMock.error = undefined;

        // Execute
        await meter.update(300);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 200, // 300 - 100
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newReading, eq(200), "newReading");
      }
    })(),
  ],
});
