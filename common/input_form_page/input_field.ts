export interface ValidationResult {
  valid: boolean;
  errorMsg?: string;
}

export interface InputField {
  on(event: "refresh", listener: () => void): this;
  on(event: "action", listener: () => void): this;
  removeAllListeners: () => void;
  validate(): void;
  isValid: boolean;
}
