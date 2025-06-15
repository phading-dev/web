export interface ValidationResult {
  valid: boolean;
  errorMsg?: string;
}

export interface InputField {
  on(event: "validate", listener: () => void): this;
  on(event: "action", listener: () => void): this;
  isValid: boolean;
}
