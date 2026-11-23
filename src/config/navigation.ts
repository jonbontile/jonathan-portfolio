/**
 * Site navigation.
 *
 * Follows the RECOMMENDED sitemap (reconciliation D1), which still needs owner
 * approval. Most of these pages don't exist yet, so this navigation is used only
 * on preview pages until Phase 4.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: 'About', href: '/about/' },
  { label: 'Services', href: '/services/' },
  { label: 'Experience', href: '/experience/' },
  { label: 'Qualifications', href: '/qualifications/' },
  { label: 'Case studies', href: '/case-studies/' },
];

export const primaryCta: NavItem = { label: 'Discuss a project', href: '/contact/' };

export const footerNav: NavItem[] = [...primaryNav, { label: 'Contact', href: '/contact/' }, { label: 'Privacy', href: '/privacy/' }];
