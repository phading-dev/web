import "../dev/env";
import path = require("path");
import { setDesktopView, setPhoneView, setTabletView } from "../common/view_port";
import { MarketingPage } from "./body";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { normalizeBody } from "../common/normalize_body";

normalizeBody();

TEST_RUNNER.run({
  name: "MarketingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "DesktopView_TabletView_ScrolledIntoFaq_PhoneView";
      private cut: MarketingPage;
      public async execute() {
        // Prepare
        await setDesktopView();

        // Execute
        this.cut = new MarketingPage();
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_desktop.png"),
          path.join(__dirname, "/golden/marketing_page_desktop.png"),
          path.join(__dirname, "/marketing_page_desktop_diff.png"),
          {
            fullPage: true
          }
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_tablet.png"),
          path.join(__dirname, "/golden/marketing_page_tablet.png"),
          path.join(__dirname, "/marketing_page_tablet_diff.png"),
          {
            fullPage: true
          }
        );

        // Prepare
        window.scrollTo(0, 0);

        // Execute
        this.cut.faqButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_tablet_faq.png"),
          path.join(__dirname, "/golden/marketing_page_tablet_faq.png"),
          path.join(__dirname, "/marketing_page_tablet_faq_diff.png"),
          {
            delay: 1000,
          }
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/marketing_page_phone.png"),
          path.join(__dirname, "/golden/marketing_page_phone.png"),
          path.join(__dirname, "/marketing_page_phone_diff.png"),
          {
            fullPage: true
          }
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
