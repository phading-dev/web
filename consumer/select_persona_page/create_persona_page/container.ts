import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { ImageCropper } from "../../common/image_cropper/container";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { EditPersonaPage, InputField } from "../common/edit_persona_page";
import {
  createPersona,
  uploadPersonaImage,
} from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreatePersonaPage {
  on(event: "done", listener: () => void): this;
}

export class CreatePersonaPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public editPersonaPage: EditPersonaPage;

  public constructor(private webServiceClient: WebServiceClient) {
    super();
    let editPersonaPageRef = new Ref<EditPersonaPage>();
    this.body = assign(
      editPersonaPageRef,
      new EditPersonaPage(
        (validInputs) => this.refreshSubmitButton(validInputs),
        (nameInput, imageCropper) =>
          this.createPersonaAction(nameInput, imageCropper),
        E.div(
          {
            class: "edit-persona-name-label",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.namePersonaLabel)
        ),
        LOCALIZED_TEXT.choosePersonaImageLabel,
        LOCALIZED_TEXT.createPersonaLabel
      )
    ).body;
    this.editPersonaPage = editPersonaPageRef.val;

    this.editPersonaPage.on("done", () => this.emit("done"));
  }

  public static create(): CreatePersonaPage {
    return new CreatePersonaPage(WEB_SERVICE_CLIENT);
  }

  private refreshSubmitButton(validInputs: Set<InputField>): boolean {
    return (
      validInputs.has(InputField.IMAGE) && validInputs.has(InputField.NAME)
    );
  }

  private async createPersonaAction(
    nameInput: HTMLInputElement,
    imageCropper: ImageCropper
  ): Promise<void> {
    let imageBlob = await imageCropper.export();
    let uploadResponse = await uploadPersonaImage(
      this.webServiceClient,
      imageBlob
    );
    await createPersona(this.webServiceClient, {
      name: nameInput.value,
      imagePath: uploadResponse.imagePath,
    });
  }

  public show(): void {
    this.editPersonaPage.show();
  }

  public hide(): void {
    this.editPersonaPage.hide();
  }
}
