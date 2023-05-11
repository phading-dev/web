import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { createPlusIcon } from "../../common/icons";
import {
  LOCAL_PERSONA_STORAGE,
  LocalPersonaStorage,
} from "../../common/local_persona_storage";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { PersonaCard } from "./persona_card";
import { listPersonas } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPersonaPage {
  on(event: "selected", listener: () => void): this;
  on(event: "create", listener: () => void): this;
}

export class ListPersonaPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public personaCards = new Array<PersonaCard>();
  public addPersonaCard: HTMLDivElement;
  private cardContainer: HTMLDivElement;

  public constructor(
    private webServiceClient: WebServiceClient,
    private personaStorage: LocalPersonaStorage
  ) {
    super();
    let cardContainerRef = new Ref<HTMLDivElement>();
    let addPersonaCardRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "select-persona",
        style: `flex-flow: row nowrap; width: 100vw; min-height: 100vh;`,
      },
      E.divRef(
        cardContainerRef,
        {
          class: "select-persona-container",
          style: ` margin: auto; display: flex; flex-flow: row wrap; align-items: center; box-sizing: border-box; max-width: 120rem; gap: 6rem; padding: 3rem;`,
        },
        E.divRef(
          addPersonaCardRef,
          {
            class: "select-persona-add-persona-card",
            style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; width: 16rem; height: 16rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; border-radius: 2rem; background-color: ${SCHEME.neutral4}; cursor: pointer;`,
          },
          E.div(
            {
              class: "select-persona-add-persona-plus-icon",
              style: `width: 6rem; height: 6rem;`,
            },
            createPlusIcon(SCHEME.neutral1)
          )
        )
      )
    );
    this.cardContainer = cardContainerRef.val;
    this.addPersonaCard = addPersonaCardRef.val;

    this.addPersonaCard.addEventListener("click", () => this.emit("create"));
  }

  public static create(): ListPersonaPage {
    return new ListPersonaPage(WEB_SERVICE_CLIENT, LOCAL_PERSONA_STORAGE);
  }

  public async show(): Promise<void> {
    this.body.style.display = "flex";

    let response = await listPersonas(this.webServiceClient, {});
    let selectedPersonaId = this.personaStorage.read();
    for (let cardData of response.cards) {
      let card = new PersonaCard(cardData, cardData.id === selectedPersonaId);
      card.on("select", (personaId) => this.updatePersonaSelection(personaId));
      this.cardContainer.insertBefore(card.body, this.addPersonaCard);
      this.personaCards.push(card);
    }
  }

  private updatePersonaSelection(personaId: string): void {
    this.personaStorage.save(personaId);
    this.emit("selected");
  }

  public hide(): void {
    this.body.style.display = "hide";
    while (this.personaCards.length > 0) {
      this.personaCards.pop().remove();
    }
  }
}
