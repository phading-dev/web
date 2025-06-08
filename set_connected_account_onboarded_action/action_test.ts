import { SetConnectedAccountOnboardedAction } from "./action";
import {
  SET_CONNECTED_ACCOUNT_ONBOARDED,
  SET_CONNECTED_ACCOUNT_ONBOARDED_REQUEST_BODY,
} from "@phading/commerce_service_interface/web/payout/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

TEST_RUNNER.run({
  name: "SetConnectedAccountOnboardedActionTest",
  cases: [
    {
      name: "Success",
      execute: async () => {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();

        // Execute
        let cut = new SetConnectedAccountOnboardedAction(
          serviceClientMock,
          "account1",
        );
        let completeAccountId = await new Promise<string>((resolve) =>
          cut.once("complete", (accountId) => resolve(accountId)),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SET_CONNECTED_ACCOUNT_ONBOARDED),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              accountId: "account1",
            },
            SET_CONNECTED_ACCOUNT_ONBOARDED_REQUEST_BODY,
          ),
          "RC body",
        );
        assertThat(completeAccountId, eq("account1"), "complete account");
      },
    },
    {
      name: "Error",
      execute: async () => {
        // Prepare
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("Fake error");

        // Execute
        let cut = new SetConnectedAccountOnboardedAction(
          serviceClientMock,
          "account1",
        );
        let completeAccountId = await new Promise<string>((resolve) =>
          cut.once("complete", (accountId) => resolve(accountId)),
        );

        // Verify
        assertThat(completeAccountId, eq("account1"), "complete account");
      },
    },
  ],
});
