export class RandomIntegerGenerator {
  // Both are inclusive.
  public get(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export let RANDOM_INTEGER_GENERATOR = new RandomIntegerGenerator();
