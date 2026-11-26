import type {
  ActivityLog,
  Application,
  InitialApplicationStatus,
  WorkMode,
} from "../types/application";

export interface CreateApplicationInput {
  company: string;
  role: string;
  status: InitialApplicationStatus;
  requiredSkills: string[];
  workMode: WorkMode;
  cvVersion?: string;
  appliedDate?: string;
}

export interface SkillMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function isDuplicateApplication(
  applications: readonly Application[],
  company: string,
  role: string,
  excludeId?: string,
): boolean {
  const normalizedCompany = normalize(company);
  const normalizedRole = normalize(role);

  return applications.some(
    (application) =>
      application.id !== excludeId &&
      normalize(application.company) === normalizedCompany &&
      normalize(application.role) === normalizedRole,
  );
}

export function createApplication(
  applications: readonly Application[],
  input: CreateApplicationInput,
  now = new Date(),
): Application {
  const company = input.company.trim();
  const role = input.role.trim();

  if (!company || !role) {
    throw new Error("Company and role are required.");
  }

  if (isDuplicateApplication(applications, company, role)) {
    throw new Error("An application for this company and role already exists.");
  }

  if (
    input.status === "APPLIED" &&
    (!input.cvVersion?.trim() || !input.appliedDate?.trim())
  ) {
    throw new Error("CV version and applied date are required for APPLIED.");
  }

  const timestamp = now.toISOString();
  const activityLog: ActivityLog = {
    id: crypto.randomUUID(),
    timestamp,
    message: `Application created with status ${input.status}.`,
  };

  return {
    id: crypto.randomUUID(),
    company,
    role,
    status: input.status,
    requiredSkills: [...input.requiredSkills],
    workMode: input.workMode,
    ...(input.cvVersion === undefined ? {} : { cvVersion: input.cvVersion }),
    ...(input.appliedDate === undefined ? {} : { appliedDate: input.appliedDate }),
    lastUpdatedAt: timestamp,
    checklist: [],
    activityLogs: [activityLog],
  };
}

export function getSkillMatch(
  requiredSkills: readonly string[],
  captainSkills: readonly string[],
): SkillMatch {
  const captainSkillSet = new Set(captainSkills.map(normalize));
  const matchedSkills = requiredSkills.filter((skill) =>
    captainSkillSet.has(normalize(skill)),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !captainSkillSet.has(normalize(skill)),
  );

  return {
    score:
      requiredSkills.length === 0
        ? 0
        : Math.round((matchedSkills.length / requiredSkills.length) * 100),
    matchedSkills,
    missingSkills,
  };
}

export function addCaptainSkill(
  captainSkills: readonly string[],
  skill: string,
): string[] {
  const normalizedSkill = normalize(skill);
  if (!normalizedSkill) {
    throw new Error("A skill cannot be empty.");
  }

  if (
    captainSkills.some(
      (existingSkill) => normalize(existingSkill) === normalizedSkill,
    )
  ) {
    throw new Error(`The skill "${skill.trim()}" is already in the profile.`);
  }

  return [...captainSkills, skill.trim()];
}

export function removeCaptainSkill(
  captainSkills: readonly string[],
  skill: string,
): string[] {
  const normalizedSkill = normalize(skill);
  return captainSkills.filter(
    (existingSkill) => normalize(existingSkill) !== normalizedSkill,
  );
}
