import Intl from "intl";

const currencyFormatter0 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});
const currencyFormatter2 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
const currencyFormatter3 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});
const currencyFormatter4 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

export const formatCurrency = (price: number): string => {
  if (price) {
    if (price < 1) {
      return currencyFormatter4.format(price);
    }
    if (price > 1 && price < 20) {
      return currencyFormatter3.format(price);
    }
    if (price > 1000) {
      return currencyFormatter0.format(price);
    }
    return currencyFormatter2.format(price);
  }
  return "N/A";
};

export const tweetTimestamp = (num: number): string => {
  const date = new Date(num * 1000);
  const duration = (Date.now() - date.getTime()) / 1000;
  return `${date.toUTCString()} (${duration}s ago)`;
};

export const cardTimestamp = (num: number): string => {
  const date = new Date(num * 1000);
  const month = (date.getUTCMonth() < 10 ? "0" : "") + date.getUTCMonth();
  const day = (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate();
  const year = date.getUTCFullYear();
  const hours = (date.getUTCHours() < 10 ? "0" : "") + date.getUTCHours();
  const minutes = (date.getUTCMinutes() < 10 ? "0" : "") + date.getUTCMinutes();
  const seconds = (date.getUTCSeconds() < 10 ? "0" : "") + date.getUTCSeconds();
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};
