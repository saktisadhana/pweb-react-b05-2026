import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
} from "../types/application";

const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  WISHLIST: ["APPLIED", "REJECTED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ["SCREENING"],
};

type TransitionFields = Pick<
  Application,
  "cvVersion" | "appliedDate" | "interviewDateTime" | "salaryOffer" | "workMode"
>;

export function getAllowedTransitions(
  status: ApplicationStatus,
): readonly ApplicationStatus[] {
  return TRANSITIONS[status];
}

function createActivityLog(message: string, timestamp: string): ActivityLog {
  return { id: crypto.randomUUID(), timestamp, message };
}

export function transitionApplication(
  application: Application,
  nextStatus: ApplicationStatus,
  fields: Partial<TransitionFields> = {},
  now = new Date(),
): Application {
  if (!getAllowedTransitions(application.status).includes(nextStatus)) {
    throw new Error(
      `Status ${application.status} tidak bisa pindah ke ${nextStatus}.`,
    );
  }

  const updatedFields = { ...application, ...fields };
  if (
    nextStatus === "APPLIED" &&
    (!updatedFields.cvVersion?.trim() || !updatedFields.appliedDate?.trim())
  ) {
    throw new Error("Versi CV dan tanggal melamar wajib diisi untuk status APPLIED.");
  }

  if (
    nextStatus === "INTERVIEW" &&
    (!updatedFields.interviewDateTime ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
        updatedFields.interviewDateTime,
      ) ||
      Number.isNaN(Date.parse(updatedFields.interviewDateTime)))
  ) {
    throw new Error(
      "Jadwal interview wajib diisi dengan format YYYY-MM-DDTHH:mm.",
    );
  }

  if (
    nextStatus === "OFFER" &&
    (!(updatedFields.salaryOffer && updatedFields.salaryOffer > 0) ||
      !updatedFields.workMode)
  ) {
    throw new Error("Uang saku (lebih dari 0) dan mode kerja wajib diisi untuk status OFFER.");
  }

  const timestamp = now.toISOString();
  const activityLog = createActivityLog(
    `Status berubah dari ${application.status} ke ${nextStatus}.`,
    timestamp,
  );

  return {
    ...updatedFields,
    status: nextStatus,
    lastUpdatedAt: timestamp,
    activityLogs: [...application.activityLogs, activityLog],
  };
}

export function addApplicationNote(
  application: Application,
  note: string,
  now = new Date(),
): Application {
  const message = note.trim();
  if (!message) {
    throw new Error("Catatan tidak boleh kosong.");
  }

  const timestamp = now.toISOString();
  return {
    ...application,
    activityLogs: [
      ...application.activityLogs,
      createActivityLog(message, timestamp),
    ],
  };
}

export function addChecklistItem(
  application: Application,
  text: string,
): Application {
  const itemText = text.trim();
  if (!itemText) {
    throw new Error("Item checklist tidak boleh kosong.");
  }

  const item: ChecklistItem = {
    id: crypto.randomUUID(),
    text: itemText,
    done: false,
  };

  return { ...application, checklist: [...application.checklist, item] };
}

export function toggleChecklistItem(
  application: Application,
  itemId: string,
): Application {
  let found = false;
  const checklist = application.checklist.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    found = true;
    return { ...item, done: !item.done };
  });

  if (!found) {
    throw new Error(`Item checklist "${itemId}" tidak ditemukan.`);
  }

  return { ...application, checklist };
}

export function removeChecklistItem(
  application: Application,
  itemId: string,
): Application {
  if (!application.checklist.some((item) => item.id === itemId)) {
    throw new Error(`Item checklist "${itemId}" tidak ditemukan.`);
  }

  return {
    ...application,
    checklist: application.checklist.filter((item) => item.id !== itemId),
  };
}

export function getChecklistProgress(
  checklist: readonly ChecklistItem[],
): { completed: number; total: number; percentage: number } {
  const completed = checklist.filter((item) => item.done).length;
  const total = checklist.length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
