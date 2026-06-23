export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      
      {/* Logo / Brand */}
      <div className="mb-6 text-5xl">☁️</div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">CloudAlarm</h1>
      <p className="text-gray-400 text-lg mb-10">
        Infrastructure drift detection for teams who ship fast.
      </p>

      {/* Status card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400 uppercase tracking-widest">
            API Status
          </span>
          <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Online
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          Backend:{" "}
          <code className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded text-xs">
            http://localhost:4000
          </code>
        </p>
      </div>

      <p className="mt-10 text-gray-600 text-sm">
        Phase 1 complete · Next: build the drift engine →
      </p>
    </main>
  );
}