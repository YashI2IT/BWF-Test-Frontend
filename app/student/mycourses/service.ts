const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export async function getMyAssignments (range = "30d") {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}/student/assignments?range=${range}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch assignments");
    }

    return data;
}

export async function submitAssignment (id: string, file?: File | null) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    let body: BodyInit | null = null;
    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        body = formData;
    }

    const res = await fetch(`${API_BASE}/student/assignments/${id}/submit`, {
        method: "POST",
        headers,
        body,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to submit assignment");
    }

    return data;

}

export async function revertAssignment(id: string) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const res = await fetch(
    `${API_BASE}/student/assignments/${id}/revert`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to revert");
  }

  return data;
}