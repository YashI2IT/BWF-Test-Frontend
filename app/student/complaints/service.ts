const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export async function getComplaints(status?: string) {
    // const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const token = localStorage.getItem("accessToken")

    const url = status
    ? `${API_BASE}/student/complaints?status=${status}`
    : `${API_BASE}/student/complaints`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch complaints");
    }

    return data;
}

export async function postComplaints (complaintData: any) {
    // const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const token = localStorage.getItem("accessToken")

    const res = await fetch(`${API_BASE}/student/complaints/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(complaintData),
    })

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to send complaint");
    }
    return data.complaint;
}