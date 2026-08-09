import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { cacheAdminProfile, storeAdminAuthSession, type AdminProfile } from "@/services/adminService";
import {
  clearPortalSessionId,
  generatePortalSessionId,
  getStoredPortalSessionId,
  persistPortalSessionId,
} from "@/lib/lmsSession";
import { clearAdminPortalSessionId } from "@/lib/adminPortalSession";
import { API_URL } from "@/lib/api";
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_TOKEN_KEY,
  isAdminTokenValue,
  LMS_AUTH_TOKEN_KEY,
} from "@/lib/authTokens";

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    uid: string;
    email: string;
    name: string;
    role: string;
    idToken?: string;
    customToken?: string;
    adminToken?: string;
    isSuperAdmin?: boolean;
    roles?: AdminProfile["roles"];
    portalSections?: AdminProfile["portalSections"];
    userLimit?: number | null;
    portalSessionId?: string;
  };
  error?: string;
  status?: number;
}

// Configure Google provider with custom parameters for faster auth
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selector
});

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: error.message || "Registration failed",
      error: error.message,
    };
  }
};

/**
 * Login user with email and password
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // Use client-side Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get ID token from Firebase
    const idToken = await user.getIdToken();

    // Optionally sync with backend (to create/update user record in DB)
    // This is async and doesn't block the login flow
    fetch(`${API_URL}/auth/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    }).catch(err => console.warn("Backend sync failed (non-blocking):", err));

    // Return success with token and role
    return {
      success: true,
      message: "Login successful",
      data: {
        uid: user.uid,
        email: user.email || email,
        name: user.displayName || email.split("@")[0],
        role: "STUDENT", // Default role; backend will have actual role
        idToken: idToken,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    
    let message = "Invalid email or password";
    if (error.code === "auth/user-not-found") {
      message = "No account found with this email";
    } else if (error.code === "auth/wrong-password") {
      message = "Incorrect password";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email address";
    } else if (error.code === "auth/user-disabled") {
      message = "This account has been disabled";
    }

    return {
      success: false,
      message: message,
      error: error.message,
    };
  }
};

/**
 * Login with Google OAuth using Popup (fast, but can fail with IndexedDB issues)
 * Falls back to redirect if popup fails
 */
export const loginWithGoogle = async (): Promise<AuthResponse> => {
  try {
    console.log("Starting Google authentication with popup...");
    
    let result;
    try {
      // Try popup first (faster UX)
      result = await signInWithPopup(auth, googleProvider);
    } catch (popupError: any) {
      console.warn("Popup failed, using redirect instead:", popupError.message);
      
      // If popup fails (blocked, IndexedDB issues, etc.), use redirect
      // Mark that we're using redirect so we can handle it on page load
      sessionStorage.setItem('googleAuthMethod', 'redirect');
      await signInWithRedirect(auth, googleProvider);
      
      // Redirect will reload the page, so this won't execute
      return {
        success: false,
        message: "Redirecting to Google...",
      };
    }
    
    const user = result.user;

    const idToken = await user.getIdToken();

    storeLmsAuthSession(idToken, "STUDENT");
    localStorage.setItem("userId", user.uid);

    console.log("Token stored locally, attempting backend sync...");

    // Send to backend to sync/link account in CockroachDB
    // But don't block if backend is down - user can still access frontend
    let backendData: AuthResponse = {
      success: true,
      message: "Login successful (frontend only)",
      data: {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || user.email?.split("@")[0] || "User",
        role: "STUDENT",
        idToken,
      },
    };

    try {
      const response = await fetch(`${API_URL}/auth/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        if (data.data?.role) {
          localStorage.setItem("userRole", data.data.role);
          document.cookie = `userRole=${data.data.role}; path=/; max-age=3600`;
        }
        backendData = { ...data, data: { ...data.data!, idToken } };
      } else {
        console.warn("Backend sync failed with status:", response.status);
        // Still return success - frontend auth worked
      }
    } catch (backendError) {
      console.warn("Backend sync error (non-blocking):", backendError);
      // Still return success - frontend auth worked
    }

    return backendData;
  } catch (error: any) {
    console.error("Google login error:", error);
    return {
      success: false,
      message: error.message || "Google login failed",
      error: error.message,
    };
  }
};

/**
 * Handle Google redirect result after redirect-based OAuth
 * Call this on page load to complete redirect-based auth
 */
export const handleGoogleRedirectResult = async (): Promise<AuthResponse | null> => {
  try {
    const authMethod = sessionStorage.getItem('googleAuthMethod');
    if (authMethod !== 'redirect') {
      return null; // Not using redirect method
    }
    
    console.log("Checking for Google redirect result...");
    const result = await getRedirectResult(auth);
    
    if (!result) {
      sessionStorage.removeItem('googleAuthMethod');
      return null;
    }
    
    sessionStorage.removeItem('googleAuthMethod');
    
    const user = result.user;
    const idToken = await user.getIdToken();

    storeLmsAuthSession(idToken, "STUDENT");
    localStorage.setItem("userId", user.uid);

    console.log("Token stored locally, attempting backend sync...");

    // Send to backend to sync/link account
    // But don't block if backend is down - user can still access frontend
    let backendData: AuthResponse = {
      success: true,
      message: "Login successful (frontend only)",
      data: {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || user.email?.split("@")[0] || "User",
        role: "STUDENT",
        idToken,
      },
    };

    try {
      const response = await fetch(`${API_URL}/auth/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        if (data.data?.role) {
          localStorage.setItem("userRole", data.data.role);
          document.cookie = `userRole=${data.data.role}; path=/; max-age=3600`;
        }
        backendData = { ...data, data: { ...data.data!, idToken } };
      } else {
        console.warn("Backend sync failed with status:", response.status);
        // Still return success - frontend auth worked
      }
    } catch (backendError) {
      console.warn("Backend sync error (non-blocking):", backendError);
      // Still return success - frontend auth worked
    }

    return backendData;
  } catch (error: any) {
    console.error("Google redirect result error:", error);
    sessionStorage.removeItem('googleAuthMethod');
    return {
      success: false,
      message: error.message || "Google redirect failed",
      error: error.message,
    };
  }
};

