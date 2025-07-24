import { ReplacePrimaryPaymentMethodAction } from "./action";
import {
  REPLACE_PRIMARY_PAYMENT_METHOD,
  REPLACE_PRIMARY_PAYMENT_METHOD_REQUEST_BODY,
} from "@phading/commerce_service_interface/web/payment/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "ReplacePrimaryPaymentMethodActionTest",
  cases: [
    {
      name: "Success",
      execute: async () => {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();

        // Execute
        let cut = new ReplacePrimaryPaymentMethodAction(
          {
            location: {
              search: "?session_id=checkout_session_12345",
            },
          } as any,
          serviceClientMock,
          "account1",
        );
        let paymentAccountId = await new Promise<string>((resolve) =>
          cut.once("payment", (accountId) => resolve(accountId)),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(REPLACE_PRIMARY_PAYMENT_METHOD),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              checkoutSessionId: "checkout_session_12345",
            },
            REPLACE_PRIMARY_PAYMENT_METHOD_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(paymentAccountId, eq("account1"), "payment account");
      },
    },
    {
      name: "Failed",
      execute: async () => {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("Fake error");

        // Execute
        let cut = new ReplacePrimaryPaymentMethodAction(
          {
            location: {
              search: "?session_id=checkout_session_12345",
            },
          } as any,
          serviceClientMock,
          "account1",
        );
        let paymentAccountId = await new Promise<string>((resolve) =>
          cut.once("payment", (accountId) => resolve(accountId)),
        );

        // Verify
        assertThat(paymentAccountId, eq("account1"), "payment account");
      },
    },
    {
      name: "NoSessionId",
      execute: async () => {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();

        // Execute
        let cut = new ReplacePrimaryPaymentMethodAction(
          {
            location: {
              search: "?",
            },
          } as any,
          serviceClientMock,
          "account1",
        );
        let paymentAccountId = await new Promise<string>((resolve) =>
          cut.once("payment", (accountId) => resolve(accountId)),
        );

        // Verify
        assertThat(paymentAccountId, eq("account1"), "payment account");
      },
    },
  ],
});
