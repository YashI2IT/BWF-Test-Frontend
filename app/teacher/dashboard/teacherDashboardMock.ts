/**
 * Demo data for Teacher Dashboard (same idea as Warden dashboard mock charts).
 * Shown when there is no API session so the UI stays usable for demos / reviews.
 */
import type {
  AssignmentProgressResponse,
  StudentOverview,
  TeacherDashboardResponse,
} from "../types";

export const MOCK_TEACHER_DASHBOARD: TeacherDashboardResponse = {
  students: [
    { _id: "s1", auth_id: "BWF-2026-1", name: "Ravi Kumar", class: "10th Grade" },
    { _id: "s2", auth_id: "BWF-2026-2", name: "Priya Sharma", class: "9th Grade" },
    { _id: "s3", auth_id: "BWF-2026-3", name: "Amit Patel", class: "10th Grade" },
  ],
  resources: [
    { _id: "r1", key: "library", value: "https://library.bwf.edu" },
    { _id: "r2", key: "syllabus", value: "https://drive.google.com/bwf/syllabus.pdf" },
    { _id: "r3", key: "contactMentor", value: "mailto:mentor@bwf.edu" },
  ],
  pendingSubmissions: [
    {
      _id: "sub1",
      student_auth_id: "BWF-2026-1",
      submissionText: "Attached my final draft for the science project.",
      status: "pending",
      rejectionNote: "",
      assignment_id: {
        _id: "a1",
        title: "Science Project Draft",
        subject: "Science",
        dueDate: "2026-05-01",
      },
    },
    {
      _id: "sub2",
      student_auth_id: "BWF-2026-2",
      submissionText: "Here is the math worksheet 12.",
      status: "pending",
      rejectionNote: "",
      assignment_id: {
        _id: "a2",
        title: "Math Worksheet 12",
        subject: "Math",
        dueDate: "2026-05-02",
      },
    },
  ],
  assignmentProgressData: [
    { month: 'Jan', completed: 45, pending: 12 },
    { month: 'Feb', completed: 52, pending: 8 },
    { month: 'Mar', completed: 48, pending: 15 },
    { month: 'Apr', completed: 61, pending: 10 },
    { month: 'May', completed: 55, pending: 20 },
    { month: 'Jun', completed: 68, pending: 5 },
  ],
  moodBreakdown: [
    { name: 'Happy', value: 65, fill: '#10b981' },
    { name: 'Okay', value: 25, fill: '#f59e0b' },
    { name: 'Help', value: 10, fill: '#ef4444' },
  ],
  trackerData: [
    { name: 'S', value: 15 },
    { name: 'M', value: 25 },
    { name: 'T', value: 45 },
    { name: 'W', value: 30 },
    { name: 'T', value: 50 },
    { name: 'F', value: 20 },
    { name: 'S', value: 10 },
  ],
  todaySchedule: [
    { time: '09:00 AM', title: '10th Grade Math', location: 'Room 302', color: 'indigo' },
    { time: '11:30 AM', title: 'Science Lab', location: 'Biology Lab', color: 'emerald' },
    { time: '02:00 PM', title: 'Staff Meeting', location: 'Conf. Room B', color: 'orange' },
  ],
  dailyTasks: [
    { id: 't1', title: 'Review Math Assignments', status: 'completed' },
    { id: 't2', title: 'Prepare Science Quiz', status: 'due_today' },
    { id: 't3', title: 'Update Syllabus', status: 'tomorrow' },
  ],
  classProgress: { assignments: 64, reviewed: 12, passed: 10 }
};

const MOCK_OVERVIEWS: Record<string, StudentOverview> = {
  "BWF-2026-1": {
    student: MOCK_TEACHER_DASHBOARD.students[0],
    assignments: [
      {
        _id: "demo-a1",
        title: "English Essay — Environment",
        subject: "English",
        dueDate: "2026-05-12",
        priority: "high",
      },
      {
        _id: "demo-a2",
        title: "Math Practice Set 4",
        subject: "Mathematics",
        dueDate: "2026-05-15",
        priority: "medium",
      },
    ],
    submissions: [],
    moods: [
      { _id: "demo-m1", mood: "happy", date: "2026-05-05", note: "" },
      { _id: "demo-m2", mood: "okay", date: "2026-05-04", note: "" },
      { _id: "demo-m3", mood: "need_help", date: "2026-05-03", note: "Group work stress" },
    ],
    journals: [
      {
        _id: "demo-j1",
        text: "Today we planned the presentation. I feel more confident after speaking with the mentor.",
        createdAt: "2026-05-05T10:00:00.000Z",
      },
    ],
  },
  "BWF-2026-2": {
    student: MOCK_TEACHER_DASHBOARD.students[1],
    assignments: [
      {
        _id: "demo-b1",
        title: "Science — Plant Cell Diagram",
        subject: "Science",
        dueDate: "2026-05-14",
        priority: "high",
      },
    ],
    submissions: [],
    moods: [{ _id: "demo-m4", mood: "okay", date: "2026-05-05", note: "" }],
    journals: [
      {
        _id: "demo-j2",
        text: "Read chapter 3. Need help with vocabulary list.",
        createdAt: "2026-05-04T15:30:00.000Z",
      },
    ],
  },
  "BWF-2026-3": {
    student: MOCK_TEACHER_DASHBOARD.students[2],
    assignments: [
      {
        _id: "demo-c1",
        title: "Social Studies — Local Governance",
        subject: "Social Studies",
        dueDate: "2026-05-18",
        priority: "low",
      },
    ],
    submissions: [],
    moods: [{ _id: "demo-m5", mood: "happy", date: "2026-05-05", note: "" }],
    journals: [],
  },
};

