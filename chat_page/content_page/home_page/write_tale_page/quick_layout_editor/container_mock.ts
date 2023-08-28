import { QuickLayoutEditor } from "./container";

export class QuickLayoutEditorMock extends QuickLayoutEditor {
  public constructor() {
    super(undefined);
  }
  public addImage(imagePath: string): void {
    this.addImagePreviewer(imagePath);
    this.checkImagesInputValidity();
  }
}
