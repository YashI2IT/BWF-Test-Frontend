export default function AdminDashboard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg animate-[fadeUp_0.6s_ease]">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to your dashboard! Here you can manage users, view reports,
          and more.
        </p>
      </div>
    </main>
  );
}
