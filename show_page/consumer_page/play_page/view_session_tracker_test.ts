import { ViewSessionTracker } from "./view_session_tracker";
import {
  VIEW_EPISODE,
  VIEW_EPISODE_REQUEST_BODY,
  ViewEpisodeResponse,
} from "@phading/user_activity_service_interface/consumer/frontend/show/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "ViewSessionTrackerTest",
  cases: [
    {
      name: "WatchStart_End_IdleAndStart_End_StartAgain",
      execute: async () => {
        // Prepare
        let dateNow = 12000;
        let requestCaptured: any;
        let returnSessionId = "session1";
        let tracker = new ViewSessionTracker(
          () => dateNow,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<ViewEpisodeResponse> {
              requestCaptured = request;
              return {
                viewSessionId: returnSessionId,
              };
            }
          })(),
          "ep1",
        );

        // Execute
        await tracker.watchStart(1000);

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(VIEW_EPISODE),
          "view episode",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              episodeId: "ep1",
              episodeTimestamp: 1,
            },
            VIEW_EPISODE_REQUEST_BODY,
          ),
          "view episode body",
        );

        // Execute
        await tracker.watchStop(2000);

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              viewSessionId: "session1",
              episodeId: "ep1",
              episodeTimestamp: 2,
            },
            VIEW_EPISODE_REQUEST_BODY,
          ),
          "view episode body 2",
        );

        // Prepare
        dateNow = 3613000;
        returnSessionId = "session2";

        // Execute
        await tracker.watchStart(3000);

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              episodeId: "ep1",
              episodeTimestamp: 3,
            },
            VIEW_EPISODE_REQUEST_BODY,
          ),
          "view episode body 3",
        );

        // Execute
        await tracker.watchStop(4000);

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              viewSessionId: "session2",
              episodeId: "ep1",
              episodeTimestamp: 4,
            },
            VIEW_EPISODE_REQUEST_BODY,
          ),
          "view episode body 4",
        );

        // Prepare
        dateNow = 4321000;
        returnSessionId = "session3";

        // Execute
        await tracker.watchStart(5000);

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              viewSessionId: "session2",
              episodeId: "ep1",
              episodeTimestamp: 5,
            },
            VIEW_EPISODE_REQUEST_BODY,
          ),
          "view episode body 5",
        );
      },
    },
  ],
});
