export interface JobListing {
  id: string | number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string | null;
  tags: string[];
}
