import { SCHEME } from "./color_scheme";

export class InputWithError<InputField> {
  public bodies: Array<HTMLElement>;

  public constructor(
    public input: HTMLInputElement,
    private errorLabel: HTMLDivElement,
    private validInputs: Set<InputField>,
    private inputField: InputField
  ) {
    this.bodies = [this.input, this.errorLabel];
    this.reset();
  }

  private reset(): void {
    this.input.style.borderColor = SCHEME.neutral1;
    this.errorLabel.style.visibility = "hidden";
  }

  public setValid(): void {
    this.reset();
    this.validInputs.add(this.inputField);
  }

  public setInvalidWithoutError(): void {
    this.reset();
    this.validInputs.delete(this.inputField);
  }

  public setInvalidWithError(errorStr: string): void {
    this.input.style.borderColor = SCHEME.error0;
    this.errorLabel.textContent = errorStr;
    this.errorLabel.style.visibility = "visible";
    this.validInputs.delete(this.inputField);
  }
}
