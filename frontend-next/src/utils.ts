import { hoursToMilliseconds, millisecondsToHours } from "date-fns";
import config from "./config/config.json";

const claim_duration_in_ms = hoursToMilliseconds(
  config.claim_duration_in_hours
);

export const dateFormat = (date: Date) => {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  } as const;
  const _date = new Date(date);
  return new Intl.DateTimeFormat(undefined, options).format(_date);
};

export const dateFormatGeneral = (date: Date | null, stringFormat: boolean) => {
  if (!date) return null;
  const _date = dateFormat(date).split("/");
  const { day, month, year } = {
    day: _date[0],
    month: _date[1],
    year: _date[2],
  };
  if (stringFormat) {
    return `${year}-${month}-${day}`;
  }
  return { day, month, year };
};
// export const dateFormatGeneral = (date: Date | null, stringFormat: boolean) => {
//   if (!date) return null;
//   const _date = new Date(date);
//   const { day, month, year } = {
//     day: _date.getUTCDate(),
//     month: _date.getUTCMonth() + 1,
//     year: _date.getUTCFullYear(),
//   };
//   if (stringFormat) {
//     return `${year}-${month}-${day}`;
//   }
//   return { day, month, year };
// };

export const getTimeLeft = (date: Date | null): number | null => {
  if (!date) {
    return null;
  }
  const now = new Date().getTime();
  const givenDate = new Date(date).getTime();
  const expiryDate = givenDate + claim_duration_in_ms;
  if (expiryDate < now) {
    return null;
  }
  const timeLeft = millisecondsToHours(givenDate - now);
  return timeLeft;
};

export const getTimeLeftText = (date: Date | null) => {
  if (!date) {
    return "no timestamp found";
  }
  const hours = getTimeLeft(date);
  if (!hours) {
    return "expired";
  }
  return `${hours} hours left`;
};

const wordsFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
});

export const getCount = (item: number | string) => {
  const formattedItem = typeof item === "string" ? item.length : item;
  return wordsFormat.format(formattedItem);
};
