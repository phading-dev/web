import { RandomIntegerGenerator } from "./random_integer_generator";

export class RandomIntegerGeneratorMock extends RandomIntegerGenerator {
  public constructor(public fakeInt: number) {
    super();
  }

  public get(): number {
    return this.fakeInt;
  }
}
