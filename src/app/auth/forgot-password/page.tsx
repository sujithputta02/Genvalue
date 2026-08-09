"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaEnvelope, FaKey, FaLock } from "react-icons/fa6";
import {
  resetPasswordWithToken,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from "@/services/authService";
import { clearAdminPortalSessionOnly } from "@/services/adminService";

type Step = "email" | "otp" | "reset";

const SESSION_EMAIL_KEY = "forgotPasswordEmail";
const SESSION_STEP_KEY = "forgotPasswordStep";
const SESSION_TOKEN_KEY = "forgotPasswordResetToken";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOtp(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 6 ? digits.slice(-6) : digits;
}

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B6558] transition-colors hover:text-[#2A2A28] dark:text-slate-400 dark:hover:text-white sm:right-4"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    clearAdminPortalSessionOnly();

    const savedEmail = sessionStorage.getItem(SESSION_EMAIL_KEY);
    const savedStep = sessionStorage.getItem(SESSION_STEP_KEY) as Step | null;
    const savedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

    if (savedEmail) setEmail(savedEmail);
    if (savedStep === "otp" && savedEmail) {
      setStep("otp");
      setSuccessMessage("Enter the 6-digit code sent to your email.");
    }
    if (savedStep === "reset" && savedToken) {
      setStep("reset");
      setResetToken(savedToken);
      setSuccessMessage("Create a new password for your account.");
    }
  }, []);

  function clearSession() {
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    sessionStorage.removeItem(SESSION_STEP_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const normalizedEmail = normalizeEmail(email);
    const response = await sendPasswordResetOtp(normalizedEmail);

    if (!response.success) {
      setError(response.message || "Failed to send reset code");
      setLoading(false);
      return;
    }

    setEmail(normalizedEmail);
    sessionStorage.setItem(SESSION_EMAIL_KEY, normalizedEmail);
    sessionStorage.setItem(SESSION_STEP_KEY, "otp");
    setStep("otp");
    setSuccessMessage(response.message || "Reset code sent. Check your email.");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const response = await verifyPasswordResetOtp(email, otp);

    if (!response.success || !response.data?.resetToken) {
      setError(response.message || "Invalid code");
      setLoading(false);
      return;
    }

    setResetToken(response.data.resetToken);
    sessionStorage.setItem(SESSION_STEP_KEY, "reset");
    sessionStorage.setItem(SESSION_TOKEN_KEY, response.data.resetToken);
    setStep("reset");
    setSuccessMessage("Code verified. Set your new password below.");
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const response = await resetPasswordWithToken(resetToken, password, confirmPassword);

    if (!response.success) {
      setError(response.message || "Failed to reset password");
      setLoading(false);
      return;
    }

    clearSession();
    router.push("/auth/login?reset=success");
  }

  async function handleResendOtp() {
    setLoading(true);
    setError("");
    const response = await sendPasswordResetOtp(email);
    if (!response.success) {
      setError(response.message || "Failed to resend code");
    } else {
      setSuccessMessage(response.message || "A new code has been sent.");
    }
    setLoading(false);
  }

  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#EDE6D3] px-3 py-8 text-[#2A2A28] dark:bg-[#070B19] dark:text-white sm:px-4 sm:py-12 md:py-16">
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
            Reset Password
          </h1>
          <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
            {step === "email" && "Enter your account email to receive a reset code"}
            {step === "otp" && "Verify the 6-digit code sent to your email"}
            {step === "reset" && "Choose a new password for your account"}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMessage && !error && (
          <div className="mt-6 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-3 text-xs font-semibold text-[#0d9668] dark:text-[#10B981]">
            {successMessage}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <FaEnvelope className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
                <input
                  id="reset-email"
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

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:opacity-50 sm:px-6 sm:text-sm"
              aria-label="Send password reset code"
            >
              {loading ? "Sending…" : "Send Reset Code"}
              <FaArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <p className="text-xs text-[#6B6558] dark:text-slate-400">
              Code sent to <strong className="text-[#2A2A28] dark:text-white">{email}</strong>
            </p>

            <div>
              <label htmlFor="reset-otp" className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                Verification Code
              </label>
              <div className="relative mt-1.5">
                <FaKey className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(normalizeOtp(e.target.value))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-base font-medium tracking-[0.3em] outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
                  aria-label="6-digit verification code"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:opacity-50 sm:px-6 sm:text-sm"
              aria-label="Verify reset code"
            >
              {loading ? "Verifying…" : "Verify Code"}
              <FaArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-center text-xs font-bold text-[#1E3FE0] hover:underline disabled:opacity-50 dark:text-[#60A5FA]"
              aria-label="Resend reset code"
            >
              Resend code
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                New Password
              </label>
              <div className="relative mt-1.5">
                <FaLock className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-12 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
                />
                <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                Re-enter Password
              </label>
              <div className="relative mt-1.5">
                <FaLock className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-12 text-base font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA] sm:text-sm"
                />
                <PasswordVisibilityToggle
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch || password.length < 6}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:opacity-50 sm:px-6 sm:text-sm"
              aria-label="Update password"
            >
              {loading ? "Updating…" : "Update Password"}
              <FaArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]"
            aria-label="Back to login"
          >
            <FaArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
