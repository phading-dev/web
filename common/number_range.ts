export class NumberRange {
  public constructor(
    public minValue: number,
    public maxValue: number,
    public defaultValue: number,
  ) {}

  public getValidValue(raw?: number): number {
    if (isNaN(raw)) {
      return this.defaultValue;
    }
    let res = Math.max(raw, this.minValue);
    res = Math.min(res, this.maxValue);
    return res;
  }
}
