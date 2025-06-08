import { RlHistoryTracker } from "./rl_history_tracker";
import { APP_RL, AppRl } from "@phading/web_interface/app";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "RlHistoryTrackerTest",
  cases: [
    {
      name: "Push",
      execute: () => {
        // Prepare
        let url: string;
        let historyTracker = new RlHistoryTracker({
          addEventListener: () => {},
          location: { origin: "https://test.com" },
          history: {
            pushState: (_data: any, _title: any, newUrl: string): void => {
              url = newUrl;
            },
          },
        } as any);

        // Execute
        historyTracker.push({
          main: {
            consumer: {
              home: {},
            },
          },
        });

        // Verify
        assertThat(
          url,
          eq(
            "https://test.com/?e=%7B%221%22%3A%7B%223%22%3A%7B%221%22%3A%7B%7D%7D%7D%7D",
          ),
          "pushed RL",
        );
      },
    },
    {
      name: "Parse",
      execute: () => {
        // Prepare
        let historyTracker = new RlHistoryTracker({
          addEventListener: () => {},
          location: {
            search: "e=%7B%221%22%3A%7B%223%22%3A%7B%221%22%3A%7B%7D%7D%7D%7D",
          },
        } as any);
        let rl: AppRl;
        historyTracker.on("applyRl", (rl_) => (rl = rl_));

        // Execute
        historyTracker.parse();

        // Verify
        assertThat(
          rl,
          eqMessage(
            {
              main: {
                consumer: {
                  home: {},
                },
              },
            },
            APP_RL,
          ),
          "parsed RL",
        );
      },
    },
  ],
});
