import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { AgentTask, AgentTaskSource, AgentTaskStatus, AgentTaskSummary } from '../models/agent-task.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AgentTaskService {
  private api = inject(ApiClient);

  getAll(
    page = 0,
    size = 10,
    sort = 'createdAt,desc',
    source?: AgentTaskSource,
    status?: AgentTaskStatus,
  ): Observable<Page<AgentTask>> {
    return this.api.get('/agent-tasks', {
      query: { page, size, sort, source: source || undefined, status: status || undefined },
    });
  }

  getById(id: number): Observable<AgentTask> {
    return this.api.get('/agent-tasks/{id}', { path: { id } });
  }

  getSummary(): Observable<AgentTaskSummary[]> {
    return this.api.get('/agent-tasks/summary');
  }

  resetAll(): Observable<{ reset: number }> {
    return this.api.post('/agent-tasks/reset', { body: {} });
  }
}
