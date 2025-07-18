import { SearchInput } from "./search_input";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";

class SearchInputListTestCase implements TestCase {
  public constructor(
    public name: string,
    private initQuery: string,
    private initSeasonState: SeasonState,
    private action: (cut: SearchInput) => void,
    private expectedSeasonState?: SeasonState,
  ) {}
  public async execute() {
    // Prepare
    let cut = new SearchInput(this.initQuery, this.initSeasonState);
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
    private initQuery: string,
    private initSeasonState: SeasonState,
    private action: (cut: SearchInput) => void,
    private expectedQuery: string,
    private expectedSeasonState?: SeasonState,
  ) {}
  public async execute() {
    // Prepare
    let cut = new SearchInput(this.initQuery, this.initSeasonState);
    let query: string;
    let seasonState: SeasonState;
    cut.on("search", (query_, seasonState_) => {
      query = query_;
      seasonState = seasonState_;
    });

    // Execute
    this.action(cut);

    // Verify
    assertThat(query, eq(this.expectedQuery), "query");
    assertThat(seasonState, eq(this.expectedSeasonState), "seasonState");
  }
}

TEST_RUNNER.run({
  name: "SearchInputTest",
  cases: [
    new SearchInputSearchTestCase(
      "Archived_ValueAndEnter",
      "",
      SeasonState.ARCHIVED,
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchInput.val.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter" }),
        );
      },
      "some query",
      SeasonState.ARCHIVED,
    ),
    new SearchInputSearchTestCase(
      "Published_ClickButton",
      "",
      SeasonState.PUBLISHED,
      (cut) => {
        cut.searchInput.val.value = "some query";
        cut.searchActionButton.val.click();
      },
      "some query",
      SeasonState.PUBLISHED,
    ),
    new SearchInputListTestCase(
      "Draft_EmptyQuery_ClickButton",
      "some query",
      SeasonState.DRAFT,
      (cut) => {
        cut.searchInput.val.value = "";
        cut.searchActionButton.val.click();
      },
      SeasonState.DRAFT,
    ),
    new SearchInputSearchTestCase(
      "Published_WithQuery_SwitchToDraft",
      "some query",
      SeasonState.PUBLISHED,
      (cut) => cut.searchOptionDraft.val.click(),
      "some query",
      SeasonState.DRAFT,
    ),
    new SearchInputSearchTestCase(
      "Published_WithQuery_SwitchToTakenDown",
      "some query",
      SeasonState.PUBLISHED,
      (cut) => cut.searchOptionTakenDown.val.click(),
      "some query",
      SeasonState.TAKEN_DOWN,
    ),
    new SearchInputSearchTestCase(
      "Published_WithQuery_SwitchToAll",
      "some query",
      SeasonState.PUBLISHED,
      (cut) => cut.searchOptionAll.val.click(),
      "some query",
    ),
    new SearchInputListTestCase(
      "Published_WithoutQuery_SwitchToArchived",
      "",
      SeasonState.PUBLISHED,
      (cut) => cut.searchOptionArchived.val.click(),
      SeasonState.ARCHIVED,
    ),
    new SearchInputListTestCase(
      "Draft_WithoutQuery_SwitchToPublished",
      "",
      SeasonState.DRAFT,
      (cut) => cut.searchOptionPublished.val.click(),
      SeasonState.PUBLISHED,
    ),
    new SearchInputListTestCase(
      "Draft_WithoutQuery_SwitchToTakeDown",
      "",
      SeasonState.DRAFT,
      (cut) => cut.searchOptionTakenDown.val.click(),
      SeasonState.TAKEN_DOWN,
    ),
    new SearchInputListTestCase(
      "Draft_WithoutQuery_SwitchToAll",
      "",
      SeasonState.DRAFT,
      (cut) => cut.searchOptionAll.val.click(),
    ),
  ],
});
