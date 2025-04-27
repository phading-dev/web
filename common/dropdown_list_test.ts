import path = require("path");
import { Direction, DropdownList } from "./dropdown_list";
import { normalizeBody } from "./normalize_body";
import { setTabletView } from "./view_port";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

enum Location {
  TOP,
  MIDDLE,
  BOTTOM,
}

TEST_RUNNER.run({
  name: "DropdownListTest",
  cases: [
    new (class implements TestCase {
      public name =
        "Default_ShowOptions_HighlightOption_SelectOption_HideOptions";
      private cut: DropdownList<Location>;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new DropdownList<Location>(
          [
            {
              kind: Location.TOP,
              localizedMsg: "Top",
            },
            {
              kind: Location.MIDDLE,
              localizedMsg: "Middle",
            },
            {
              kind: Location.BOTTOM,
              localizedMsg: "Bottom",
            },
          ],
          Location.MIDDLE,
          "width: 10rem;",
          Direction.DOWN,
        );
        let selected: Location;
        this.cut.on("select", (value) => (selected = value));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_default.png"),
          path.join(__dirname, "/golden/dropdown_list_default.png"),
          path.join(__dirname, "/dropdown_list_default_diff.png"),
        );

        // Execute
        this.cut.selectedOption.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_show_options.png"),
          path.join(__dirname, "/golden/dropdown_list_show_options.png"),
          path.join(__dirname, "/dropdown_list_show_options_diff.png"),
        );

        // Execute
        this.cut.dropdownEntries[0].body.dispatchEvent(
          new PointerEvent("pointerover"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_highlight_option.png"),
          path.join(__dirname, "/golden/dropdown_list_highlight_option.png"),
          path.join(__dirname, "/dropdown_list_highlight_option_diff.png"),
        );

        // Execute
        this.cut.dropdownEntries[0].body.dispatchEvent(
          new PointerEvent("pointerout"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_lowlight_option.png"),
          path.join(__dirname, "/golden/dropdown_list_show_options.png"),
          path.join(__dirname, "/dropdown_list_lowlight_option_diff.png"),
        );

        // Execute
        this.cut.dropdownEntries[2].body.click();

        // Verify
        assertThat(selected, eq(Location.BOTTOM), "selected option");
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_select_option.png"),
          path.join(__dirname, "/golden/dropdown_list_select_option.png"),
          path.join(__dirname, "/dropdown_list_select_option_diff.png"),
        );

        // Execute
        this.cut.selectedOption.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_hide_options.png"),
          path.join(__dirname, "/golden/dropdown_list_default.png"),
          path.join(__dirname, "/dropdown_list_hide_options_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DirectionUp";
      private cut: DropdownList<Location>;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new DropdownList<Location>(
          [
            {
              kind: Location.TOP,
              localizedMsg: "Top",
            },
            {
              kind: Location.MIDDLE,
              localizedMsg: "Middle",
            },
            {
              kind: Location.BOTTOM,
              localizedMsg: "Bottom",
            },
          ],
          Location.MIDDLE,
          "margin-top: 20rem; width: 10rem;",
          Direction.UP,
        );
        document.body.append(this.cut.body);

        // Execute
        this.cut.selectedOption.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/dropdown_list_drop_up.png"),
          path.join(__dirname, "/golden/dropdown_list_drop_up.png"),
          path.join(__dirname, "/dropdown_list_drop_up_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
