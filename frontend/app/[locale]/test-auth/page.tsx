/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser-client";

export default function TestAuthPage() {
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("123456");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const testAuth = async () => {
    setError("");
    setResult(null);

    try {
      console.log("Testing Supabase connection...");
      console.log("Email:", email);
      console.log("Password:", password);

      const supabase = createClient();
      console.log("Supabase client created:", supabase);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Auth result:", { data, error: signInError });

      if (signInError) {
        setError(signInError.message);
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      console.error("Test error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Supabase Auth Test</h1>

        <div className="space-y-2">
          <label className="block">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="space-y-2">
          <label className="block">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Sign In
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-bold text-red-800">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-bold text-green-800">Success!</h3>
            <pre className="text-sm text-green-600 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold">Environment Variables:</h3>
          <ul className="text-sm space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}</li>
            <li>
              NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
