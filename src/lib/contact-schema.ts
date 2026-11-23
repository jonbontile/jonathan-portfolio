/**
 * Contact form rules, shared by the browser form (attributes and client
 * validation) and, in Phase 5, the Worker's server-side validation
 * (docs: SECURITY_AND_PRIVACY.md section 2).
 */
import { inquiryTypes } from './labels';

export const contactLimits = {
  name: { min: 1, max: 100 },
  email: { max: 254 },
  company: { max: 150 },
  subject: { max: 150 },
  message: { min: 20, max: 5000 },
} as const;

export const inquiryValues = inquiryTypes.map((t) => t.value) as readonly string[];

export interface ContactInput {
  name: string;
  email: string;
  inquiryType: string;
  company?: string;
  subject?: string;
  message: string;
  privacy: boolean;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns field errors in plain language. An empty object means valid. */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > contactLimits.name.max) errors.name = `Use ${contactLimits.name.max} characters or fewer.`;

  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > contactLimits.email.max || !EMAIL.test(email))
    errors.email = 'Enter an email address in the format name@example.com.';

  if (!inquiryValues.includes(input.inquiryType)) errors.inquiryType = 'Choose what your inquiry is about.';

  if ((input.company ?? '').length > contactLimits.company.max)
    errors.company = `Use ${contactLimits.company.max} characters or fewer.`;
  if ((input.subject ?? '').length > contactLimits.subject.max)
    errors.subject = `Use ${contactLimits.subject.max} characters or fewer.`;

  if (!message) errors.message = 'Enter a message.';
  else if (message.length < contactLimits.message.min)
    errors.message = `Add a little more detail: at least ${contactLimits.message.min} characters.`;
  else if (message.length > contactLimits.message.max)
    errors.message = `Shorten your message to ${contactLimits.message.max} characters or fewer.`;

  if (!input.privacy) errors.privacy = 'Confirm you have read the privacy notice.';

  return errors;
}
