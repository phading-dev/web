import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { ImageCropper } from "../../common/image_cropper/container";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { EditPersonaPage, InputField } from "../common/edit_persona_page";
import {
  updatePersona,
  uploadPersonaImage,
} from "@phading/user_service_interface/client_requests";
import { UpdatePersonaRequestBody } from "@phading/user_service_interface/interface";
import { PersonaCard } from "@phading/user_service_interface/persona_card";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePersonaPage {
  on(event: "done", listener: () => void): this;
}

export class UpdatePersonaPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public editPersonaPage: EditPersonaPage;
  private renamePersonalLabel: HTMLDivElement;
  private currentImage: HTMLImageElement;
  private personaId: string;

  public constructor(private webServiceClient: WebServiceClient) {
    super();
    let editPersonaPageRef = new Ref<EditPersonaPage>();
    let renamePersonalLabelRef = new Ref<HTMLDivElement>();
    let currentImageRef = new Ref<HTMLImageElement>();
    this.body = assign(
      editPersonaPageRef,
      new EditPersonaPage(
        (validInputs) => this.refreshSubmitButton(validInputs),
        (nameInput, imageCropper) =>
          this.updatePersonaAction(nameInput, imageCropper),
        assign(
          renamePersonalLabelRef,
          E.div({
            class: "update-persona-name-label",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          })
        ),
        LOCALIZED_TEXT.replacePersonaImageLabelPart2,
        LOCALIZED_TEXT.updatePersonaLabel,
        E.div(
          {
            class: "update-persona-current-image-label",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.replacePersonaImageLabelPart1)
        ),
        assign(
          currentImageRef,
          E.image({
            class: "update-persona-current-image",
            style: `width: 20rem; height: 20rem;`,
          })
        )
      )
    ).body;
    this.editPersonaPage = editPersonaPageRef.val;
    this.renamePersonalLabel = renamePersonalLabelRef.val;
    this.currentImage = currentImageRef.val;

    this.editPersonaPage.on("done", () => this.emit("done"));
  }

  public static create(): UpdatePersonaPage {
    return new UpdatePersonaPage(WEB_SERVICE_CLIENT);
  }

  private refreshSubmitButton(validInputs: Set<InputField>): boolean {
    return (
      validInputs.has(InputField.IMAGE) || validInputs.has(InputField.NAME)
    );
  }

  private async updatePersonaAction(
    nameInput: HTMLInputElement,
    imageCropper: ImageCropper
  ): Promise<void> {
    let requestBody: UpdatePersonaRequestBody = {
      personaId: this.personaId,
    };
    if (nameInput.value.length > 0) {
      requestBody.name = nameInput.value;
    }
    if (imageCropper.loaded) {
      let imageBlob = await imageCropper.export();
      let uploadResponse = await uploadPersonaImage(
        this.webServiceClient,
        imageBlob
      );
      requestBody.imagePath = uploadResponse.imagePath;
    }
    await updatePersona(this.webServiceClient, requestBody);
  }

  public show(personaCard: PersonaCard): void {
    this.renamePersonalLabel.textContent = `${LOCALIZED_TEXT.renamePersonaLabelPart1} ${personaCard.name} ${LOCALIZED_TEXT.renamePersonaLabelPart2}`;
    this.currentImage.src = personaCard.imagePath;
    this.personaId = personaCard.id;
    this.editPersonaPage.show();
  }

  public hide(): void {
    this.editPersonaPage.hide();
  }
}
