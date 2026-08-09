"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowRight, FaEnvelope, FaLock, FaUser } from "react-icons/fa6";
import { registerWithEmail, loginWithGoogle, storeLmsAuthSession, getLmsPortalRedirect } from "@/services/authService";
import { clearAdminPortalSessionOnly } from "@/services/adminService";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    clearAdminPortalSessionOnly();
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 10;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(password);
  const isPasswordStrong = passwordStrength >= 80;
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting registration with:", email, name);
      const response = await registerWithEmail(email, password, name);
      console.log("Registration response:", response);

      if (!response.success) {
        setError(response.message || "Registration failed");
        setLoading(false);
        return;
      }

      if (response.data?.idToken) {
        const sessionId = storeLmsAuthSession(response.data.idToken, response.data.role || "STUDENT");
        router.replace(getLmsPortalRedirect(response.data?.role, sessionId));
        return;
      }

      router.replace(getLmsPortalRedirect(response.data?.role));
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await loginWithGoogle();

      if (!response.success) {
        setError(response.message || "Google signup failed");
        return;
      }

      if (response.data?.idToken) {
        const sessionId = storeLmsAuthSession(response.data.idToken, response.data.role || "STUDENT");
        router.replace(getLmsPortalRedirect(response.data?.role, sessionId));
        return;
      }

      router.replace(getLmsPortalRedirect(response.data?.role));
    } catch (error: any) {
      setError(error.message || "Google signup failed");
    } finally {
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
            Join GenValue
          </h1>
          <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
            Create your account to access the AI LMS Portal
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
              Full Name
            </label>
            <div className="relative mt-1.5">
              <FaUser className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
              />
            </div>
          </div>

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
                placeholder="alex@gmail.com"
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
                autoComplete="new-password"
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
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#6B6558] dark:text-slate-400">
                    Password Strength: <span className={`font-bold ${passwordStrength < 40 ? 'text-red-500' : passwordStrength < 80 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {getStrengthLabel()}
                    </span>
                  </span>
                  <span className="font-bold text-[#6B6558] dark:text-slate-400">{passwordStrength}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1 text-[10px] text-[#6B6558] dark:text-slate-400">
                  <p className={password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
                    • At least 8 characters {password.length >= 8 && "✓"}
                  </p>
                  <p className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                    • One uppercase letter {/[A-Z]/.test(password) && "✓"}
                  </p>
                  <p className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                    • One lowercase letter {/[a-z]/.test(password) && "✓"}
                  </p>
                  <p className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                    • One number {/[0-9]/.test(password) && "✓"}
                  </p>
                  <p className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                    • One special character {/[^a-zA-Z0-9]/.test(password) && "✓"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
              Confirm Password
            </label>
            <div className="relative mt-1.5">
              <FaLock className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl border ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500"
                    : "border-black/10 dark:border-white/10"
                } bg-white py-3 pl-11 pr-12 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B6558] transition-colors hover:text-[#2A2A28] dark:text-slate-400 dark:hover:text-white sm:right-4"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
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
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1.5 text-xs font-medium text-red-500">
                Passwords do not match
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-1.5 text-xs font-medium text-green-500">
                Passwords match ✓
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong || !passwordsMatch}
            aria-label="Create account and enter LMS portal"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
          >
            <span className="text-center">{loading ? "Creating Account..." : "Create Account & Enter"}</span>
            <FaArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="bg-[#F6F1E4] px-3 text-[#6B6558] dark:bg-[#0D1B2A] dark:text-slate-400">
                Or Sign Up With
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            aria-label="Sign up with Google"
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
            Sign Up with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6558] dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">
            Sign In Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
