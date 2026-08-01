// app/admin/lib/api.ts — Central fetch wrapper for all admin API calls.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') || '';
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/admin${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
    }
    throw new Error((data as { message?: string }).message || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const adminAPI = {
  getOverview:       () => adminFetch<Record<string, unknown>>('/overview'),

  getStudents:       (p?: Record<string, string>) => adminFetch<unknown[]>(`/students${p ? '?'+new URLSearchParams(p) : ''}`),
  addStudent:        (b: unknown) => adminFetch('/students', { method:'POST', body:JSON.stringify(b) }),
  updateStudent:     (id: string, b: unknown) => adminFetch(`/students/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deactivateStudent: (id: string) => adminFetch(`/students/${id}`, { method:'DELETE' }),

  getStaff:          (p?: Record<string, string>) => adminFetch<unknown[]>(`/staff${p ? '?'+new URLSearchParams(p) : ''}`),
  addStaff:          (b: unknown) => adminFetch('/staff', { method:'POST', body:JSON.stringify(b) }),
  updateStaff:       (id: string, b: unknown) => adminFetch(`/staff/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deactivateStaff:   (id: string) => adminFetch(`/staff/${id}`, { method:'DELETE' }),

  getExpenses:       (p?: Record<string, string>) => adminFetch<unknown[]>(`/expenses${p ? '?'+new URLSearchParams(p) : ''}`),
  addExpense:        (b: unknown) => adminFetch('/expenses', { method:'POST', body:JSON.stringify(b) }),
  updateExpense:     (id: string, b: unknown) => adminFetch(`/expenses/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deleteExpense:     (id: string) => adminFetch(`/expenses/${id}`, { method:'DELETE' }),

  getKPIs:           (year?: number) => adminFetch<unknown[]>(`/finance/kpis${year ? '?year='+year : ''}`),
  upsertKPI:         (b: unknown) => adminFetch('/finance/kpis', { method:'POST', body:JSON.stringify(b) }),

  getPosts:          (p?: Record<string, string>) => adminFetch<unknown[]>(`/posts${p ? '?'+new URLSearchParams(p) : ''}`),
  addPost:           (b: unknown) => adminFetch('/posts', { method:'POST', body:JSON.stringify(b) }),
  reviewPost:        (id: string, b: unknown) => adminFetch(`/posts/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deletePost:        (id: string) => adminFetch(`/posts/${id}`, { method:'DELETE' }),

  getAuditLogs:      (p?: Record<string, string>) => adminFetch<{ logs: unknown[]; total: number }>(`/audit-logs${p ? '?'+new URLSearchParams(p) : ''}`),

  getReportSummary:  (p?: Record<string, string>) => adminFetch<Record<string, unknown>>(`/reports/summary${p ? '?'+new URLSearchParams(p) : ''}`),

  getFeedback:       (p?: Record<string, string>) => adminFetch<unknown[]>(`/feedback${p ? '?'+new URLSearchParams(p) : ''}`),
  addFeedback:       (b: unknown) => adminFetch('/feedback', { method:'POST', body:JSON.stringify(b) }),
  reviewFeedback:    (id: string, b: unknown) => adminFetch(`/feedback/${id}`, { method:'PUT', body:JSON.stringify(b) }),

  getGrievances:     (p?: Record<string, string>) => adminFetch<unknown[]>(`/grievances${p ? '?'+new URLSearchParams(p) : ''}`),
  addGrievance:      (b: unknown) => adminFetch('/grievances', { method:'POST', body:JSON.stringify(b) }),
  updateGrievance:   (id: string, b: unknown) => adminFetch(`/grievances/${id}`, { method:'PUT', body:JSON.stringify(b) }),

  getCalendarEvents: (p?: Record<string, string>) => adminFetch<unknown[]>(`/calendar/events${p ? '?'+new URLSearchParams(p) : ''}`),
  addCalendarEvent:  (b: unknown) => adminFetch('/calendar/events', { method:'POST', body:JSON.stringify(b) }),
  deleteCalendarEvent:(id: string) => adminFetch(`/calendar/events/${id}`, { method:'DELETE' }),

  // Community — Pending moderation queue
  getPendingPosts:    (p?: Record<string, string>) => adminFetch<unknown[]>(`/community/pending${p ? '?'+new URLSearchParams(p) : ''}`),
  reviewPendingPost:  (id: string, b: unknown) => adminFetch(`/community/pending/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deletePendingPost:  (id: string) => adminFetch(`/community/pending/${id}`, { method:'DELETE' }),

  // Community — Live feed
  getLivePosts:       (p?: Record<string, string>) => adminFetch<unknown[]>(`/community/posts${p ? '?'+new URLSearchParams(p) : ''}`),
  createLivePost:     (b: unknown) => adminFetch('/community/posts', { method:'POST', body:JSON.stringify(b) }),
  updateLivePost:     (id: string, b: unknown) => adminFetch(`/community/posts/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deleteLivePost:     (id: string) => adminFetch(`/community/posts/${id}`, { method:'DELETE' }),
  togglePinPost:      (id: string) => adminFetch(`/community/posts/${id}/pin`, { method:'PUT' }),

  // Activities — Pending
  getPendingActivities:   (p?: Record<string, string>) => adminFetch<unknown[]>(`/activities/pending${p ? '?'+new URLSearchParams(p) : ''}`),
  reviewPendingActivity:  (id: string, b: unknown) => adminFetch(`/activities/pending/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deletePendingActivity:  (id: string) => adminFetch(`/activities/pending/${id}`, { method:'DELETE' }),

  // Activities — Live
  getActivities:    (p?: Record<string, string>) => adminFetch<unknown[]>(`/activities${p ? '?'+new URLSearchParams(p) : ''}`),
  createActivity:   (b: unknown) => adminFetch('/activities', { method:'POST', body:JSON.stringify(b) }),
  updateActivity:   (id: string, b: unknown) => adminFetch(`/activities/${id}`, { method:'PUT', body:JSON.stringify(b) }),
  deleteActivity:   (id: string) => adminFetch(`/activities/${id}`, { method:'DELETE' }),

  // Complaints
  getComplaints:     (p?: Record<string, string>) => adminFetch<unknown[]>(`/complaints${p ? '?'+new URLSearchParams(p) : ''}`),
  resolveComplaint:  (id: string, b: unknown) => adminFetch(`/complaints/${id}/resolve`, { method:'PUT', body:JSON.stringify(b) }),
  escalateComplaint: (id: string, b: unknown) => adminFetch(`/complaints/${id}/escalate`, { method:'PUT', body:JSON.stringify(b) }),
  deleteComplaint:   (id: string) => adminFetch(`/complaints/${id}`, { method:'DELETE' }),
};
