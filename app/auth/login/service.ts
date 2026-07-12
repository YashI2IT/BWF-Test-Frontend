
export async function loginUser(studentId: string, password: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    const res = await fetch(
      `${baseUrl}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-type": "web",
        },
        body: JSON.stringify({
          id: studentId,
          password,
        }),
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
}