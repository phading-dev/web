import path = require("path");
import { SCHEME } from "../../../../../../common/color_scheme";
import { normalizeBody } from "../../../../../../common/normalize_body";
import { setTabletView } from "../../../../../../common/view_port";
import { FileDropZone } from "./file_drop_zone";
import { E } from "@selfage/element/factory";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "FileDropZoneTest",
  cases: [
    new (class implements TestCase {
      public name = "OverAndLeave_FakeDragAndDrop_ClickToSelect";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 60rem; height: 60rem; background: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new FileDropZone();

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/file_drop_zone_default.png"),
          path.join(__dirname, "/golden/file_drop_zone_lowlight.png"),
          path.join(__dirname, "/file_drop_zone_default_diff.png"),
        );

        // Execute
        cut.body.dispatchEvent(new DragEvent("dragover"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/file_drop_zone_drag_over.png"),
          path.join(__dirname, "/golden/file_drop_zone_highlight.png"),
          path.join(__dirname, "/file_drop_zone_drag_over_diff.png"),
        );

        // Execute
        cut.body.dispatchEvent(new DragEvent("dragleave"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/file_drop_zone_drag_leave.png"),
          path.join(__dirname, "/golden/file_drop_zone_lowlight.png"),
          path.join(__dirname, "/file_drop_zone_drag_leave_diff.png"),
        );

        // Prepare
        let selected: File;
        cut.on("selected", (file: File) => {
          selected = file;
        });

        // Execute
        cut.body.dispatchEvent(new DragEvent("dragover"));
        cut.body.dispatchEvent(
          new DragEvent("drop", {
            dataTransfer: new DataTransfer(),
          }),
        );

        // Verify
        assertThat(selected, eq(undefined), "No file selected");
        await asyncAssertScreenshot(
          path.join(__dirname, "/file_drop_zone_after_drop.png"),
          path.join(__dirname, "/golden/file_drop_zone_lowlight.png"),
          path.join(__dirname, "/file_drop_zone_after_drop_diff.png"),
        );

        // Execute
        let dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File([""], "test.txt"));
        cut.body.dispatchEvent(
          new DragEvent("drop", {
            dataTransfer,
          }),
        );

        // Verify
        assertThat(selected.name, eq("test.txt"), "Selected file name");

        // Prepare
        selected = undefined;

        // Execute
        await supplyFiles(() => cut.click());

        // Verify
        assertThat(selected, eq(undefined), "No file selected after click");

        // Execute
        await supplyFiles(
          () => cut.click(),
          "./test_data/two_videos_two_audios.mp4",
        );

        // Verify
        assertThat(
          selected.name,
          eq("two_videos_two_audios.mp4"),
          "Selected file name after click",
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
