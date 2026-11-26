import type { JobListing } from "../types/job";
import type { WorkMode } from "../types/application";

const REMOTIVE_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
const FALLBACK_URL = "/magang-fallback.json";

export type JobSource = "remotive" | "fallback";

// Bentuk response Remotive: { "jobs": [ ...lowongan ] }
interface RemotiveResponse {
  jobs: JobListing[];
}

export async function fetchJobs(
  source: JobSource,
  signal: AbortSignal,
): Promise<JobListing[]> {
  const url = source === "remotive" ? REMOTIVE_URL : FALLBACK_URL;

  // signal dari AbortController: kalau komponen batal/ganti sumber, request ini ikut dibatalkan
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Gagal mengambil data lowongan (status ${res.status})`);
  }

  const data: RemotiveResponse | JobListing[] = await res.json();

  // Jaga-jaga kalau file fallback berupa array langsung, bukan { jobs: [...] }
  if (Array.isArray(data)) {
    return data;
  }
  return data.jobs;
}

// Menebak mode kerja dari teks lokasi, misal "Surabaya (Hybrid)"
export function guessWorkMode(location: string): WorkMode {
  const text = location.toLowerCase();
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("onsite") || text.includes("on-site")) return "Onsite";
  return "Remote";
}