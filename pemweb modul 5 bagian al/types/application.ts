export const APPLICATION_STATUSES = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type InitialApplicationStatus = "WISHLIST" | "APPLIED";

export const WORK_MODES = ["Remote", "Hybrid", "Onsite"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  lastUpdatedAt: string;
  checklist: ChecklistItem[];
  activityLogs: ActivityLog[];
}
