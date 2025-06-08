import EventEmitter = require("events");
import { SERVICE_CLIENT } from "../common/web_service_client";
import { newSetConnectedAccountOnboardedRequest } from "@phading/commerce_service_interface/web/payout/client";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SetConnectedAccountOnboardedAction {
  on(event: "complete", listener: (accountId: string) => void): this;
}

export class SetConnectedAccountOnboardedAction extends EventEmitter {
  public static create(accountId: string): SetConnectedAccountOnboardedAction {
    return new SetConnectedAccountOnboardedAction(SERVICE_CLIENT, accountId);
  }

  public constructor(
    private serviceClient: WebServiceClient,
    public accountId: string,
  ) {
    super();
    this.execute();
  }

  private async execute(): Promise<void> {
    await this.executeInternal();
    this.emit("complete", this.accountId);
  }

  private async executeInternal(): Promise<void> {
    try {
      await this.serviceClient.send(
        newSetConnectedAccountOnboardedRequest({
          accountId: this.accountId,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }
}
