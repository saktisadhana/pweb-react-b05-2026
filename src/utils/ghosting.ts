import type { Application } from "../types/application";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;
const GHOSTING_THRESHOLD_DAYS = 14;

export function isAtRiskOfGhosting(
  application: Application,
  now = new Date(),
): boolean {
  if (application.status !== "APPLIED" && application.status !== "SCREENING") {
    return false;
  }

  const lastUpdatedTime = Date.parse(application.lastUpdatedAt);
  const currentTime = now.getTime();
  if (Number.isNaN(lastUpdatedTime) || Number.isNaN(currentTime)) {
    throw new RangeError("Ghosting checks require valid dates.");
  }

  return (
    currentTime - lastUpdatedTime >
    GHOSTING_THRESHOLD_DAYS * DAY_IN_MILLISECONDS
  );
}

export function ageApplicationForGhosting(
  application: Application,
  days = 15,
): Application {
  if (application.status !== "APPLIED" && application.status !== "SCREENING") {
    throw new Error("Simulasi +15 hari hanya untuk status APPLIED atau SCREENING.");
  }

  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError("The number of days must be a positive finite number.");
  }

  const lastUpdatedTime = Date.parse(application.lastUpdatedAt);
  if (Number.isNaN(lastUpdatedTime)) {
    throw new RangeError("The application has an invalid lastUpdatedAt date.");
  }

  return {
    ...application,
    lastUpdatedAt: new Date(
      lastUpdatedTime - days * DAY_IN_MILLISECONDS,
    ).toISOString(),
  };
}
