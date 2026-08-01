export async function loginUser(adminId: string, password: string) {
  try {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

    const res = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-type": "web",
      },
      body: JSON.stringify({
        id: adminId,
        password,
      }),
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await res.text();
      throw new Error(
        `API returned non-JSON response. Check NEXT_PUBLIC_API_BASE_URL (current: ${apiBaseUrl}). First response chars: ${raw.slice(0, 80)}`
      );
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach authentication service";
    throw new Error(message);
  }
}
