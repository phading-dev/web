export class PageNavigator<Page> {
  private currentPage: Page;

  public constructor(
    private addPage: (page: Page) => void,
    private removePage: (page: Page) => void,
    private updatePage: (page: Page) => void = () => {}
  ) {}

  public goTo(page: Page) {
    if (this.currentPage !== page) {
      this.removePage(this.currentPage);
      this.currentPage = page;
      this.addPage(this.currentPage);
    } else {
      this.updatePage(this.currentPage);
    }
  }

  public add(): void {
    this.addPage(this.currentPage);
  }

  public remove(): void {
    this.removePage(this.currentPage);
  }
}