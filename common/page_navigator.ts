export class PageNavigator<Page, Args = any> {
  public currentPage: Page;

  public constructor(
    private addPage: (page: Page, args?: Args) => void,
    private removePage: (page: Page) => void,
    private updatePage: (page: Page, args?: Args) => void = () => {},
  ) {}

  private goToInternal = (page: Page, args?: Args): void => {
    if (this.currentPage !== page) {
      this.removePage(this.currentPage);
      this.currentPage = page;
      this.addPage(this.currentPage, args);
      this.updatePage(this.currentPage, args);
    } else {
      this.updatePage(this.currentPage, args);
    }
  };

  public goTo = this.goToInternal;

  // Once removed, all future navigations are stopped.
  public remove(): void {
    this.removePage(this.currentPage);
    this.goTo = () => {};
  }
}

export class TabNavigator<Tab, Args = any> {
  private currentTab: Tab;
  private tabsToCreate: Map<Tab, (args?: Args) => void> = new Map();
  private tabsToRemove: Map<Tab, () => void> = new Map();
  private tabsToUpdate: Map<Tab, (args?: Args) => void> = new Map();

  public set(
    tab: Tab,
    onCreate: (args?: Args) => void,
    onRemove: () => void,
    onUpdate?: (args?: Args) => void,
  ): void {
    this.tabsToCreate.set(tab, onCreate);
    this.tabsToRemove.set(tab, onRemove);
    this.tabsToUpdate.set(tab, onUpdate);
  }

  public goTo(tab: Tab, args?: Args): void {
    if (this.currentTab !== tab) {
      this.tabsToRemove.get(this.currentTab)?.();
      this.currentTab = tab;
      this.tabsToCreate.get(this.currentTab)?.(args);
    } else {
      this.tabsToUpdate.get(this.currentTab)?.(args);
    }
  }

  public remove(): void {
    this.tabsToRemove.get(this.currentTab)?.();
    this.goTo = () => {};
  }
}
