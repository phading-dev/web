import { Meter } from "./meter";

export class MeterMock extends Meter {
  public currentTimestampMs: number;

  public constructor(seasonId: string) {
    super(
      {
        addEventListener: () => {},
      } as any,
      undefined,
      seasonId,
    );
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
