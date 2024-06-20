import { Meter } from "./meter";
import {
  SYNC_METER_READING,
  SYNC_METER_READING_REQUEST_BODY,
  SyncMeterReadingResponse,
} from "@phading/product_meter_service_interface/consumer/frontend/show/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "Meter",
  cases: [
    new (class implements TestCase {
      public name = "Start_Update_Stop";
      public async execute() {
        // Prepare
        let frameCallbackCaptured: Function;
        let frameIdToReturn = 0;
        let cancelledFrameIdCaptured: number;
        let delayCaptured: number;
        let requestCaptured: any;
        let meter = new Meter(
          {
            requestAnimationFrame: (callback: Function) => {
              frameCallbackCaptured = callback;
              return ++frameIdToReturn;
            },
            cancelAnimationFrame: (id: number) => {
              cancelledFrameIdCaptured = id;
            },
            setTimeout: (callback: Function, delay: number) => {
              delayCaptured = delay;
              callback();
            },
            addEventListener: () => {},
          } as any,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              return {} as SyncMeterReadingResponse;
            }
          })(),
          "season 1",
        );

        // Execute
        meter.watchStart(100);

        // Verify
        assertThat(frameIdToReturn, eq(1), "frame scheduled");

        // Execute
        await frameCallbackCaptured();

        // Verify
        assertThat(requestCaptured, eq(undefined), "no request sent yet");
        assertThat(delayCaptured, eq(10000), "delayed time");
        assertThat(frameIdToReturn, eq(2), "2nd frame scheduled");

        // Execute
        meter.watchUpdate(200);
        await frameCallbackCaptured();

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(SYNC_METER_READING),
          "sync service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              seasonId: "season 1",
              watchTimeMs: 100, // 200 - 100
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body",
        );
        assertThat(frameIdToReturn, eq(3), "3rd frame scheduled");

        // Execute
        meter.watchUpdate(300);
        meter.watchUpdate(500);
        meter.watchUpdate(1000);
        await frameCallbackCaptured();

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              seasonId: "season 1",
              watchTimeMs: 800, // 1000 - 200
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body 2",
        );

        // Execute
        meter.watchUpdate(1500);
        meter.watchStop();

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              seasonId: "season 1",
              watchTimeMs: 500, // 1500 - 1000
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body 3",
        );
        assertThat(cancelledFrameIdCaptured, eq(4), "4th frame cancelled");
      }
    })(),
    new (class implements TestCase {
      public name = "SyncAndStop";
      public async execute() {
        // Prepare
        let frameCallbackCaptured: Function;
        let frameIdToReturn = 0;
        let cancelledFrameIdCaptured: number;
        let timeoutCallbackCaptured: Function;
        let requestCaptured: any;
        let requestCounter = 0;
        let meter = new Meter(
          {
            requestAnimationFrame: (callback: Function) => {
              frameCallbackCaptured = callback;
              return ++frameIdToReturn;
            },
            cancelAnimationFrame: (id: number) => {
              cancelledFrameIdCaptured = id;
            },
            setTimeout: (callback: Function, delay: number) => {
              timeoutCallbackCaptured = callback;
            },
            addEventListener: () => {},
          } as any,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCounter++;
              requestCaptured = request;
              return {} as SyncMeterReadingResponse;
            }
          })(),
          "season 1",
        );
        meter.watchStart(100);
        meter.watchUpdate(200);

        // Execute
        let promise = frameCallbackCaptured();
        meter.watchStop();
        await new Promise<void>((resolve) => setTimeout(resolve));

        // Verify
        assertThat(requestCounter, eq(1), "1 request out");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              seasonId: "season 1",
              watchTimeMs: 100, // 200 - 100
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body",
        );
        assertThat(cancelledFrameIdCaptured, eq(1), "1st frame cancelled");

        // Execute
        timeoutCallbackCaptured();
        await promise;

        // Verify
        assertThat(frameIdToReturn, eq(1), "no more frame scheduled");
      }
    })(),
    new (class implements TestCase {
      public name = "SyncAndRestart";
      public async execute() {
        // Prepare
        let frameCallbackCaptured: Function;
        let frameIdToReturn = 0;
        let cancelledFrameIdCaptured: number;
        let timeoutCallbackCaptured: Function;
        let requestCounter = 0;
        let meter = new Meter(
          {
            requestAnimationFrame: (callback: Function) => {
              frameCallbackCaptured = callback;
              return ++frameIdToReturn;
            },
            cancelAnimationFrame: (id: number) => {
              cancelledFrameIdCaptured = id;
            },
            setTimeout: (callback: Function, delay: number) => {
              timeoutCallbackCaptured = callback;
            },
            addEventListener: () => {},
          } as any,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCounter++;
              return {} as SyncMeterReadingResponse;
            }
          })(),
          "season 1",
        );
        meter.watchStart(100);
        meter.watchUpdate(200);

        // Execute
        let promise = frameCallbackCaptured();
        meter.watchStart(500);
        await new Promise<void>((resolve) => setTimeout(resolve));

        // Verify
        assertThat(requestCounter, eq(1), "1 request out");
        assertThat(cancelledFrameIdCaptured, eq(1), "1st frame cancelled");
        assertThat(frameIdToReturn, eq(2), "2nd frame scheduled");

        // Execute
        timeoutCallbackCaptured();
        await promise;

        // Verify
        assertThat(frameIdToReturn, eq(2), "no more frame scheduled");
      }
    })(),
    new (class implements TestCase {
      public name = "SyncError_CarryOverWatchTime";
      public async execute() {
        // Prepare
        let frameCallbackCaptured: Function;
        let frameIdToReturn = 0;
        let requestCaptured: any;
        let syncError: Error;
        let meter = new Meter(
          {
            requestAnimationFrame: (callback: Function) => {
              frameCallbackCaptured = callback;
              return ++frameIdToReturn;
            },
            cancelAnimationFrame: (id: number) => {
            },
            setTimeout: (callback: Function, delay: number) => {
              callback();
            },
            addEventListener: () => {},
          } as any,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              if (syncError) {
                throw syncError;
              } else {
                return {} as SyncMeterReadingResponse;
              }
            }
          })(),
          "season 1",
        );
        meter.watchStart(100);
        meter.watchUpdate(200);

        let stopped = false;
        meter.on("stop", () => (stopped = true));
        syncError = new Error("fake error");

        // Execute
        await frameCallbackCaptured();

        // Verify
        assertThat(stopped, eq(true), "stop event");
        assertThat(frameIdToReturn, eq(2), "2nd frame scheduled");

        // Prepare
        meter.watchUpdate(300);
        syncError = undefined;

        // Execue
        await frameCallbackCaptured();

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              seasonId: "season 1",
              watchTimeMs: 200, // 300 - 100
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body",
        );
      }
    })(),
  ],
});
