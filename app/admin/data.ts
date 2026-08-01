export const adminSummary = {
  totalStudents: 48,
  activeStaff: 12,
  pendingRequests: 6,
  pendingPosts: 4,
  donationsThisYear: 1285000,
  expensesThisMonth: 184000,
  pendingExpenses: 3,
};

export const adminWarnings = [
  { icon: "Alert", title: "Medical request spike", sub: "12 this week vs 7 last week" },
  { icon: "Risk", title: "5 students disengaged", sub: "Counselling follow-up recommended" },
];

export const studentRows = [
  { name: "Aisha Khan", studentId: "BWF-2025-102", homeGroup: "House A", className: "Class 9", background: "Single parent", xp: 82 },
  { name: "Meera Patel", studentId: "BWF-2024-081", homeGroup: "House B", className: "Class 8", background: "Rural", xp: 77 },
  { name: "Ravi Singh", studentId: "BWF-2023-044", homeGroup: "House C", className: "Class 10", background: "Urban", xp: 91 },
];

export const staffRows = [
  { name: "Nikita Shah", role: "Housemother", house: "House A", type: "Full-time", caseload: 9, status: "Active" },
  { name: "Pravin Rao", role: "Dean/Warden", house: "House B", type: "Full-time", caseload: 11, status: "Active" },
  { name: "Seema Kulkarni", role: "Counsellor", house: "House C", type: "Part-time", caseload: 6, status: "Active" },
];

export const expenseRows = [
  { title: "School supplies kit", category: "Education", amount: 24000, date: "2026-03-29", status: "Paid" },
  { title: "Nutrition refill", category: "Food", amount: 17500, date: "2026-03-31", status: "Approved" },
  { title: "Health check camp", category: "Medical", amount: 32000, date: "2026-04-01", status: "Pending" },
];

export const mediaRows = [
  { student: "Aisha Khan", home: "House A", date: "2026-03-20", status: "Approved" },
  { student: "Ravi Singh", home: "House C", date: "2026-03-25", status: "Pending" },
  { student: "Meera Patel", home: "House B", date: "2026-03-27", status: "Approved" },
];
