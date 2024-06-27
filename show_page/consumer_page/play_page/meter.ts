import EventEmitter = require("events");
import { PRODUCT_METER_SERVICE_CLIENT } from "../../../common/web_service_client";
import { syncMeterReading } from "@phading/product_meter_service_interface/consumer/frontend/show/client_requests";
import { WebServiceClient } from "@selfage/web_service_client";

export interface Meter {
  on(event: "stop", listener: () => void): this;
}

export class Meter extends EventEmitter {
  public static create(seasonId: string): Meter {
    return new Meter(window, PRODUCT_METER_SERVICE_CLIENT, seasonId);
  }

  private static SYNC_CYCLE_INTERVAL_MS = 10 * 1000;

  private watchTimeMs = 0;
  private watchTimeStartMs: number;
  private syncLoopId: number;

  public constructor(
    private window: Window,
    private webServiceClient: WebServiceClient,
    private seasonId: string,
  ) {
    super();
    this.window.addEventListener("beforeunload", () => this.sync());
  }

  private syncRecurringly = async (): Promise<void> => {
    let currentLoopId = this.syncLoopId;
    await this.sync();
    await new Promise<void>((resolve) =>
      this.window.setTimeout(resolve, Meter.SYNC_CYCLE_INTERVAL_MS),
    );

    if (this.syncLoopId !== currentLoopId) {
      // Loop id changed. A new loop might be started.
      return;
    }
    this.syncLoopId = this.window.requestAnimationFrame(
      this.syncRecurringly,
    );
  };

  private async sync(): Promise<void> {
    if (!this.watchTimeMs) {
      return;
    }

    let watchTimeMs = this.watchTimeMs;
    // Clear before so that we won't send duplicated counters.
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
  }

  public watchStart(timestampMs: number): void {
    this.watchTimeStartMs = timestampMs;
    this.window.cancelAnimationFrame(this.syncLoopId);
    this.syncLoopId = this.window.requestAnimationFrame(
      this.syncRecurringly,
    );
  }

  public watchUpdate(timestampMs: number): void {
    this.watchTimeMs += timestampMs - this.watchTimeStartMs;
    this.watchTimeStartMs = timestampMs;
  }

  public watchStop(): void {
    this.sync();
    this.window.cancelAnimationFrame(this.syncLoopId);
    this.syncLoopId = undefined;
  }
}
