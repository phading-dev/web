import { WatchSessionTracker } from "./watch_session_tracker";
import {
  WATCH_EPISODE,
  WATCH_EPISODE_REQUEST_BODY,
} from "@phading/play_activity_service_interface/show/web/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "WatchSessionTrackerTest",
  cases: [
    {
      name: "WatchStart_UpdateWithoutSyncing_UpdateWithSync",
      execute: async () => {
        // Prepare
        let now = 12000;
        let serviceClientMock = new WebServiceClientMock();
        let tracker = new WatchSessionTracker(
          serviceClientMock,
          () => now,
          "season1",
          "ep1",
        );

        // Execute
        await tracker.start(1000);

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(WATCH_EPISODE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 1000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body start",
        );

        // Prepare
        serviceClientMock.request = undefined;
        now = 14000;

        // Execute
        await tracker.update(2000);

        // Verify
        assertThat(serviceClientMock.request, eq(undefined), "RC body update");

        // Prepare
        now = 23000;

        // Execute
        await tracker.update(3000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 3000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body update 2",
        );
      },
    },
  ],
});
