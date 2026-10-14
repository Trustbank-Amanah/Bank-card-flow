// app/(auth)/login/page.tsx
import { loginWithAzure, loginWithEmail } from './actions';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Bank Card Workflow
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Interne applicatie — alleen voor medewerkers
          </p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {params.message}
          </div>
        )}

        {/* Microsoft login */}
        <form action={loginWithAzure}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 23 23"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#7fba00" d="M12 1h10v10H12z" />
              <path fill="#00a4ef" d="M1 12h10v10H1z" />
              <path fill="#ffb900" d="M12 12h10v10H12z" />
            </svg>
            Inloggen met Microsoft
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-xs text-gray-400">of</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Tijdelijke email login voor testen */}
        <form action={loginWithEmail} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mailadres (tijdelijk testen)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="naam@bank.nl"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Stuur inloglink
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Toegang alleen voor geautoriseerde medewerkers.
        </p>
      </div>
    </div>
  );
}