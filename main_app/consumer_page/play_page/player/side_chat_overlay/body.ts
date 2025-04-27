import { ChatEntry } from "./chat_entry";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ChatOverlaySettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";

export class SideChatOverlay {
  public static create(settings: ChatOverlaySettings): SideChatOverlay {
    return new SideChatOverlay(settings);
  }

  public body: HTMLDivElement;
  private chatEntries = new Set<ChatEntry>();

  public constructor(private settings: ChatOverlaySettings) {
    this.body = E.div({
      class: "side-chat-overlay",
      style: `margin-left: auto; width: 100%; max-width: 30rem; height: 100%;`,
    });
  }

  public add(comments: Array<Comment>): void {
    comments.forEach((comment) => {
      let entry = ChatEntry.create(this.settings, comment);
      this.chatEntries.add(entry);
      this.body.prepend(entry.body);
      entry.moveIn();
    });
    this.moveOutOverflowedChats();
  }

  private moveOutOverflowedChats(): void {
    for (let entry of this.chatEntries) {
      if (
        entry.body.offsetTop + entry.body.offsetHeight >
        this.body.offsetHeight
      ) {
        entry.moveOut();
        this.chatEntries.delete(entry);
      } else {
        break;
      }
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
