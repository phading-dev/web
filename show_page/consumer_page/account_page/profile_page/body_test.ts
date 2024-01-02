import path = require("path");
import { BasicInfoPagMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { E } from "@selfage/element/factory";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

class NavigateForwardAndBack implements TestCase {
  private cut: ProfilePage;
  public constructor(
    public name: string,
    private click: (cut: ProfilePage) => void,
    private emitBack: (cut: ProfilePage) => void,
    private emitUpdated: (cut: ProfilePage) => void,
    private goToPageActualFile: string,
    private goToPageExpectedFile: string,
    private goToPageDiffFile: string,
    private backActualFile: string,
    private backDiffFile: string,
    private updatedActualFile: string,
    private updatedDiffFile: string
  ) {}

  public async execute() {
    // Prepare
    await setViewport(1000, 800);
    this.cut = new ProfilePage(
      () => new BasicInfoPagMock(),
      () => new UpdateAvatarPageMock(),
      (account) => new UpdateAccountInfoPageMock(account),
      (...bodies) => document.body.append(...bodies),
      (...bodies) => menuContainer.append(...bodies)
    );
    await screenshot(path.join(__dirname, "/profile_page_baseline.png"));

    // Execute
    this.click(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.goToPageActualFile,
      this.goToPageExpectedFile,
      this.goToPageDiffFile
    );

    // Execute
    this.emitBack(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.backActualFile,
      path.join(__dirname, "/profile_page_baseline.png"),
      this.backDiffFile
    );

    // Prepare
    this.click(this.cut);

    // Execute
    this.emitUpdated(this.cut);

    // Verify
    await asyncAssertScreenshot(
      this.updatedActualFile,
      path.join(__dirname, "/profile_page_baseline.png"),
      this.updatedDiffFile
    );

    // Clearnup
    await deleteFile(path.join(__dirname, "/profile_page_baseline.png"));
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "ProfilePageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; top: 0; left: 0;`,
      });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ProfilePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new ProfilePage(
          () => new BasicInfoPagMock(),
          () => new UpdateAvatarPageMock(),
          (account) => new UpdateAccountInfoPageMock(account),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_default.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(__dirname, "/profile_page_default_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new NavigateForwardAndBack(
      "GoToUpdateAvatarAndBack",
      (cut) => cut.basicInfoPage.avatarContainer.click(),
      (cut) => cut.updateAvatarPage.emit("back"),
      (cut) => cut.updateAvatarPage.emit("updated"),
      path.join(__dirname, "/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/profile_page_go_to_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar_diff.png")
    ),
    new NavigateForwardAndBack(
      "GoToUpdateAccountInfoAndBack",
      (cut) => cut.basicInfoPage.infoValuesGroup.click(),
      (cut) => cut.updateAccountInfoPage.emit("back"),
      (cut) => cut.updateAccountInfoPage.emit("updated"),
      path.join(__dirname, "/profile_page_go_to_update_account_info.png"),
      path.join(
        __dirname,
        "/golden/profile_page_go_to_update_account_info.png"
      ),
      path.join(__dirname, "/profile_page_go_to_update_account_info_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_account_info.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_account_info_diff.png"
      ),
      path.join(__dirname, "/profile_page_back_from_updated_account_info.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_account_info_diff.png"
      )
    ),
  ],
});
