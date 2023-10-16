export interface InputField<Request> {
  readonly isValid: boolean;
  fillInRequest(request: Request): void;
  on(event: "validated", listener: () => void): this;
  on(event: "submit", listener: () => void): this;
}
