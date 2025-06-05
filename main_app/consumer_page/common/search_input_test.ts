import { SearchInput } from "./search_input";
import { SearchTarget } from "@phading/web_interface/main/consumer/page";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

class SearchInputTestCase implements TestCase {
  public constructor(
    public name: string,
    private initSearchTarget: SearchTarget,
    private initQuery: string,
    private action: (cut: SearchInput) => void,
    private expectedSearchTarget: SearchTarget,
    private expectedQuery: string,
  ) {}
  public async execute() {
    // Prepare
    let cut = new SearchInput(this.initSearchTarget, this.initQuery);
    let searchTarget: SearchTarget;
    let query: string;
    cut.on("search", (searchTarget_, query_) => {
      searchTarget = searchTarget_;
      query = query_;
    });

    // Execute
    this.action(cut);

    // Verify
    assertThat(searchTarget, eq(this.expectedSearchTarget), "searchTarget");
    assertThat(query, eq(this.expectedQuery), "query");
  }
}

TEST_RUNNER.run({
  name: "SearchInputTest",
  cases: [
    new SearchInputTestCase(
      "Season_ValueAndEnter",
      SearchTarget.SEASON,
      "",
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchInput.val.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter" }),
        );
      },
      SearchTarget.SEASON,
      "some query",
    ),
    new SearchInputTestCase(
      "Publisher_ClickButton",
      SearchTarget.PUBLISHER,
      "",
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchActionButton.val.click();
      },
      SearchTarget.PUBLISHER,
      "some query",
    ),
    new SearchInputTestCase(
      "Publisher_EmptyQuery_ClickButton",
      SearchTarget.PUBLISHER,
      "some query",
      (cut) => {
        cut.searchInput.val.value = "";
        cut.searchActionButton.val.click();
      },
      undefined,
      undefined,
    ),
    new SearchInputTestCase(
      "Publisher_SwitchToSeason",
      SearchTarget.PUBLISHER,
      "some query",
      (cut) => cut.searchOptionSeason.val.click(),
      SearchTarget.SEASON,
      "some query",
    ),
    new SearchInputTestCase(
      "Season_SwitchToPublisher",
      SearchTarget.SEASON,
      "some query",
      (cut) => cut.searchOptionPublisher.val.click(),
      SearchTarget.PUBLISHER,
      "some query",
    ),
    new SearchInputTestCase(
      "Publisher_EmptyQuery_Switch",
      SearchTarget.PUBLISHER,
      "",
      (cut) => cut.searchOptionSeason.val.click(),
      undefined,
      undefined,
    ),
  ],
});
