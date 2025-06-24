import { SearchInput } from "./search_input";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

class SearchInputListTestCase implements TestCase {
  public constructor(
    public name: string,
    private initSeasonState: SeasonState,
    private initQuery: string,
    private action: (cut: SearchInput) => void,
    private expectedSeasonState: SeasonState,
  ) {}
  public async execute() {
    // Prepare
    let cut = new SearchInput(this.initSeasonState, this.initQuery);
    let seasonState: SeasonState;
    cut.on("list", (seasonState_) => {
      seasonState = seasonState_;
    });

    // Execute
    this.action(cut);

    // Verify
    assertThat(seasonState, eq(this.expectedSeasonState), "seasonState");
  }
}

class SearchInputSearchTestCase implements TestCase {
  public constructor(
    public name: string,
    private initSeasonState: SeasonState,
    private initQuery: string,
    private action: (cut: SearchInput) => void,
    private expectedSeasonState: SeasonState,
    private expectedQuery: string,
  ) {}
  public async execute() {
    // Prepare
    let cut = new SearchInput(this.initSeasonState, this.initQuery);
    let seasonState: SeasonState;
    let query: string;
    cut.on("search", (seasonState_, query_) => {
      seasonState = seasonState_;
      query = query_;
    });

    // Execute
    this.action(cut);

    // Verify
    assertThat(seasonState, eq(this.expectedSeasonState), "seasonState");
    assertThat(query, eq(this.expectedQuery), "query");
  }
}

TEST_RUNNER.run({
  name: "SearchInputTest",
  cases: [
    new SearchInputSearchTestCase(
      "Archived_ValueAndEnter",
      SeasonState.ARCHIVED,
      "",
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchInput.val.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter" }),
        );
      },
      SeasonState.ARCHIVED,
      "some query",
    ),
    new SearchInputSearchTestCase(
      "Published_ClickButton",
      SeasonState.PUBLISHED,
      "",
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchActionButton.val.click();
      },
      SeasonState.PUBLISHED,
      "some query",
    ),
    new SearchInputListTestCase(
      "Draft_EmptyQuery_ClickButton",
      SeasonState.DRAFT,
      "some query",
      (cut) => {
        cut.searchInput.val.value = "";
        cut.searchActionButton.val.click();
      },
      SeasonState.DRAFT,
    ),
    new SearchInputSearchTestCase(
      "Published_WithQuery_SwitchToDraft",
      SeasonState.PUBLISHED,
      "some query",
      (cut) => cut.searchOptionDraft.val.click(),
      SeasonState.DRAFT,
      "some query",
    ),
    new SearchInputListTestCase(
      "Published_WithoutQuery_SwitchToArchived",
      SeasonState.PUBLISHED,
      "",
      (cut) => cut.searchOptionArchived.val.click(),
      SeasonState.ARCHIVED,
    ),
    new SearchInputListTestCase(
      "Draft_WithoutQuery_SwitchToPublished",
      SeasonState.DRAFT,
      "",
      (cut) => cut.searchOptionPublished.val.click(),
      SeasonState.PUBLISHED,
    ),
  ],
});
