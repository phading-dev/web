import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { InfoCard } from "./body";
import { E } from "@selfage/element/factory";
import { mouseWheel, setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../../../../../common/normalize_body";

function createString(base: string, times: number): string {
  let arr = new Array<string>();
  for (let i = 0; i < times; i++) {
    arr.push(base);
  }
  return arr.join(" ");
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "InfoCardTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `width: 100vm; height: 100vh; display: flex;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new InfoCard({
          name: "This is a title",
          description: "Something something",
          publishedTime: 1716148024,
          publisher: {
            accountId: "account1",
            naturalName: "User name",
            avatarSmallPath: userImage,
          },
        }).show();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_default.png"),
          path.join(__dirname, "/golden/info_card_default.png"),
          path.join(__dirname, "/info_card_default_diff.png"),
        );

        // Prepare
        let focusUser = false;
        this.cut.on("focusUser", () => (focusUser = true));

        // Execute
        this.cut.publisher.val.click();

        // Verify
        assertThat(focusUser, eq(true), "Focus user");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Scrolling";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 200);
        this.cut = new InfoCard({
          name: createString("This is a title.", 10),
          description: createString("Something something.", 30),
          publishedTime: 1716148024,
          publisher: {
            accountId: "account1",
            naturalName: createString("User name", 20),
            avatarSmallPath: userImage,
          },
        }).show();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_long.png"),
          path.join(__dirname, "/golden/info_card_long.png"),
          path.join(__dirname, "/info_card_long_diff.png"),
        );

        // Execute
        await mouseWheel(100, 200);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_card_long_scroll_to_bottom.png"),
          path.join(__dirname, "/golden/info_card_long_scroll_to_bottom.png"),
          path.join(__dirname, "/info_card_long_scroll_to_bottom_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ClickToFocusUser";
      private cut: InfoCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        this.cut = new InfoCard({
          name: "This is a title",
          description: "Something something",
          publishedTime: 1716148024,
          publisher: {
            accountId: "account1",
            naturalName: "User name",
            avatarSmallPath: userImage,
          },
        }).show();
        container.append(this.cut.body);
        let accountIdCaptured: string;
        this.cut.on("focusUser", (accountId) => accountIdCaptured = accountId);

        // Execute
        this.cut.publisher.val.click();

        // Verify
        assertThat(accountIdCaptured, eq("account1"), "Focused user");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
