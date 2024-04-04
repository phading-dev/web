export function formatSecondsAsHHMMSS(seconds: number): string {
  let roundedSeconds = Math.round(seconds);
  let secondsStr = (roundedSeconds % 60).toString().padStart(2, "0");
  let minutesStr = (Math.floor(roundedSeconds / 60) % 60)
    .toString()
    .padStart(2, "0");
  let hours = Math.floor(roundedSeconds / 60 / 60);
  if (hours == 0) {
    return `${minutesStr}:${secondsStr}`;
  } else {
    return `${hours.toString().padStart(2, "0")}:${minutesStr}:${secondsStr}`;
  }
}
