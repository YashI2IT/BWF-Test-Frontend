// app/student/wellbeing/service.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export async function getMoodHistory () {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}/student/wellbeing/history`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch mood history");
    }

    return data;
}

export async function postMoodEntry (moodData: any) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}/student/wellbeing/mood`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(moodData)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to post mood entry");
    }

    return data;
}

export async function requestCounselingSession (sessionData: any) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    
    const res = await fetch(`${API_BASE}/student/wellbeing/counselling`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to request counseling session");
    }

    return data;
}

export async function toggleTask(taskData: any) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${API_BASE}/student/wellbeing/tasks/today`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(taskData)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to toggle task");
  }

  return data;
}