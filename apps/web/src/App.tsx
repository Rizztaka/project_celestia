import { useState } from "react";
import type { CreateUserInput } from "@celestia/api-contracts";

function App() {
  // We are successfully using the shared type from our backend contracts!
  const [formData, setFormData] = useState<Partial<CreateUserInput>>({
    username: "",
    email: "",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-indigo-400 mb-2">
        Project Celestia
      </h1>
      <p className="text-lg text-zinc-400 mb-8">
        Full-Stack Foundation Established
      </p>

      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-6">Tailwind v4 is working!</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-colors">
            Ready to Connect API
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
