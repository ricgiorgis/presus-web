export const DEFAULT_CURRENCY_CODE = "GTQ";
export const DEFAULT_CURRENCY_SYMBOL = "Q";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const ISO_4217_CURRENCIES: Currency[] = [
  { code: "GTQ", name: "Quetzal guatemalteco", symbol: "Q", decimals: 2 },
  { code: "USD", name: "Dólar estadounidense", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", decimals: 2 },
  { code: "MXN", name: "Peso mexicano", symbol: "$", decimals: 2 },
  { code: "HNL", name: "Lempira hondureño", symbol: "L", decimals: 2 },
  { code: "SVC", name: "Colón salvadoreño", symbol: "₡", decimals: 2 },
  { code: "CRC", name: "Colón costarricense", symbol: "₡", decimals: 2 },
  { code: "NIO", name: "Córdoba nicaragüense", symbol: "C$", decimals: 2 },
  { code: "COP", name: "Peso colombiano", symbol: "$", decimals: 2 },
  { code: "PEN", name: "Sol peruano", symbol: "S/.", decimals: 2 },
  { code: "CLP", name: "Peso chileno", symbol: "$", decimals: 0 },
  { code: "ARS", name: "Peso argentino", symbol: "$", decimals: 2 },
  { code: "BRL", name: "Real brasileño", symbol: "R$", decimals: 2 },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U", decimals: 2 },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲", decimals: 0 },
  { code: "BOB", name: "Boliviano", symbol: "Bs.", decimals: 2 },
  { code: "VES", name: "Bolívar venezolano", symbol: "Bs.", decimals: 2 },
  { code: "JPY", name: "Yen japonés", symbol: "¥", decimals: 0 },
  { code: "CNY", name: "Yuan chino", symbol: "¥", decimals: 2 },
  { code: "CAD", name: "Dólar canadiense", symbol: "$", decimals: 2 },
  { code: "AUD", name: "Dólar australiano", symbol: "$", decimals: 2 },
  { code: "CHF", name: "Franco suizo", symbol: "Fr.", decimals: 2 },
];

export const getCurrencyByCode = (code: string): Currency | undefined =>
  ISO_4217_CURRENCIES.find((c) => c.code === code);

export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  const symbol = currency?.symbol ?? currencyCode;
  const decimals = currency?.decimals ?? 2;
  return `${symbol}${amount.toFixed(decimals)}`;
}
