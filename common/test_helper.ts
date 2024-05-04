export async function stall(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
