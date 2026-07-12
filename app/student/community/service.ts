const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchCommunityPosts() {
    // const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${API_BASE}/student/community/posts`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error("Failed to fetch community posts");
    }

    return data;
}

export async function postMessage(postMessage: any) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}/student/community/posts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postMessage),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error("Failed to post message");
    }
    return data;
}

export async function toggleLike (postId: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}/student/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error("Failed to toggle like");
    }
    return data;
}