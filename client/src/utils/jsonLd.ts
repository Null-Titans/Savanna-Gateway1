import { JobPosting } from '../types/gateway';

/**
 * Emits valid schema.org/JobPosting JSON-LD (Level 3 delivery criteria).
 * Uses documented schema.org fields (additionalProperty + description) for
 * workplace accessibility and accommodation details — never invents invalid schema fields.
 */
export function buildJobPostingJsonLd(job: JobPosting): Record<string, unknown> {
  const accommodationSummary = job.accommodationsOffered.join('; ');
  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: `${job.descriptionSummary} Workplace accommodations offered: ${accommodationSummary}. Work environment: ${job.accommodationDetails.workEnvironmentAccessibility}. Interview accommodations: ${job.accommodationDetails.interviewAccommodations}.`,
    datePosted: job.postedAtIso.split('T')[0],
    ...(job.applicationDeadline ? { validThrough: job.applicationDeadline } : {}),
    employmentType: job.employmentType.toUpperCase().replace('-', '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.organization,
    },
    jobLocationType: job.isRemote ? 'TELECOMMUTE' : undefined,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    skills: job.requiredSkills.join(', '),
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'accommodationsOffered',
        value: accommodationSummary,
      },
      {
        '@type': 'PropertyValue',
        name: 'workEnvironmentAccessibility',
        value: job.accommodationDetails.workEnvironmentAccessibility,
      },
      {
        '@type': 'PropertyValue',
        name: 'assistiveTechnologyAvailable',
        value: job.accommodationDetails.assistiveTechnologyAvailable,
      },
      {
        '@type': 'PropertyValue',
        name: 'interviewAccommodations',
        value: job.accommodationDetails.interviewAccommodations,
      },
      {
        '@type': 'PropertyValue',
        name: 'applicationProcessAccommodations',
        value: job.accommodationDetails.applicationProcessAccommodations,
      },
    ],
  };
}
