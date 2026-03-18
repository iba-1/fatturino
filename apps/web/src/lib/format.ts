const eurFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(value: number): string {
  return eurFormatter.format(value);
}
