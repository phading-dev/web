import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { CARD_WIDTH } from "./styles";
import { PersonaCard as PersonaCardData } from "@phading/user_service_interface/persona_card";
import { E } from "@selfage/element/factory";

export interface SelectPersonaCard {
  on(event: "select", listener: (personaId: string) => void): this;
}

export class PersonaCard extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(
    private personaCardData: PersonaCardData,
    public selected: boolean
  ) {
    super();
    this.body = E.div(
      {
        class: "select-persona-card",
        style: `display: flex; flex-flow: column nowrap; align-items: center; width: ${CARD_WIDTH}; gap: 3rem; padding: 0 2rem; box-sizing: border-box; border-radius: .5rem; background-color: ${SCHEME.neutral4}; cursor: pointer;`,
      },
      E.div(
        {
          class: "select-persona-card-name",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(this.personaCardData.name)
      ),
      E.image({
        class: "select-persona-card-image",
        style: `width: 15rem; height: 15rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: 20rem;`,
        src: this.personaCardData.imagePath,
      })
    );

    if (this.selected) {
      this.renderSelected();
    } else {
      this.renderUnselected();
    }
    this.body.addEventListener("click", () => this.select());
  }

  public static create(
    personaCardData: PersonaCardData,
    selected: boolean
  ): PersonaCard {
    return new PersonaCard(personaCardData, selected);
  }

  private renderSelected(): void {
    this.body.style.paddingTop = `2.8rem`;
    this.body.style.paddingBottom = `2.8rem`;
    this.body.style.border = `.2rem solid ${SCHEME.primary1}`;
  }

  private renderUnselected(): void {
    this.body.style.paddingTop = `2.9rem`;
    this.body.style.paddingBottom = `2.9rem`;
    this.body.style.border = `.1rem solid ${SCHEME.neutral1}`;
  }

  private select(): void {
    this.emit("select", this.personaCardData.id);
  }

  public remove(): void {
    this.body.remove();
  }
}
