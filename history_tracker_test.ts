import { Page } from "./consumer_page/state";
import { HistoryTracker } from "./history_tracker";
import { ROOT_PAGE_STATE, RootPageState } from "./root_page_state";
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
        let historyTracker = new HistoryTracker(ROOT_PAGE_STATE, "s", {
          addEventListener: () => {},
          location: { search: "s=%7B%22consumer%22%3A%7B%22page%22%3A1%7D%7D" },
        } as any);
        let state: RootPageState;
        historyTracker.on("update", (newState) => (state = newState));

        // Execute
        historyTracker.parse();

        // Verify
        assertThat(
          state,
          eqMessage({ consumer: { page: Page.ACCOUNT } }, ROOT_PAGE_STATE),
          "parsed state",
        );
      },
    },
    {
      name: "Push",
      execute: () => {
        // Prepare
        let url: string;
        let historyTracker = new HistoryTracker(ROOT_PAGE_STATE, "s", {
          addEventListener: () => {},
          location: { href: "https://test.com" },
          history: {
            pushState: (_data: any, _title: any, newUrl: string): void => {
              url = newUrl;
            },
          },
        } as any);

        // Execute
        historyTracker.push({
          consumer: {
            page: Page.ACCOUNT,
          },
        });

        // Verify
        assertThat(
          url,
          eq("https://test.com/?s=%7B%22consumer%22%3A%7B%22page%22%3A1%7D%7D"),
          "pushed URL",
        );
      },
    },
  ],
});
