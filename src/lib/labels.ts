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