/**
 * Send OTP for student password reset
 */
export const sendPasswordResetOtp = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data: AuthResponse & { hint?: string } = await response.json();
    if (!response.ok) {
      const msg = data.hint ? `${data.message} ${data.hint}` : data.message || "Failed to send reset code";
      throw new Error(msg);
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send reset code";
    return { success: false, message, error: message };
  }
};

/**
 * Verify student password reset OTP
 */
export const verifyPasswordResetOtp = async (
  email: string,
  otp: string
): Promise<AuthResponse & { data?: AuthResponse["data"] & { resetToken?: string } }> => {
  try {
    const normalizedOtp = otp.replace(/\D/g, "").slice(-6);
    const response = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: normalizedOtp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Code verification failed");
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Code verification failed";
    return { success: false, message, error: message };
  }
};

/**
 * Reset student password after OTP verification
 */
export const resetPasswordWithToken = async (
  resetToken: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password, confirmPassword }),
    });

    const data: AuthResponse = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to reset password");
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    return { success: false, message, error: message };
  }
};

/**
 * Send OTP for admin login
 */
export const sendAdminOTP = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/admin/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const rawText = await response.text();
    let data: AuthResponse & { hint?: string } = {
      success: false,
      message: "Failed to send OTP",
    };
    try {
      data = JSON.parse(rawText) as AuthResponse & { hint?: string };
    } catch {
      data = {
        success: false,
        message:
          response.status === 502
            ? "Admin API is temporarily unavailable (502). Check that the Render service is live, then try again."
            : `Failed to send OTP (HTTP ${response.status}).`,
      };
    }

    const message =
      data.hint && data.message
        ? `${data.message} ${data.hint}`
        : data.message || (response.status === 401 ? "Unauthorized" : "Failed to send OTP");

    if (!response.ok) {
      return {
        success: false,
        message,
        status: response.status,
        error: message,
      };
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    console.error("Send OTP error:", error);
    return {
      success: false,
      message,
      error: message,
    };
  }
};

/**
 * Verify admin OTP
 */
