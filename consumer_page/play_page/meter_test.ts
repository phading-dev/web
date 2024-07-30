import { Meter } from "./meter";
import {
  SYNC_METER_READING,
  SYNC_METER_READING_REQUEST_BODY,
} from "@phading/product_meter_service_interface/consumer/frontend/show/interface";
import { BlockingLoopMock } from "@selfage/blocking_loop/blocking_loop_mock";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import {
  eqRequestMessageBody,
  eqService,
} from "@selfage/web_service_client/request_test_matcher";

TEST_RUNNER.run({
  name: "Meter",
  cases: [
    new (class implements TestCase {
      public name = "Start_Update_Stop";
      public async execute() {
        // Prepare
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        let meter = new Meter(
          {
            addEventListener: () => {},
          } as any,
          clientMock,
          (style) => {
            blockingLoopMock = new BlockingLoopMock(style);
            return blockingLoopMock;
          },
          "season 1",
        );

        // Execute
        meter.watchStart(100);
        await blockingLoopMock.execute();

        // Verify
        assertThat(clientMock.request, eq(undefined), "no request sent yet");

        // Execute
        meter.watchUpdate(200);
        await blockingLoopMock.execute();

        // Verify
        assertThat(clientMock.request, eqService(SYNC_METER_READING), "sync");
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              seasonId: "season 1",
              watchTimeMs: 100, // 200 - 100
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body",
        );

        // Execute
        meter.watchUpdate(300);
        meter.watchUpdate(500);
        meter.watchUpdate(1000);
        await blockingLoopMock.execute();

        // Verify
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              seasonId: "season 1",
              watchTimeMs: 800, // 1000 - 200
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body 2",
        );

        // Execute
        meter.watchStop(1500);
        await blockingLoopMock.execute();

        // Verify
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
            {
              seasonId: "season 1",
              watchTimeMs: 500, // 1500 - 1000
            },
            SYNC_METER_READING_REQUEST_BODY,
          ),
          "sync request body 3",
        );
      }
    })(),
    new (class implements TestCase {
      public name = "SyncError_CarryOverWatchTime";
      public async execute() {
        // Prepare
        let clientMock = new WebServiceClientMock();
        let blockingLoopMock: BlockingLoopMock;
        let meter = new Meter(
          {
            addEventListener: () => {},
          } as any,
          clientMock,
          (style) => {
            blockingLoopMock = new BlockingLoopMock(style);
            return blockingLoopMock;
          },
          "season 1",
        );
        meter.watchStart(100);
        meter.watchUpdate(200);

        let stopped = false;
        meter.on("stop", () => (stopped = true));
        clientMock.error = new Error("fake error");

        // Execute
        await blockingLoopMock.execute();

        // Verify
        assertThat(stopped, eq(true), "stop event");

        // Prepare
        meter.watchUpdate(300);
        clientMock.error = undefined;

        // Execue
        await blockingLoopMock.execute();

        // Verify
        assertThat(
          clientMock.request,
          eqRequestMessageBody(
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
