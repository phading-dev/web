import { WatchTimeMeter } from "./watch_time_meter_2";
import {
  RECORD_WATCH_TIME,
  RECORD_WATCH_TIME_REQUEST_BODY,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "WatchTimeMeterTest",
  cases: [
    new (class implements TestCase {
      public name = "Stop_Start_UpdateTooSoon_UpdateLater_Stop";
      public async execute() {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        let now = 1000;
        let callbackFn: () => void;
        let meter = new WatchTimeMeter(
          {
            addEventListener: () => {},
            setTimeout: (fn: () => void, delay: number) => {
              callbackFn = fn;
            },
            clearTimeout: () => {},
          } as any,
          serviceClientMock,
          () => now,
          "season 1",
          "episode 1",
        ).setPlaybackRate(1);
        let newReading: number;

        // Execute
        meter.stop();
        meter.start();
        now = 3000;
        callbackFn();

        // Verify
        assertThat(serviceClientMock.request, eq(undefined), "RC");
        assertThat(newReading, eq(undefined), "newReading");

        // Prepare
        now = 12000;

        // Execute
        callbackFn();
        newReading = await new Promise<number>((resolve) => {
          meter.once("newReading", resolve);
        });

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
              watchTimeMs: 11000, // 12000 - 3000 + 3000 - 1000
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newReading, eq(11000), "newReading");

        // Prepare
        now = 15000;

        // Execute
        meter.stop();
        newReading = await new Promise<number>((resolve) => {
          meter.once("newReading", resolve);
        });

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 3000, // 15000 - 12000
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body 2",
        );
        assertThat(newReading, eq(14000), "newReading 2");
      }
    })(),
    new (class implements TestCase {
      public name = "SetDoublePlaybackRate_Start_Stop";
      public async execute() {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        let now = 1000;
        let meter = new WatchTimeMeter(
          {
            addEventListener: () => {},
            setTimeout: (fn: () => void, delay: number) => {},
            clearTimeout: () => {},
          } as any,
          serviceClientMock,
          () => now,
          "season 1",
          "episode 1",
        ).setPlaybackRate(2);

        // Execute
        meter.start();
        now = 3000;
        meter.stop();
        let newReading = await new Promise<number>((resolve) => {
          meter.once("newReading", resolve);
        });

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 4000, // (3000 - 1000) * 2
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newReading, eq(4000), "newReading");
      }
    })(),
    new (class implements TestCase {
      public name = "RecordError_CarryOverWatchTime";
      public async execute() {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("fake error");
        let callbackFn: () => void;
        let now = 1000;
        let meter = new WatchTimeMeter(
          {
            addEventListener: () => {},
            setTimeout: (fn: () => void, delay: number) => {
              callbackFn = fn;
            },
            clearTimeout: () => {},
          } as any,
          serviceClientMock,
          () => now,
          "season 1",
          "episode 1",
        ).setPlaybackRate(1);

        // Execute
        meter.start();
        now = 12000;
        callbackFn();

        // Verify
        await new Promise((resolve) => meter.once("stopPlaying", resolve));
        assertThat(
          serviceClientMock.request.descriptor,
          eq(RECORD_WATCH_TIME),
          "RC",
        );

        // Prepare
        now = 23000;
        serviceClientMock.error = undefined;

        // Execute
        callbackFn();
        let newReading = await new Promise<number>((resolve) => {
          meter.once("newReading", resolve);
        });

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season 1",
              episodeId: "episode 1",
              watchTimeMs: 22000, // 23000 - 12000 + 12000 - 1000
            },
            RECORD_WATCH_TIME_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(newReading, eq(22000), "newReading");
      }
    })(),
  ],
});
