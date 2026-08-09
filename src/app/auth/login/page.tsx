"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowRight, FaLock, FaEnvelope } from "react-icons/fa6";
import { loginWithEmail, loginWithGoogle, handleGoogleRedirectResult, storeLmsAuthSession, getLmsPortalRedirect, isAdminPortalToken } from "@/services/authService";
import { clearAdminPortalSessionOnly } from "@/services/adminService";
import { getStoredPortalSessionId } from "@/lib/lmsSession";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setResetSuccess(true);
    }
  }, [searchParams]);

  // Already signed in - return to obfuscated portal (persists across refresh)
  useEffect(() => {
    const sessionId = getStoredPortalSessionId();
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (sessionId && token && !isAdminPortalToken(token)) {
      router.replace(getLmsPortalRedirect(localStorage.getItem("userRole"), sessionId));
    }
  }, [router]);

  // Check for Google redirect result on page load
  useEffect(() => {
    clearAdminPortalSessionOnly();

    const checkRedirectResult = async () => {
      setLoading(true);
      const result = await handleGoogleRedirectResult();
      
      if (result && result.success) {
        const role = result.data?.role;
        let sessionId: string | null = null;

        if (result.data?.idToken) {
          sessionId = storeLmsAuthSession(result.data.idToken, role || "STUDENT");
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace(getLmsPortalRedirect(role, sessionId));
      } else if (result && !result.success) {
        setError(result.message || "Google login failed");
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    
    checkRedirectResult();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", email);
      const response = await loginWithEmail(email, password);
      console.log("Login response:", response);

      if (!response.success) {
        setError(response.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (response.data?.idToken) {
        const sessionId = storeLmsAuthSession(response.data.idToken, response.data.role || "STUDENT");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace(getLmsPortalRedirect(response.data?.role, sessionId));
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace(getLmsPortalRedirect(response.data?.role));
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Starting Google authentication...");
      
      const response = await loginWithGoogle();
      console.log("Google auth response:", response);

      if (!response.success) {
        // If redirect method was used, don't show error (page will reload)
        if (response.message === "Redirecting to Google...") {
          return; // Don't reset loading, page will redirect
        }
        throw new Error(response.message || "Google login failed");
      }

      if (response.data?.idToken) {
        const sessionId = storeLmsAuthSession(response.data.idToken, response.data.role || "STUDENT");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace(getLmsPortalRedirect(response.data?.role, sessionId));
        return;
      }

      const redirectUrl = getLmsPortalRedirect(response.data?.role);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.replace(redirectUrl);
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#EDE6D3] px-3 py-8 text-[#2A2A28] dark:bg-[#070B19] dark:text-white sm:px-4 sm:py-12 md:py-16">
      {/* Blueprint Grid Lines Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.07] dark:[background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)]"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-[#F6F1E4] p-5 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-8 md:p-10"
      >
        {/* Brand Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="GenValue home">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Image src="/Genvalue Light.svg" alt="GenValue Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Genvalue Dark.svg" alt="GenValue Logo" fill className="hidden object-contain dark:block" priority />
            </div>
            <span className="font-display-custom text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="text-[#2A2A28] dark:text-white">Gen</span>
              <span className="text-[#1E3FE0] dark:text-[#60A5FA]">Value</span>
            </span>
          </Link>
          <h1 className="font-display-custom mt-3 text-xl font-extrabold tracking-tight sm:mt-4 sm:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
            Sign in to your GenValue LMS portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
          {resetSuccess && (
            <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-3 text-xs font-semibold text-[#0d9668] dark:text-[#10B981]">
              Password updated successfully. Sign in with your new password.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <FaEnvelope className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
              Password
            </label>
            <div className="relative mt-1.5">
              <FaLock className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-12 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B6558] transition-colors hover:text-[#2A2A28] dark:text-slate-400 dark:hover:text-white sm:right-4"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                  >
                    <path
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                  >
                    <path
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]"
                aria-label="Forgot your password"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label="Sign in to LMS portal"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:opacity-50 sm:px-6 sm:text-sm"
          >
            {loading ? "Signing In..." : "Sign In to Portal"}
            <FaArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-[#F6F1E4] px-3 text-[#6B6558] dark:bg-[#0D1B2A] dark:text-slate-400">
                Or Continue With
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-label="Sign in with Google"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-xs font-bold text-[#2A2A28] shadow-md transition hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:gap-3 sm:px-6 sm:text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign In with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6558] dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">
            Register Now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
