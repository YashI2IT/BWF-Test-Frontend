"use client";

import api from "@/app/lib/api";
import {
  AssignmentProgressResponse,
  StudentOverview,
  TeacherDashboardResponse,
  TeacherProfile,
} from "./types";

export async function getTeacherProfile() {
  const res = await api.get<TeacherProfile>("/teacher/profile");
  return res.data;
}

export async function getTeacherDashboard() {
  const res = await api.get<TeacherDashboardResponse>("/teacher/dashboard");
  return res.data;
}

export async function assignMentor(studentAuthId: string, mentorName: string) {
  const res = await api.put(`/teacher/students/${studentAuthId}/mentor`, { mentorName });
  return res.data;
}

export async function addAssignment(studentAuthId: string, payload: FormData) {
  const res = await api.post(`/teacher/students/${studentAuthId}/assignments`, payload);
  return res.data;
}

export async function addSchedule(
  studentAuthId: string,
  payload: { title: string; sessionType: string; date: string; startTime: string; joinLink?: string }
) {
  const res = await api.post(`/teacher/students/${studentAuthId}/schedule`, payload);
  return res.data;
}

export async function pushMentorNote(studentAuthId: string, message: string, mentorName: string) {
  const res = await api.post(`/teacher/students/${studentAuthId}/mentor-note`, { message, mentorName });
  return res.data;
}

export async function updateResource(key: "library" | "syllabus" | "contactMentor", value: string) {
  const res = await api.put(`/teacher/resources/${key}`, { value });
  return res.data;
}

export async function getStudentOverview(studentAuthId: string) {
  const res = await api.get<StudentOverview>(`/teacher/students/${studentAuthId}/overview`);
  return res.data;
}

export async function getAssignmentProgress(studentAuthId: string) {
  const res = await api.get<AssignmentProgressResponse>(
    `/teacher/students/${studentAuthId}/assignment-progress`
  );
  return res.data;
}

export async function getMentorNotes() {
  const res = await api.get('/teacher/mentor-notes');
  return res.data;
}

export async function getStudents() {
  const res = await api.get('/teacher/students');
  return res.data;
}

export async function getSubmissions(status?: string) {
  const res = await api.get("/teacher/submissions", { params: status ? { status } : {} });
  return res.data;
}

export async function reviewSubmission(
  submissionId: string,
  payload: { status: "approved" | "rejected"; rejectionNote?: string }
) {
  const res = await api.patch(`/teacher/submissions/${submissionId}/review`, payload);
  return res.data;
}
