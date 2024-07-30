import { Meter } from "./meter";
import { BlockingLoopMock } from "@selfage/blocking_loop/blocking_loop_mock";

export class MeterMock extends Meter {
  public currentTimestampMs: number;
  public currentSeasonId: string;

  public constructor(seasonId: string) {
    super(
      {
        addEventListener: () => {},
        removeEventListener: () => {},
      } as any,
      undefined,
      (style) => new BlockingLoopMock(style),
      seasonId,
    );
    this.currentSeasonId = seasonId;
  }

  public watchStart(timestampMs: number): void {
    this.currentTimestampMs = timestampMs;
  }

  public watchUpdate(timestampMs: number): void {
    this.currentTimestampMs = timestampMs;
  }

  public watchStop(): void {
    this.currentTimestampMs = undefined;
  }
}
