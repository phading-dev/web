export interface InputField {
  readonly isValid: boolean;
  on(event: "validated", listener: () => void): this;
  on(event: "submit", listener: () => void): this;
}
