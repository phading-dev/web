import { fuzzyMatch } from "./fuzzy_match";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "FuzzyMatchTest",
  cases: [
    {
      name: "Emtpy",
      async execute() {
        let selected = fuzzyMatch("", [
          "German",
          "Hindi (CC)",
          "English (CC)",
          "English (US)",
        ]);
        assertThat(selected, eq(-1), "selected");
      },
    },
    {
      name: "NoMatch",
      async execute() {
        let selected = fuzzyMatch("Japanese", [
          "German",
          "Hindi (CC)",
          "English (CC)",
          "English (US)",
        ]);
        assertThat(selected, eq(-1), "selected");
      },
    },
    {
      name: "ShortAndMatchLong",
      async execute() {
        let selected = fuzzyMatch("English", [
          "German",
          "Hindi (CC)",
          "English (CC)",
          "English (US)",
        ]);
        assertThat(selected, eq(2), "selected");
      },
    },
    {
      name: "LongAndMatchShort",
      async execute() {
        let selected = fuzzyMatch("English - US", [
          "German",
          "Hindi (CC)",
          "English",
          "English - UK",
        ]);
        assertThat(selected, eq(2), "selected");
      },
    },
    {
      name: "LongAndMatchExactly",
      async execute() {
        let selected = fuzzyMatch("English - US", [
          "German",
          "Hindi (CC)",
          "English",
          "English - US",
          "English - UK",
        ]);
        assertThat(selected, eq(3), "selected");
      },
    },
    {
      name: "LongChineseAndMatchShort",
      async execute() {
        let selected = fuzzyMatch("中文（简体）", [
          "German",
          "Hindi (CC)",
          "中文",
          "English - US",
          "English - UK",
        ]);
        assertThat(selected, eq(2), "selected");
      },
    },
  ],
});
