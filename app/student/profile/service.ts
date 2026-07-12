const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_BASE}/student/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data;
}

export async function updateProfile(profileData: any) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_BASE}/student/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data;
}

export async function postJournal (journalData: any) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_BASE}/student/profile/me/journal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(journalData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to post journal");
  }

  return data;
}

export async function getJournalEntries() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(`${API_BASE}/student/profile/me/journal`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
    
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch journal entries");
  }

  return data;
}