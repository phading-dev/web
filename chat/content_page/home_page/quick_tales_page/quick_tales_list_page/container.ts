import EventEmitter = require("events");
import { FilledBlockingButton } from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { MenuItem } from "../../../../common/menu_item/container";
import {
  createBackMenuItem,
  createReplyPostMenuItem,
} from "../../../../common/menu_item/factory";
import { WEB_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { QuickTaleCard } from "./quick_tale_card";
import { CARD_WIDTH } from "./styles";
import { UserInfoCard } from "./user_info_card";
import {
  getQuickTale,
  getRecommendedQuickTales,
  viewTale,
} from "@phading/tale_service_interface/client_requests";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";
import { TaleContext } from "@phading/tale_service_interface/tale_context";
import { getUserInfoCard } from "@phading/user_service_interface/client_requests";
import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface QuickTalesListPage {
  on(event: "contextLoaded", listener: () => void): this;
  on(event: "talesLoaded", listener: () => void): this;
  on(event: "back", listener: () => void): this;
  on(event: "pin", listener: (context: TaleContext) => void): this;
  on(event: "reply", listener: (taleId: string) => void): this;
  on(
    event: "viewImages",
    listener: (imagePaths: Array<string>, initialIndex: number) => void
  ): this;
}

export class QuickTalesListPage extends EventEmitter {
  private static MAX_NUM_CARDS = 30;

  public body: HTMLDivElement;
  public backMenuBody: HTMLDivElement;
  public menuBody: HTMLDivElement;
  // Visible for testing
  public tryLoadingButton: FilledBlockingButton;
  public quickTaleCards = new Set<QuickTaleCard>();
  public backMenuItem: MenuItem;
  public replyMenuItem: MenuItem;
  private loadingSection: HTMLDivElement;
  private loadingObserver: IntersectionObserver;
  private moreTalesLoaded: boolean;

  public constructor(
    private quickTaleCardFactoryFn: (
      cardData: QuickTaleCardData,
      pinned: boolean
    ) => QuickTaleCard,
    private userInfoCardFactoryFn: (cardData: UserInfoCardData) => UserInfoCard,
    protected webServiceClient: WebServiceClient,
    private context: TaleContext
  ) {
    super();
    let loadingSectionRef = new Ref<HTMLDivElement>();
    let tryLoadingButtonRef = new Ref<FilledBlockingButton>();
    this.body = E.div(
      {
        class: "quick-tales-list",
        style: `display: flex; flex-flow: column nowrap; width: 100vw; align-items: center;`,
      },
      E.divRef(
        loadingSectionRef,
        {
          class: "quick-tales-list-loading-section",
          style: `display: flex; flex-flow: column nowrap; width: ${CARD_WIDTH}; align-items: center; padding: 1rem 0; gap: 1rem; background-color: ${SCHEME.neutral4};`,
        },
        E.div(
          {
            class: "quick-tales-list-end-of-loading",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.noMoreTales)
        ),
        assign(
          tryLoadingButtonRef,
          FilledBlockingButton.create(
            "",
            E.text(LOCALIZED_TEXT.tryLoadingTalesLabel)
          )
        ).body
      )
    );
    this.loadingSection = loadingSectionRef.val;
    this.tryLoadingButton = tryLoadingButtonRef.val;

    if (this.context.taleId) {
      this.backMenuItem = createBackMenuItem();
      this.backMenuBody = this.backMenuItem.body;
      this.replyMenuItem = createReplyPostMenuItem();
      this.menuBody = this.replyMenuItem.body;

      this.backMenuItem.on("action", () => this.emit("back"));
      this.replyMenuItem.on("action", () =>
        this.emit("reply", this.context.taleId)
      );
    } else if (this.context.userId) {
      this.backMenuItem = createBackMenuItem();
      this.backMenuBody = this.backMenuItem.body;

      this.backMenuItem.on("action", () => this.emit("back"));
    }

    this.tryLoadContext();
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMoreUponReachingEnd();
      }
    });
    this.loadMoreUponReachingEnd();
    this.tryLoadingButton.on("action", () => this.loadMoreUponButtonClick());
    this.tryLoadingButton.on("postAction", () =>
      this.resumeLoadingAfterButtonClick()
    );
  }

  public static create(context: TaleContext): QuickTalesListPage {
    return new QuickTalesListPage(
      QuickTaleCard.create,
      UserInfoCard.create,
      WEB_SERVICE_CLIENT,
      context
    );
  }

  private async tryLoadContext(): Promise<void> {
    if (this.context.taleId) {
      let response = await getQuickTale(this.webServiceClient, {
        taleId: this.context.taleId,
      });
      let quickTaleCard = this.quickTaleCardFactoryFn(response.card, true);
      this.body.prepend(quickTaleCard.body);
      quickTaleCard.on("viewImages", (imagePaths, index) =>
        this.emit("viewImages", imagePaths, index)
      );
    } else if (this.context.userId) {
      let response = await getUserInfoCard(this.webServiceClient, {
        userId: this.context.userId,
      });
      let userInfoCard = this.userInfoCardFactoryFn(response.card);
      this.body.prepend(userInfoCard.body);
    }
    this.emit("contextLoaded");
  }

  private tryObserveLoading(): void {
    if (this.moreTalesLoaded) {
      this.loadingObserver.observe(this.loadingSection);
    }
  }

  private unobserveLoading(): void {
    this.loadingObserver.unobserve(this.loadingSection);
  }

  private async loadMoreUponReachingEnd(): Promise<void> {
    this.tryLoadingButton.disable();
    this.unobserveLoading();
    try {
      await this.loadMoreAndTryRemoveOldTales();
    } catch (e) {
      console.log(e);
    }
    this.tryLoadingButton.enable();
    this.tryObserveLoading();
  }

  public async loadMoreAndTryRemoveOldTales(): Promise<void> {
    let response = await getRecommendedQuickTales(this.webServiceClient, {
      context: this.context,
    });

    let accumulatedHeights = 0;
    let cardsToRemove = new Array<QuickTaleCard>();
    for (let card of this.quickTaleCards) {
      if (
        cardsToRemove.length <
        this.quickTaleCards.size - QuickTalesListPage.MAX_NUM_CARDS
      ) {
        accumulatedHeights += card.body.scrollHeight;
        cardsToRemove.push(card);
      } else {
        break;
      }
    }
    for (let card of cardsToRemove) {
      card.remove();
      this.quickTaleCards.delete(card);
    }
    this.body.scrollBy(-accumulatedHeights, 0);

    for (let cardData of response.cards) {
      let quickTaleCard = this.quickTaleCardFactoryFn(cardData, false);
      this.body.insertBefore(quickTaleCard.body, this.loadingSection);
      this.quickTaleCards.add(quickTaleCard);
      quickTaleCard.on("pin", (context) => this.emit("pin", context));
      quickTaleCard.on("viewImages", (imagePaths, index) =>
        this.emit("viewImages", imagePaths, index)
      );
      this.viewTaleOnVisible(quickTaleCard);
    }
    if (response.cards.length > 0) {
      this.moreTalesLoaded = true;
    } else {
      this.moreTalesLoaded = false;
    }
    this.emit("talesLoaded");
  }

  private viewTaleOnVisible(quickTaleCard: QuickTaleCard): void {
    let observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.viewTale(quickTaleCard.cardData.metadata.taleId);
        observer.unobserve(quickTaleCard.observee);
      }
    });
    observer.observe(quickTaleCard.observee);
  }

  private async viewTale(taleId: string): Promise<void> {
    await viewTale(this.webServiceClient, { taleId });
  }

  private async loadMoreUponButtonClick(): Promise<void> {
    this.unobserveLoading();
    await this.loadMoreAndTryRemoveOldTales();
  }

  private resumeLoadingAfterButtonClick(): void {
    this.tryObserveLoading();
  }

  public remove(): void {
    if (this.backMenuItem) {
      this.backMenuItem.remove();
    }
    if (this.replyMenuItem) {
      this.replyMenuItem.remove();
    }
    this.body.remove();
  }
}
