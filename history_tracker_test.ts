import { BODY_STATE, BodyState } from "./body_state";
import { HistoryTracker } from "./history_tracker";
import { AppType } from "@phading/user_service_interface/app_type";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "HistoryTrackerTest",
  cases: [
    {
      name: "Parse",
      execute: () => {
        // Prepare
        let historyTracker = new HistoryTracker(BODY_STATE, "s", {
          addEventListener: () => {},
          location: { search: "s=%7B%22app%22%3A1%7D" },
        } as any);
        let state: BodyState;
        historyTracker.on("update", (newState) => (state = newState));

        // Execute
        historyTracker.parse();

        // Verify
        assertThat(
          state,
          eqMessage({ app: AppType.Show }, BODY_STATE),
          "parsed state"
        );
      },
    },
    {
      name: "Push",
      execute: () => {
        // Prepare
        let url: string;
        let historyTracker = new HistoryTracker(BODY_STATE, "s", {
          addEventListener: () => {},
          location: { href: "https://test.com/?s=%7B%22app%22%3A1%7D" },
          history: {
            pushState: (_data: any, _title: any, newUrl: string): void => {
              url = newUrl;
            },
          },
        } as any);

        // Execute
        historyTracker.push({ app: AppType.Music });

        // Verify
        assertThat(
          url,
          eq("https://test.com/?s=%7B%22app%22%3A2%7D"),
          "pushed URL"
        );
      },
    },
  ],
});
