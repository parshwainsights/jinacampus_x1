import { router } from "expo-router";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, configureApiUnauthorizedHandler, getMobileMe, mobileLogin, mobileLogout } from "../api/client";
import type {
  MobileAcademicYear,
  MobileBranch,
  MobileCapabilityFlags,
  MobileInstitution,
  MobileLoginRequest,
  MobileLoginResponse,
  MobileMeResponse,
  MobileUser
} from "../api/contracts";
import { clearMobileToken, getMobileToken, saveMobileToken } from "./session-store";

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: MobileUser | null;
  institution: MobileInstitution | null;
  branch: MobileBranch | null;
  academicYear: MobileAcademicYear | null;
  capabilities: MobileCapabilityFlags | null;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signIn(input: MobileLoginRequest): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function safeAuthError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MOBILE_API_PENDING") return "Mobile login API is pending. The native app shell is ready.";
    if (error.code === "API_BASE_URL_MISSING") return error.message;
    if (error.status === 401) return "Invalid School ID, email, or password.";
    return error.message;
  }
  return "Unable to sign in. Please try again.";
}

function userFromContextResponse(response: MobileLoginResponse | MobileMeResponse): MobileUser {
  return {
    ...response.user,
    institution: response.user.institution ?? response.institution ?? null,
    branch: response.user.branch ?? response.branch ?? null,
    academicYear: response.user.academicYear ?? response.academicYear ?? null
  };
}

function authenticatedState(token: string, response: MobileLoginResponse | MobileMeResponse): AuthState {
  const user = userFromContextResponse(response);
  return {
    status: "authenticated",
    token,
    user,
    institution: user.institution ?? null,
    branch: user.branch ?? null,
    academicYear: user.academicYear ?? null,
    capabilities: user.capabilities,
    error: null
  };
}

function unauthenticatedState(error: string | null = null): AuthState {
  return {
    status: "unauthenticated",
    token: null,
    user: null,
    institution: null,
    branch: null,
    academicYear: null,
    capabilities: null,
    error
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    token: null,
    user: null,
    institution: null,
    branch: null,
    academicYear: null,
    capabilities: null,
    error: null
  });

  const clearLocalSession = useCallback(async (message: string | null = null) => {
    await clearMobileToken();
    setState(unauthenticatedState(message));
    router.replace("/login");
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = await getMobileToken();
    if (!storedToken) {
      setState(unauthenticatedState());
      return;
    }

    try {
      const me = await getMobileMe(storedToken);
      setState(authenticatedState(storedToken, me));
    } catch (error) {
      await clearMobileToken();
      setState(unauthenticatedState(safeAuthError(error)));
    }
  }, []);

  useEffect(() => {
    configureApiUnauthorizedHandler(() => {
      void clearLocalSession("Your session has expired. Please sign in again.");
    });
    return () => configureApiUnauthorizedHandler(null);
  }, [clearLocalSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (input: MobileLoginRequest) => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const response = await mobileLogin(input);
      await saveMobileToken(response.token);
      setState(authenticatedState(response.token, response));
      router.replace("/(app)/home");
    } catch (error) {
      setState(unauthenticatedState(safeAuthError(error)));
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = state.token;
    if (token) {
      await mobileLogout(token).catch(() => undefined);
    }
    await clearLocalSession();
  }, [clearLocalSession, state.token]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
