import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { PayoutPage } from "./body";
import {
  GET_PAYOUT_PROFILE_INFO,
  GetPayoutProfileInfoResponse,
  LIST_PAYOUTS,
  LIST_PAYOUTS_REQUEST_BODY,
  LinkType,
  ListPayoutsResponse,
} from "@phading/commerce_service_interface/web/payout/interface";
import { PayoutState } from "@phading/commerce_service_interface/web/payout/payout";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "PayoutPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "PhoneView_OnboardingAndEmptyList_StartMonthLargerThanEndMonth_ListPayouts_TabletView";
      private cut: PayoutPage;
      public async execute() {
        // Prepare
        await setPhoneView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYOUT_PROFILE_INFO:
                return {
                  connectedAccountLinkType: LinkType.ONBOARDING,
                  connectedAccountUrl: "https://stripe.com/onboarding",
                } as GetPayoutProfileInfoResponse;
              case LIST_PAYOUTS:
                this.request = request;
                return this.response;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        serviceClientMock.response = {
          payouts: [],
        } as ListPayoutsResponse;
        // 2025-04-05T08:xx:xx.000Z
        this.cut = new PayoutPage(
          serviceClientMock,
          () => new Date(1743867646000),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2024-10",
              endMonth: "2025-03",
            },
            LIST_PAYOUTS_REQUEST_BODY,
          ),
          "RC request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payout_page_onboarding_link_no_activity.png"),
          path.join(
            __dirname,
            "/golden/payout_page_onboarding_link_no_activity.png",
          ),
          path.join(
            __dirname,
            "/payout_page_onboarding_link_no_activity_diff.png",
          ),
        );

        // Execute
        this.cut.monthRangeInput.val.startRangeInput.val.value = "2025-04";
        this.cut.monthRangeInput.val.startRangeInput.val.dispatchEvent(
          new Event("input"),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payout_page_invalid_range.png"),
          path.join(__dirname, "/golden/payout_page_invalid_range.png"),
          path.join(__dirname, "/payout_page_invalid_range_diff.png"),
        );

        // Prepare
        serviceClientMock.response = {
          payouts: [
            {
              month: "2026-06",
              currency: "USD",
              amount: 13300,
              state: PayoutState.DISABLED,
            },
            {
              month: "2026-12",
              currency: "USD",
              amount: 1330,
              state: PayoutState.PAID,
            },
            {
              month: "2025-06",
              currency: "USD",
              amount: 99000000,
              state: PayoutState.PAID,
            },
            {
              month: "2026-01",
              currency: "USD",
              amount: 10000,
              state: PayoutState.PROCESSING,
            },
            {
              month: "2025-05",
              currency: "USD",
              amount: 10,
              state: PayoutState.PAID,
            },
          ],
        } as ListPayoutsResponse;

        // Execute
        this.cut.monthRangeInput.val.endRangeInput.val.value = "2026-12";
        this.cut.monthRangeInput.val.endRangeInput.val.dispatchEvent(
          new Event("input"),
        );
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              startMonth: "2025-04",
              endMonth: "2026-12",
            },
            LIST_PAYOUTS_REQUEST_BODY,
          ),
          "RC request body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/payout_page_list_payouts.png"),
          path.join(__dirname, "/golden/payout_page_list_payouts.png"),
          path.join(__dirname, "/payout_page_list_payouts_diff.png"),
        );

        // Execute
        await setTabletView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payout_page_list_payouts_tablet.png"),
          path.join(__dirname, "/golden/payout_page_list_payouts_tablet.png"),
          path.join(__dirname, "/payout_page_list_payouts_tablet_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoginLink";
      private cut: PayoutPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(request: any): Promise<any> {
            switch (request.descriptor) {
              case GET_PAYOUT_PROFILE_INFO:
                return {
                  connectedAccountLinkType: LinkType.LOGIN,
                  connectedAccountUrl: "https://stripe.com/login",
                } as GetPayoutProfileInfoResponse;
              case LIST_PAYOUTS:
                return {
                  payouts: [],
                } as ListPayoutsResponse;
              default:
                throw new Error("Unexpected request");
            }
          }
        })();
        // 2025-04-05T08:xx:xx.000Z
        this.cut = new PayoutPage(
          serviceClientMock,
          () => new Date(1743867646000),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise((resolve) => this.cut.once("listed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/payout_page_login_link.png"),
          path.join(__dirname, "/golden/payout_page_login_link.png"),
          path.join(__dirname, "/payout_page_login_link_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
