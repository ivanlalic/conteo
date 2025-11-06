export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          conteo.online
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Simple analytics for indie hackers
        </p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
          >
            Dashboard
          </a>
        </div>
        <p className="text-gray-500 mt-8 text-sm">
          ✅ Next.js 14 + Supabase + Vercel
        </p>
      </div>
    </div>
  );
}