const MOCK_PROGRESS: Record<string, AssignmentProgressResponse> = {
  "BWF-2026-1": {
    student_auth_id: "BWF-2026-1",
    summary: { total: 3, not_submitted: 1, pending: 1, approved: 1, rejected: 0 },
    assignments: [
      {
        assignment_id: "demo-p1",
        title: "English Essay — Environment",
        subject: "English",
        dueDate: "2026-05-12",
        priority: "high",
        progressStatus: "pending",
        rejectionNote: "",
        submittedAt: "2026-05-06T09:00:00.000Z",
        reviewedAt: null,
      },
      {
        assignment_id: "demo-p2",
        title: "Math Practice Set 4",
        subject: "Mathematics",
        dueDate: "2026-05-15",
        priority: "medium",
        progressStatus: "not_submitted",
        rejectionNote: "",
        submittedAt: null,
        reviewedAt: null,
      },
      {
        assignment_id: "demo-p3",
        title: "Reading Log — Week 18",
        subject: "English",
        dueDate: "2026-05-08",
        priority: "low",
        progressStatus: "approved",
        rejectionNote: "",
        submittedAt: "2026-05-04T11:00:00.000Z",
        reviewedAt: "2026-05-05T14:00:00.000Z",
      },
    ],
  },
  "BWF-2026-2": {
    student_auth_id: "BWF-2026-2",
    summary: { total: 2, not_submitted: 0, pending: 1, approved: 1, rejected: 0 },
    assignments: [
      {
        assignment_id: "demo-p4",
        title: "Science — Plant Cell Diagram",
        subject: "Science",
        dueDate: "2026-05-14",
        priority: "high",
        progressStatus: "pending",
        rejectionNote: "",
        submittedAt: "2026-05-06T08:30:00.000Z",
        reviewedAt: null,
      },
      {
        assignment_id: "demo-p5",
        title: "Mental Math Drill",
        subject: "Mathematics",
        dueDate: "2026-05-10",
        priority: "medium",
        progressStatus: "approved",
        rejectionNote: "",
        submittedAt: "2026-05-03T16:00:00.000Z",
        reviewedAt: "2026-05-04T10:00:00.000Z",
      },
    ],
  },
  "BWF-2026-3": {
    student_auth_id: "BWF-2026-3",
    summary: { total: 1, not_submitted: 1, pending: 0, approved: 0, rejected: 0 },
    assignments: [
      {
        assignment_id: "demo-p6",
        title: "Social Studies — Local Governance",
        subject: "Social Studies",
        dueDate: "2026-05-18",
        priority: "low",
        progressStatus: "not_submitted",
        rejectionNote: "",
        submittedAt: null,
        reviewedAt: null,
      },
    ],
  },
};

export function getMockOverview(studentAuthId: string): StudentOverview {
  return (
    MOCK_OVERVIEWS[studentAuthId] ?? {
      student: null,
      assignments: [],
      submissions: [],
      moods: [],
      journals: [],
    }
  );
}

export function getMockAssignmentProgress(studentAuthId: string): AssignmentProgressResponse {
  return (
    MOCK_PROGRESS[studentAuthId] ?? {
      student_auth_id: studentAuthId,
      summary: { total: 0, not_submitted: 0, pending: 0, approved: 0, rejected: 0 },
      assignments: [],
    }
  );
}

export function mockResourceFormDefaults() {
  return {
    library: MOCK_TEACHER_DASHBOARD.resources.find((r) => r.key === "library")?.value ?? "",
    syllabus: MOCK_TEACHER_DASHBOARD.resources.find((r) => r.key === "syllabus")?.value ?? "",
    contactMentor:
      MOCK_TEACHER_DASHBOARD.resources.find((r) => r.key === "contactMentor")?.value ?? "",
  };
}
