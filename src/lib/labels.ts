/** Human-readable labels shared by every page. Meaning is always in words. */
export const engagementLabel = {
  employment: 'Employment',
  freelance: 'Freelance',
  'business-ownership': 'Business ownership',
  independent: 'Independent project',
} as const;

export const progressLabel = { ongoing: 'Ongoing', completed: 'Completed' } as const;

export const qualificationKindLabel = {
  license: 'License',
  certification: 'Certification',
  degree: 'Degree',
  training: 'Training',
} as const;

export const inquiryTypes = [
  { value: 'freelance-services', label: 'Freelance bookkeeping or accounting services' },
  { value: 'reporting-analysis', label: 'Financial reporting and analysis' },
  { value: 'employment', label: 'Employment opportunity' },
  { value: 'recruitment', label: 'Recruitment inquiry' },
  { value: 'other', label: 'Other professional inquiry' },
] as const;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2027-07" -> "Jul 2027"; "2027" -> "2027". */
export function formatYearMonth(value: string): string {
  const [year, month] = value.split('-');
  return month ? `${months[Number(month) - 1]} ${year}` : year;
}

/** The date line for a qualification card, e.g. "2026 · Valid until Jul 2027" or "In progress, expected 2029". */
export function qualificationDates(q: { year?: number; inProgress: boolean; expires?: string }): string | undefined {
  if (q.inProgress) return q.year ? `In progress, expected ${q.year}` : 'In progress';
  const parts = [q.year?.toString(), q.expires && `Valid until ${formatYearMonth(q.expires)}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}
