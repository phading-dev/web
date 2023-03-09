import {
  CONTENT_PAGE_STATE,
  ContentPageState,
  Page,
} from "./content_page/state";
import { HistoryTracker } from "./history_tracker";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "HistoryTrackerTest",
  cases: [
    {
      name: "Parse",
      execute: () => {
        // Prepare
        let historyTracker = new HistoryTracker(CONTENT_PAGE_STATE, "s", {
          addEventListener: () => {},
          location: { search: "s=%7B%22page%22%3A1%7D" },
        } as any);
        let state: ContentPageState;
        historyTracker.on("update", (newState) => (state = newState));

        // Execute
        historyTracker.parse();

        // Verify
        assertThat(
          state,
          eqMessage({ page: Page.Home }, CONTENT_PAGE_STATE),
          "parsed state"
        );
      },
    },
    {
      name: "Push",
      execute: () => {
        // Prepare
        let url: string;
        let historyTracker = new HistoryTracker(CONTENT_PAGE_STATE, "s", {
          addEventListener: () => {},
          location: { href: "https://test.com/?s=%7B%22page%22%3A1%7D" },
          history: {
            pushState: (_data: any, _title: any, newUrl: string): void => {
              url = newUrl;
            },
          },
        } as any);

        // Execute
        historyTracker.push({ page: Page.Account });

        // Verify
        assertThat(
          url,
          eq("https://test.com/?s=%7B%22page%22%3A2%7D"),
          "pushed URL"
        );
      },
    },
  ],
});
