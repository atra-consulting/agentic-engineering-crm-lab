import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { CronJob, CronRun } from '../models/cron.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class CronService {
  private api = inject(ApiClient);

  getJobs(): Observable<CronJob[]> {
    return this.api.get('/cron/jobs');
  }

  getRuns(page = 0, size = 20, job?: string): Observable<Page<CronRun>> {
    return this.api.get('/cron/runs', { query: { page, size, job: job || undefined } });
  }

  /**
   * Map a cron job name to its trigger endpoint. Each job dispatches a different
   * GitHub Actions workflow, so they have separate endpoints.
   */
  private static readonly TRIGGER_ENDPOINTS: Record<string, '/cron/agent-tasks' | '/cron/github-issues'> = {
    'solve-tasks': '/cron/agent-tasks',
    'solve-github-issues': '/cron/github-issues',
  };

  triggerNow(job = 'solve-tasks'): Observable<CronRun> {
    const path = CronService.TRIGGER_ENDPOINTS[job] ?? '/cron/agent-tasks';
    return this.api.get(path);
  }
}
