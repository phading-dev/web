import { fuzzyMatch } from "./fuzzy_match";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "FuzzyMatchTest",
  cases: [
    {
      name: "EmtpyFallbackToDefault",
      async execute() {
        let selected = fuzzyMatch(
          "",
          ["German", "Hindi (CC)", "English (CC)", "English (US)"],
          "English (US)",
        );
        assertThat(selected, eq("English (US)"), "selected");
      },
    },
    {
      name: "NoMatchAndFallbackToDefault",
      async execute() {
        let selected = fuzzyMatch(
          "Japanese",
          ["German", "Hindi (CC)", "English (CC)", "English (US)"],
          "English (US)",
        );
        assertThat(selected, eq("English (US)"), "selected");
      },
    },
    {
      name: "ShortAndMatchLong",
      async execute() {
        let selected = fuzzyMatch(
          "English",
          ["German", "Hindi (CC)", "English (CC)", "English (US)"],
          "English (US)",
        );
        assertThat(selected, eq("English (CC)"), "selected");
      },
    },
    {
      name: "LongAndMatchShort",
      async execute() {
        let selected = fuzzyMatch(
          "English - US",
          ["German", "Hindi (CC)", "English", "English - UK"],
          "German",
        );
        assertThat(selected, eq("English"), "selected");
      },
    },
    {
      name: "LongAndMatchExactly",
      async execute() {
        let selected = fuzzyMatch(
          "English - US",
          ["German", "Hindi (CC)", "English", "English - US", "English - UK"],
          "German",
        );
        assertThat(selected, eq("English - US"), "selected");
      },
    },
    {
      name: "LongChineseAndMatchShort",
      async execute() {
        let selected = fuzzyMatch(
          "中文（简体）",
          ["German", "Hindi (CC)", "中文", "English - US", "English - UK"],
          "German",
        );
        assertThat(selected, eq("中文"), "selected");
      },
    },
  ],
});
