import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function multiFormatDate(inputDate: string = ''): string {
  const timestampNum = Math.round(new Date(inputDate).getTime() / 1000);
  const date: Date = new Date(timestampNum * 1000);
  const now: Date = new Date();
  const timeDifference = now.getTime() - date.getTime();
  const secondsDifference = Math.floor(timeDifference / 1000);
  const minutesDifference = Math.floor(secondsDifference / 60);
  const hoursDifference = Math.floor(minutesDifference / 60);
  const daysDifference = Math.floor(hoursDifference / 24);

  if (secondsDifference < 60) {
    return `${secondsDifference} seconds ago`;
  }

  if (minutesDifference < 60) {
    return `${minutesDifference} minutes ago`;
  }

  if (hoursDifference < 24) {
    return `${hoursDifference} hours ago`;
  }

  return `${daysDifference} days ago`;
}
