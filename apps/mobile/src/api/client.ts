import type {
  MobileLoginRequest,
  MobileLoginResponse,
  MobileMeResponse,
  SubmitStudentAttendanceInput,
  SubmitStudentAttendanceResponse,
  StaffAttendanceStatusResponse,
  StaffQrScanResponse,
  TeacherClassSectionsResponse,
  TeacherClassSectionStudentsResponse
} from "./contracts";

const DEFAULT_TIMEOUT_MS = 15000;

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function configureApiUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function apiBaseUrlFromEnv() {
  return process.env.EXPO_PUBLIC_API_BASE_URL;
}

export function getApiBaseUrl(envValue = apiBaseUrlFromEnv()) {
  const value = envValue?.trim();
  if (!value) {
    throw new ApiError(
      "Set EXPO_PUBLIC_API_BASE_URL to the JinaCampus web API URL.",
      "API_BASE_URL_MISSING"
    );
  }

  if (!/^https?:\/\//i.test(value)) {
    throw new ApiError("The JinaCampus API URL must start with http:// or https://.", "API_BASE_URL_INVALID");
  }

  return value.replace(/\/+$/, "");
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = response.status >= 500
      ? "Server is unavailable. Please try again."
      : typeof payload.message === "string"
      ? payload.message
      : typeof payload.error === "string"
        ? payload.error
        : response.status === 404
          ? "Mobile backend API is pending."
          : "Request failed. Please try again.";
    throw new ApiError(message, response.status === 404 ? "MOBILE_API_PENDING" : "API_REQUEST_FAILED", response.status);
  }
  return payload as T;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal
    });
    try {
      return await parseJsonResponse<T>(response);
    } catch (error) {
      if (response.status === 401 && token) void unauthorizedHandler?.();
      throw error;
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError("The request timed out. Check your connection and try again.", "API_REQUEST_TIMEOUT");
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError("Network request failed. Check your connection and try again.", "API_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

export function mobileLogin(input: MobileLoginRequest) {
  return request<MobileLoginResponse>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function mobileLogout(token: string) {
  return request<{ success: true }>("/api/mobile/auth/logout", { method: "POST" }, token);
}

export function getMobileMe(token: string) {
  return request<MobileMeResponse>("/api/mobile/me", {}, token);
}

export function scanStaffAttendanceQr(token: string, qrToken: string) {
  return request<StaffQrScanResponse>(
    "/api/mobile/staff-attendance/scan",
    {
      method: "POST",
      body: JSON.stringify({ token: qrToken })
    },
    token
  );
}

export function getMyStaffAttendanceStatus(token: string) {
  return request<StaffAttendanceStatusResponse>("/api/mobile/staff-attendance/my-status", {}, token);
}

export function getTeacherClassSections(token: string) {
  return request<TeacherClassSectionsResponse>("/api/mobile/teacher/class-sections", {}, token);
}

export function getTeacherClassSectionStudents(token: string, classSectionId: string) {
  return request<TeacherClassSectionStudentsResponse>(
    `/api/mobile/teacher/class-sections/${encodeURIComponent(classSectionId)}/students`,
    {},
    token
  );
}

export function submitStudentAttendance(token: string, input: SubmitStudentAttendanceInput) {
  return request<SubmitStudentAttendanceResponse>(
    "/api/mobile/student-attendance/submit",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    token
  );
}