export const verifyAdminOTP = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  try {
    const normalizedOtp = otp.replace(/\D/g, "").slice(-6);
    const timeZone =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined;

    const response = await fetch(`${API_URL}/auth/admin/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: normalizedOtp,
        ...(timeZone ? { timeZone } : {}),
      }),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "OTP verification failed");
    }

    // Store admin session token with obfuscated portal slug
    if (data.data?.adminToken) {
      const adminProfile: AdminProfile = {
        userId: data.data.uid,
        email: data.data.email,
        role: data.data.role,
        name: data.data.name ?? data.data.email.split("@")[0],
        isSuperAdmin: Boolean(data.data.isSuperAdmin),
        roles: data.data.roles ?? [],
        portalSections: data.data.portalSections ?? [],
        userLimit: data.data.userLimit ?? null,
      };
      const sessionId = storeAdminAuthSession(data.data.adminToken, adminProfile);
      data.data.portalSessionId = sessionId;
    } else if (data.data?.customToken) {
      localStorage.setItem("authToken", data.data.customToken);
      localStorage.setItem("userRole", data.data.role);
    }

    return data;
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return {
      success: false,
      message: error.message || "OTP verification failed",
      error: error.message,
    };
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    clearPortalSessionId();

    document.cookie = "authToken=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Refresh Firebase ID token
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const existing = getAuthToken();
    if (isAdminPortalToken(existing)) {
      return existing;
    }

    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      console.warn("No current user found for token refresh - keeping stored token");
      return existing;
    }

    // Force token refresh
    const newIdToken = await currentUser.getIdToken(true);
    
    // Store the new token
    localStorage.setItem(LMS_AUTH_TOKEN_KEY, newIdToken);

    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `${LMS_AUTH_TOKEN_KEY}=${newIdToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
    
    console.log("Token refreshed successfully");
    return newIdToken;
  } catch (error) {
    console.error("Token refresh error:", error);
    return getAuthToken();
  }
};

/**
 * Get auth token with automatic refresh if expired
 */
export const getAuthTokenWithRefresh = async (): Promise<string | null> => {
  let token = getAuthToken();
  
  if (!token) {
    return null;
  }

  if (isAdminPortalToken(token)) {
    return token;
  }

  try {
    // Decode the token to check expiration
    const parts = token.split('.');
    if (parts.length !== 3) {
      return token; // Invalid format, return as-is
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // If token expires in less than 5 minutes, refresh it
    if (payload.exp && payload.exp - now < 300) {
      console.log("Token expiring soon, refreshing...");
      const refreshedToken = await refreshAuthToken();
      return refreshedToken || token;
    }
    
    return token;
  } catch (error) {
    console.warn("Error checking token expiration:", error);
    return token; // Return the token even if we can't verify expiration
  }
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem(LMS_AUTH_TOKEN_KEY);
  return isAdminTokenValue(token) ? null : token;
};

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  return localStorage.getItem("userRole");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};


/** True when the stored token is from the admin OTP portal (not Firebase LMS auth). */
export function isAdminPortalToken(token?: string | null): boolean {
  if (token) return isAdminTokenValue(token);
  if (typeof window === "undefined") return false;

  const dedicated = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  if (isAdminTokenValue(dedicated)) return true;

  return isAdminTokenValue(localStorage.getItem(LMS_AUTH_TOKEN_KEY));
}

/** LMS portal redirect - obfuscated session URL after login. */
export function getLmsPortalRedirect(role?: string | null, sessionId?: string | null): string {
  if (role === "INSTRUCTOR") {
    return "/instructor";
  }
  if (sessionId) {
    return `/portal/${sessionId}`;
  }
  const stored = typeof window !== "undefined" ? localStorage.getItem("lmsPortalSessionId") : null;
  if (stored) {
    return `/portal/${stored}`;
  }
  return "/auth/login";
}

/** Persist Firebase LMS session, issue new obfuscated portal slug, clear admin keys. */
export function storeLmsAuthSession(idToken: string, role = "STUDENT"): string {
  const sessionId = generatePortalSessionId();

  localStorage.removeItem("adminEmail");
  localStorage.removeItem("isSuperAdmin");
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  clearAdminPortalSessionId();
  localStorage.setItem(LMS_AUTH_TOKEN_KEY, idToken);
  localStorage.setItem("userRole", role);
  persistPortalSessionId(sessionId);

  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `${LMS_AUTH_TOKEN_KEY}=${idToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
  document.cookie = `${ADMIN_AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `userRole=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;

  return sessionId;
}

/**
 * On refresh: re-sync Firebase token + cookies when portal session exists in localStorage.
 * Does not rotate the portal slug (only login creates a new one).
 */
export async function restoreLmsSessionIfNeeded(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const sessionId = getStoredPortalSessionId();
  if (!sessionId) return null;

  const user = await getCurrentUser();
  if (!user) return sessionId;

  const idToken = await user.getIdToken();
  localStorage.setItem(LMS_AUTH_TOKEN_KEY, idToken);
  persistPortalSessionId(sessionId);

  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `${LMS_AUTH_TOKEN_KEY}=${idToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
  const role = localStorage.getItem("userRole") || "STUDENT";
  document.cookie = `userRole=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;

  return sessionId;
}
