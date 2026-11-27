import type { Application } from "../types/application";

export interface InterviewConflict {
  firstApplication: Application;
  secondApplication: Application;
  differenceMinutes: number;
}

export function findInterviewConflicts(
  applications: readonly Application[],
  thresholdMinutes = 60,
): InterviewConflict[] {
  if (!Number.isFinite(thresholdMinutes) || thresholdMinutes <= 0) {
    throw new RangeError("The conflict threshold must be a positive number.");
  }

  const interviews = applications
    .filter((application) => application.status === "INTERVIEW")
    .map((application) => {
      if (!application.interviewDateTime) {
        throw new Error(
          `Lamaran INTERVIEW "${application.company}" belum punya jadwal interview.`,
        );
      }

      const scheduledTime = Date.parse(application.interviewDateTime);
      if (Number.isNaN(scheduledTime)) {
        throw new RangeError(
          `Jadwal interview "${application.company}" tidak valid.`,
        );
      }

      return { application, scheduledTime };
    })
    .sort((left, right) => left.scheduledTime - right.scheduledTime);

  const conflicts: InterviewConflict[] = [];
  for (let firstIndex = 0; firstIndex < interviews.length; firstIndex += 1) {
    const first = interviews[firstIndex];
    if (!first) {
      continue;
    }

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < interviews.length;
      secondIndex += 1
    ) {
      const second = interviews[secondIndex];
      if (!second) {
        continue;
      }

      const differenceMinutes =
        (second.scheduledTime - first.scheduledTime) / (60 * 1_000);
      if (differenceMinutes >= thresholdMinutes) {
        break;
      }

      conflicts.push({
        firstApplication: first.application,
        secondApplication: second.application,
        differenceMinutes,
      });
    }
  }

  return conflicts;
}

export function hasInterviewConflict(
  applications: readonly Application[],
  thresholdMinutes = 60,
): boolean {
  return findInterviewConflicts(applications, thresholdMinutes).length > 0;
}
