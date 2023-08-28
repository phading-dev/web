import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createPlusIcon } from "../../../common/icons";
import { WarningTagType } from "@phading/tale_service_interface/warning_tag_type";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface NormalTag {
  on(event: "delete", listener: () => void): this;
}

export class NormalTag extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing.
  public deleteButton: HTMLDivElement;

  public constructor(public text: string) {
    super();
    let deleteButtonRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "normal-tag",
        style: `display: flex; flex-flow: row nowrap; align-items: center; border: .1rem solid ${SCHEME.neutral1}; border-radius: 2rem;`,
      },
      E.div(
        {
          class: "normal-tag-content",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0}; line-height: 3rem; margin-left: 1rem;`,
        },
        E.text(text)
      ),
      E.divRef(
        deleteButtonRef,
        {
          class: "normal-tag-delete-button",
          style: `height: 1.6rem; width: 1.6rem; padding: .2rem; box-sizing: border-box; margin: 0 .5rem 0 .3rem; rotate: 45deg; cursor: pointer;`,
        },
        createPlusIcon(SCHEME.neutral1)
      )
    );
    this.deleteButton = deleteButtonRef.val;

    this.deleteButton.addEventListener("click", () => this.emit("delete"));
  }

  public static create(text: string): NormalTag {
    return new NormalTag(text);
  }
}

export class WarningTag {
  public body: HTMLDivElement;
  public selected: boolean;

  public constructor(
    public warningTagType: WarningTagType,
    localizedText: string
  ) {
    this.body = E.div(
      {
        class: "warning-tag",
        style: `font-size: 1.4rem; color: ${SCHEME.neutral0}; line-height: 3rem; padding: 0 1rem; border: .1rem; border-radius: 2rem; cursor: pointer;`,
      },
      E.text(localizedText)
    );
    this.unselect();

    this.body.addEventListener("click", () => this.toggleSelection());
  }

  public static create(
    warningTagType: WarningTagType,
    localizedText: string
  ): WarningTag {
    return new WarningTag(warningTagType, localizedText);
  }

  public unselect(): void {
    this.body.style.borderStyle = "dashed";
    this.body.style.borderColor = SCHEME.neutral2;
    this.selected = false;
  }

  private select(): void {
    this.body.style.borderStyle = "solid";
    this.body.style.borderColor = SCHEME.neutral1;
    this.selected = true;
  }

  private toggleSelection(): void {
    if (this.selected) {
      this.unselect();
    } else {
      this.select();
    }
  }
}
