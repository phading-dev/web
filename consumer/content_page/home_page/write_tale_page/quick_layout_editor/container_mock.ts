import { QuickLayoutEditor } from "./container";

export class QuickLayoutEditorMock extends QuickLayoutEditor {
  public constructor() {
    super(undefined);
  }
  public addImage(imageUrl: string): void {
    this.addImageEditor(imageUrl);
    this.checkValidity();
  }
}
