import EventEmitter = require("events");
import { PRODUCT_METER_SERVICE_CLIENT } from "../../common/web_service_client";
import { syncMeterReading } from "@phading/product_meter_service_interface/consumer/frontend/show/client_requests";
import { BlockingLoop, Style } from "@selfage/blocking_loop";
import { WebServiceClient } from "@selfage/web_service_client";

export interface Meter {
  on(event: "stop", listener: () => void): this;
}

export class Meter extends EventEmitter {
  public static create(seasonId: string): Meter {
    return new Meter(
      window,
      PRODUCT_METER_SERVICE_CLIENT,
      BlockingLoop.create,
      seasonId,
    );
  }

  private static SYNC_CYCLE_INTERVAL_MS = 10 * 1000;

  private blockingLoop: BlockingLoop;
  private watchTimeMs = 0;
  private watchTimeStartMs: number;

  public constructor(
    private window: Window,
    private webServiceClient: WebServiceClient,
    private createBlockingLoop: (style: Style) => BlockingLoop,
    private seasonId: string,
  ) {
    super();
    // Use TIMEOUT to make sure readings can be synced even if the tab is not in focus.
    this.blockingLoop = this.createBlockingLoop(Style.TIMEOUT)
      .setAction(this.syncReading)
      .setInterval(Meter.SYNC_CYCLE_INTERVAL_MS);
    this.window.addEventListener("beforeunload", this.syncReading);
  }

  private syncReading = async (): Promise<void> => {
    if (!this.watchTimeMs) {
      return;
    }

    let watchTimeMs = this.watchTimeMs;
    // Clear before so that we won't double count if there is another sync() call.
    this.watchTimeMs = 0;
    try {
      await syncMeterReading(
        this.webServiceClient,
        {
          seasonId: this.seasonId,
          watchTimeMs,
        },
        {
          retries: 5,
          keepAlive: true,
          timeout: 5000,
        },
      );
    } catch (e) {
      this.emit("stop");
      // When failed, add back to the counter.
      this.watchTimeMs += watchTimeMs;
      return;
    }
  };

  public watchStart(timestampMs: number): void {
    this.watchTimeStartMs = timestampMs;
    this.blockingLoop.stop();
    this.blockingLoop.start();
  }

  public watchUpdate(timestampMs: number): void {
    this.watchTimeMs += timestampMs - this.watchTimeStartMs;
    this.watchTimeStartMs = timestampMs;
  }

  public watchStop(timestampMs: number): void {
    this.watchUpdate(timestampMs);
    this.syncReading();
    this.blockingLoop.stop();
  }

  public remove(): void {
    this.window.removeEventListener("beforeunload", this.syncReading);
  }
}
