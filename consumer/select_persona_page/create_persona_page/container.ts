import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { ImageCropper } from "../../common/image_cropper/container";
import {
  LOCAL_PERSONA_STORAGE,
  LocalPersonaStorage,
} from "../../common/local_persona_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { MenuItem } from "../../content_page/menu_item/container";
import { createBackMenuItem } from "../../content_page/menu_item/factory";
import { EditPersonaPage, InputField } from "../common/edit_persona_page";
import {
  createPersona,
  uploadPersonaImage,
} from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface CreatePersonaPage {
  on(event: "created", listener: () => void): this;
  on(event: "back", listener: () => void): this;
}

export class CreatePersonaPage extends EventEmitter {
  public body: HTMLDivElement;
  public menuBody: HTMLDivElement;
  // Visible for testing
  public editPersonaPage: EditPersonaPage;
  public backMenuItem: MenuItem;

  public constructor(
    private webServiceClient: WebServiceClient,
    private localPersonaStorage: LocalPersonaStorage
  ) {
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
            class: "create-persona-name-label",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.namePersonaLabel)
        ),
        LOCALIZED_TEXT.choosePersonaImageLabel,
        LOCALIZED_TEXT.createPersonaLabel
      )
    ).body;
    this.editPersonaPage = editPersonaPageRef.val;

    this.backMenuItem = createBackMenuItem();
    this.menuBody = this.backMenuItem.body;

    this.backMenuItem.on("action", () => this.emit("back"));
  }

  public static create(): CreatePersonaPage {
    return new CreatePersonaPage(WEB_SERVICE_CLIENT, LOCAL_PERSONA_STORAGE);
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
    let response = await createPersona(this.webServiceClient, {
      name: nameInput.value,
      imagePath: uploadResponse.imagePath,
    });
    this.localPersonaStorage.save(response.id);
    this.emit("created");
  }

  public remove(): void {
    this.editPersonaPage.remove();
    this.backMenuItem.remove();
  }
}
