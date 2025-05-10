import { WatchSessionTracker } from "./watch_session_tracker";
import {
  WATCH_EPISODE,
  WATCH_EPISODE_REQUEST_BODY,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "WatchSessionTrackerTest",
  cases: [
    {
      name: "WatchStart_UpdateWithSync_UpdateWithoutSyncing_End_IdleAndRestart_End_StartSoon",
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
        serviceClientMock.response = {
          watchSessionId: "session1",
        } as WatchEpisodeResponse;

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
        assertThat(
          serviceClientMock.request,
          eq(undefined),
          "RC body update",
        );

        // Prepare
        now = 23000;

        // Execute
        await tracker.update(3000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              watchSessionId: "session1",
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 3000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body update 2",
        );

        // Prepare
        now = 33000;

        // Execute
        await tracker.stop(4000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              watchSessionId: "session1",
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 4000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body stop",
        );

        // Prepare
        now = 3634000;
        serviceClientMock.response = {
          watchSessionId: "session2",
        } as WatchEpisodeResponse;

        // Execute
        await tracker.start(5000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 5000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body start 2",
        );

        // Prepare
        now = 7640000;

        // Execute
        await tracker.stop(6000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              watchSessionId: "session2",
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 6000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body stop 2",
        );

        // Prepare
        now = 7650000;
        serviceClientMock.response = {
          watchSessionId: "session3",
        } as WatchEpisodeResponse;

        // Execute
        await tracker.start(7000);

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              watchSessionId: "session2",
              seasonId: "season1",
              episodeId: "ep1",
              watchedVideoTimeMs: 7000,
            },
            WATCH_EPISODE_REQUEST_BODY,
          ),
          "RC body start 3",
        );
      },
    },
  ],
});
