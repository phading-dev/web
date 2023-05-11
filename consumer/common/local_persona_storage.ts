export class LocalPersonaStorage {
  private static NAME = "persona";

  public save(id: string): void {
    localStorage.setItem(LocalPersonaStorage.NAME, id);
  }
  public read(): string | undefined {
    return localStorage.getItem(LocalPersonaStorage.NAME);
  }
  public clear(): void {
    localStorage.removeItem(LocalPersonaStorage.NAME);
  }
}

export let LOCAL_PERSONA_STORAGE = new LocalPersonaStorage();
