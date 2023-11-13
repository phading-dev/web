import path = require("path");
import { BasicInfoPagMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { PROFILE_PAGE_STATE, Page, ProfilePageState } from "./state";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdateContactEmailPageMock } from "./update_contact_email_page/body_mock";
import { UpdateDescriptionPageMock } from "./update_description_page/body_mock";
import { UpdateNaturalNamePageMock } from "./update_natural_name/body_mock";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  deleteFile,
  screenshot,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

class NavigateForwardAndBack implements TestCase {
  private cut: ProfilePage;
  public constructor(
    public name: string,
    private click: (cut: ProfilePage) => void,
    private emitBack: (cut: ProfilePage) => void,
    private emitUpdated: (cut: ProfilePage) => void,
    private goToPage: Page,
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
      () => new UpdateNaturalNamePageMock(),
      () => new UpdateContactEmailPageMock(),
      () => new UpdateDescriptionPageMock(),
      (...bodies) => document.body.append(...bodies),
      (...bodies) => menuContainer.append(...bodies)
    );
    let state: ProfilePageState;
    this.cut.on("newState", (newState) => (state = newState));
    this.cut.updateState();
    await screenshot(path.join(__dirname, "/profile_page_baseline.png"));

    // Execute
    this.click(this.cut);

    // Verify
    assertThat(
      state,
      eqMessage(
        {
          page: this.goToPage,
        },
        PROFILE_PAGE_STATE
      ),
      "go to page"
    );
    await asyncAssertScreenshot(
      this.goToPageActualFile,
      this.goToPageExpectedFile,
      this.goToPageDiffFile
    );

    // Execute
    this.emitBack(this.cut);

    // Verify
    assertThat(
      state,
      eqMessage(
        {
          page: Page.BasicInfo,
        },
        PROFILE_PAGE_STATE
      ),
      "back from page"
    );
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
    assertThat(
      state,
      eqMessage(
        {
          page: Page.BasicInfo,
        },
        PROFILE_PAGE_STATE
      ),
      "updated from page"
    );
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
      public name = "Default_UpdateStates";
      private cut: ProfilePage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        this.cut = new ProfilePage(
          () => new BasicInfoPagMock(),
          () => new UpdateAvatarPageMock(),
          () => new UpdateNaturalNamePageMock(),
          () => new UpdateContactEmailPageMock(),
          () => new UpdateDescriptionPageMock(),
          (...bodies) => document.body.append(...bodies),
          (...bodies) => menuContainer.append(...bodies)
        );

        // Execute
        this.cut.updateState();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_default.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(__dirname, "/profile_page_default_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.BasicInfo,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_basic_info.png"),
          path.join(__dirname, "/golden/profile_page_default.png"),
          path.join(__dirname, "/profile_page_basic_info_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.UpdateAvatar,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_update_avatar.png"),
          path.join(__dirname, "/golden/profile_page_update_avatar.png"),
          path.join(__dirname, "/profile_page_update_avatar_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.UpdateContactEmail,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_update_contact_email.png"),
          path.join(__dirname, "/golden/profile_page_update_contact_email.png"),
          path.join(__dirname, "/profile_page_update_contact_email_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.UpdateDescription,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_update_description.png"),
          path.join(__dirname, "/golden/profile_page_update_description.png"),
          path.join(__dirname, "/profile_page_update_description_diff.png")
        );

        // Execute
        this.cut.updateState({
          page: Page.UpdateNaturalName,
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/profile_page_update_natural_name.png"),
          path.join(__dirname, "/golden/profile_page_update_natural_name.png"),
          path.join(__dirname, "/profile_page_update_natural_name_diff.png")
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
      Page.UpdateAvatar,
      path.join(__dirname, "/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_avatar.png"),
      path.join(__dirname, "/profile_page_go_to_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_update_avatar_diff.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar.png"),
      path.join(__dirname, "/profile_page_back_from_updated_avatar_diff.png")
    ),
    new NavigateForwardAndBack(
      "GoToUpdateContactEmailAndBack",
      (cut) => cut.basicInfoPage.contactEmail.click(),
      (cut) => cut.updateContactEmailPage.emit("back"),
      (cut) => cut.updateContactEmailPage.emit("updated"),
      Page.UpdateContactEmail,
      path.join(__dirname, "/profile_page_go_to_update_contact_email.png"),
      path.join(
        __dirname,
        "/golden/profile_page_go_to_update_contact_email.png"
      ),
      path.join(__dirname, "/profile_page_go_to_update_contact_email_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_contact_email.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_contact_email_diff.png"
      ),
      path.join(__dirname, "/profile_page_back_from_updated_contact_email.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_contact_email_diff.png"
      )
    ),
    new NavigateForwardAndBack(
      "GoToUpdateDescriptionAndBack",
      (cut) => cut.basicInfoPage.description.click(),
      (cut) => cut.updateDescriptionPage.emit("back"),
      (cut) => cut.updateDescriptionPage.emit("updated"),
      Page.UpdateDescription,
      path.join(__dirname, "/profile_page_go_to_update_description.png"),
      path.join(__dirname, "/golden/profile_page_go_to_update_description.png"),
      path.join(__dirname, "/profile_page_go_to_update_description_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_description.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_description_diff.png"
      ),
      path.join(__dirname, "/profile_page_back_from_updated_description.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_description_diff.png"
      )
    ),
    new NavigateForwardAndBack(
      "GoToUpdateNaturalNameAndBack",
      (cut) => cut.basicInfoPage.naturalName.click(),
      (cut) => cut.updateNaturalNamePage.emit("back"),
      (cut) => cut.updateNaturalNamePage.emit("updated"),
      Page.UpdateNaturalName,
      path.join(__dirname, "/profile_page_go_to_update_natural_name.png"),
      path.join(
        __dirname,
        "/golden/profile_page_go_to_update_natural_name.png"
      ),
      path.join(__dirname, "/profile_page_go_to_update_natural_name_diff.png"),
      path.join(__dirname, "/profile_page_back_from_update_natural_name.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_update_natural_name_diff.png"
      ),
      path.join(__dirname, "/profile_page_back_from_updated_natural_name.png"),
      path.join(
        __dirname,
        "/profile_page_back_from_updated_natural_name_diff.png"
      )
    ),
  ],
});
