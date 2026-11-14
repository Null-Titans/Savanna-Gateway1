import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { JobService } from '../../src/modules/jobs/job.service.js';
import { Application } from '../../src/modules/jobs/application.model.js';

describe('Integration: Career Gateway & Privacy Boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/jobs returns paginated job postings filterable by accommodations', async () => {
    vi.spyOn(JobService, 'listJobs').mockResolvedValue({
      jobs: [
        {
          id: 'job_sample_01',
          title: 'Remote Accessibility Quality Analyst',
          organization: 'Savanna Inclusive Tech',
          location: 'Remote',
          isRemote: true,
          employmentType: 'Full-time',
          descriptionSummary: 'Audit digital interfaces for WCAG 2.1 compliance.',
          requiredSkills: ['Screen Readers', 'A11y'],
          accommodationCategories: ['remote_flexible', 'screen_reader_tools'],
          accommodationsOffered: ['NVDA, JAWS licenses provided', 'Flexible hours'],
          accommodationDetails: {
            workEnvironmentAccessibility: '100% remote asynchronous',
            remoteOrFlexibleArrangements: 'Core hours not required',
            assistiveTechnologyAvailable: 'Screen readers, braille displays',
            communicationOptions: 'Slack, Email, Captioning',
            interviewAccommodations: 'Questions sent 24h prior',
            applicationProcessAccommodations: 'Plain-text application',
            additionalSupportOffered: 'Dedicated peer mentor',
          },
          postedAtIso: new Date().toISOString(),
          isDemoData: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const res = await request(app)
      .get('/api/v1/jobs?q=Accessibility&accommodations=remote_flexible');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Remote Accessibility Quality Analyst');
    expect(res.body.meta.total).toBe(1);
  });

  it('rejects job listings violating Addendum D4 safeguards (asking for medical proof/diagnosis)', async () => {
    const prohibitedJob = {
      title: 'Support Agent',
      organization: 'Tech Org',
      location: 'Addis Ababa',
      descriptionSummary: 'Applicants must supply doctor diagnosis letter and medical proof.',
    };

    const res = await request(app)
      .post('/api/v1/jobs')
      .send(prohibitedJob);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Safeguard violation/i);
    expect(res.body.message).toMatch(/prohibited under accessibility safeguards/i);
  });

  it('records job application and strictly verifies privacy view segregation for employers', async () => {
    vi.spyOn(JobService, 'submitApplication').mockResolvedValue({
      id: 'app_rec_001',
      submittedAtIso: new Date().toISOString(),
      mode: 'real',
      persistedToServer: true,
      notice: 'Application received.',
    });

    const applicationDraft = {
      applicantName: 'Tigist Alemu',
      contactValue: 'tigist@example.org',
      relevantExperience: '3 years in accessibility testing',
      shareAccommodationRequest: true,
      accommodationRequestNote: 'Requires JAWS screen reader license and written interview prompts',
      explicitConsentToShare: false, // Consent NOT granted to share note with employer
    };

    const res = await request(app)
      .post('/api/v1/jobs/507f191e810c19729de860ea/applications')
      .send(applicationDraft);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'app_rec_001');
    expect(res.body.success).toBe(true);

    // Verify Application schema model privacy method directly:
    // When explicitConsentToShare is false, accommodation notes MUST NOT leak to employer
    const appDoc = new Application({
      jobId: '507f191e810c19729de860ea',
      applicantName: 'Tigist Alemu',
      contactValue: 'tigist@example.org',
      relevantExperience: '3 years in accessibility testing',
      shareAccommodationRequest: true,
      accommodationRequestNote: 'Confidential accommodation request',
      explicitConsentToShare: false, // No explicit consent
    });

    const employerView = appDoc.toEmployerSafeView();
    expect(employerView.accommodationRequestNote).toBeUndefined();
    expect(employerView.hasAccommodationRequest).toBe(true);

    // When explicit consent IS granted:
    appDoc.explicitConsentToShare = true;
    const consentedView = appDoc.toEmployerSafeView();
    expect(consentedView.accommodationRequestNote).toBe('Confidential accommodation request');
  });
});
