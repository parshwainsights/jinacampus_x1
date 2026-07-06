"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, ImageUp, Loader2, Square, VideoOff } from "lucide-react";

type StaffQrCameraScannerProps = {
  disabled?: boolean;
  variant?: "default" | "mobile";
  onQrPayloadDetected: (qrPayload: string) => void;
};

type ScannerStatus =
  | "idle"
  | "checking-support"
  | "requesting-permission"
  | "camera-active"
  | "detected"
  | "unsupported"
  | "in-app-browser"
  | "permission-denied"
  | "https-required"
  | "camera-unavailable"
  | "timeout"
  | "error";

type CameraDiagnostics = {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  isLikelyInAppBrowser: boolean;
  origin: string;
  userAgent: string;
};

type ImageDecodeStatus = "idle" | "decoding" | "error";

const CAMERA_REQUEST_TIMEOUT_MS = 12_000;

const PREFERRED_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
};

const FALLBACK_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: true
};

class CameraTimeoutError extends Error {
  constructor() {
    super("Camera permission request timed out.");
    this.name = "CameraTimeoutError";
  }
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function isLikelyInAppBrowser(userAgent: string) {
  return /FBAN|FBAV|Instagram|Line\/|LinkedInApp|MicroMessenger|Twitter|WhatsApp/i.test(userAgent);
}

function getCameraDiagnostics(): CameraDiagnostics {
  if (typeof window === "undefined") {
    return {
      isSecureContext: false,
      hasMediaDevices: false,
      hasGetUserMedia: false,
      isLikelyInAppBrowser: false,
      origin: "Unavailable during server rendering",
      userAgent: "Unavailable during server rendering"
    };
  }

  const mediaDevices = navigator.mediaDevices;
  const userAgent = navigator.userAgent || "Unknown browser";
  return {
    isSecureContext: window.isSecureContext === true,
    hasMediaDevices: Boolean(mediaDevices),
    hasGetUserMedia: typeof mediaDevices?.getUserMedia === "function",
    isLikelyInAppBrowser: isLikelyInAppBrowser(userAgent),
    origin: window.location.origin,
    userAgent
  };
}

function logCameraDiagnostics(eventName: string, diagnostics: CameraDiagnostics) {
  console.info("[JinaCampus Staff QR camera]", {
    eventName,
    isSecureContext: diagnostics.isSecureContext,
    hasMediaDevices: diagnostics.hasMediaDevices,
    hasGetUserMedia: diagnostics.hasGetUserMedia,
    isLikelyInAppBrowser: diagnostics.isLikelyInAppBrowser,
    origin: diagnostics.origin,
    userAgent: diagnostics.userAgent
  });
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function getUserMediaWithTimeout(mediaDevices: MediaDevices, constraints: MediaStreamConstraints) {
  let timeoutId: number | undefined;
  let didTimeOut = false;
  const streamPromise = mediaDevices.getUserMedia(constraints);
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      didTimeOut = true;
      reject(new CameraTimeoutError());
    }, CAMERA_REQUEST_TIMEOUT_MS);
  });

  streamPromise.then(
    (stream) => {
      if (didTimeOut) stopMediaStream(stream);
    },
    () => undefined
  );

  try {
    return await Promise.race([streamPromise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function isConstraintFailure(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError")
  );
}

async function requestCameraStream(mediaDevices: MediaDevices) {
  try {
    return await getUserMediaWithTimeout(mediaDevices, PREFERRED_CAMERA_CONSTRAINTS);
  } catch (error) {
    if (isConstraintFailure(error)) {
      return getUserMediaWithTimeout(mediaDevices, FALLBACK_CAMERA_CONSTRAINTS);
    }
    throw error;
  }
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof CameraTimeoutError) {
    return {
      status: "timeout" as const,
      message:
        "Camera permission request timed out. Reopen the approved HTTPS link, check browser camera permission, and retry."
    };
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return {
        status: "permission-denied" as const,
        message: "Camera permission was denied. Please allow camera access in Safari settings and retry."
      };
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        status: "camera-unavailable" as const,
        message: "No camera was found on this device. Please use manual token entry."
      };
    }
    if (isConstraintFailure(error)) {
      return {
        status: "camera-unavailable" as const,
        message: "No usable camera was found on this device. Please use manual token entry."
      };
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError" || error.name === "AbortError") {
      return {
        status: "camera-unavailable" as const,
        message: "Camera is already in use or blocked by the device/browser."
      };
    }
  }

  return {
    status: "error" as const,
    message: "Unknown camera error. Please retry, reopen the approved HTTPS link, or use manual token entry."
  };
}

function statusLabel(status: ScannerStatus) {
  switch (status) {
    case "checking-support":
      return "Checking support";
    case "requesting-permission":
      return "Requesting camera permission";
    case "camera-active":
      return "Camera active";
    case "https-required":
      return "HTTPS required";
    case "permission-denied":
      return "Permission denied";
    case "camera-unavailable":
      return "Camera unavailable";
    case "unsupported":
      return "Unsupported browser";
    case "in-app-browser":
      return "In-app browser";
    case "timeout":
      return "Camera timeout";
    case "detected":
      return "QR detected";
    case "error":
      return "Unknown camera error";
    case "idle":
    default:
      return "Idle";
  }
}

function decodeQrFromCanvas(
  canvas: HTMLCanvasElement,
  source: HTMLVideoElement | HTMLImageElement,
  width: number,
  height: number
) {
  if (width <= 0 || height <= 0) return null;

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(source, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth"
  });

  return qrCode?.data?.trim() || null;
}

function loadImageFromObjectUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("QR_IMAGE_LOAD_FAILED"));
    image.src = url;
  });
}

export function StaffQrCameraScanner({ disabled, variant = "default", onQrPayloadDetected }: StaffQrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cameraRequestIdRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const decodedRef = useRef(false);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("Allow camera access to scan the QR code displayed at the school office or gate.");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<CameraDiagnostics | null>(null);
  const [imageDecodeStatus, setImageDecodeStatus] = useState<ImageDecodeStatus>("idle");
  const [imageDecodeMessage, setImageDecodeMessage] = useState<string | null>(null);

  const clearVideoPreview = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.pause();
    videoElement.srcObject = null;
    videoElement.removeAttribute("src");
    videoElement.load();
  }, []);

  const stopDecodeLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const stopActiveCamera = useCallback(() => {
    stopDecodeLoop();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    clearVideoPreview();
  }, [clearVideoPreview, stopDecodeLoop]);

  const stopCameraSession = useCallback(() => {
    cameraRequestIdRef.current += 1;
    stopActiveCamera();
    decodedRef.current = false;
  }, [stopActiveCamera]);

  const submitDetectedPayload = useCallback((qrPayload: string) => {
    if (decodedRef.current) return;

    decodedRef.current = true;
    stopActiveCamera();
    setStatus("detected");
    setCameraError(null);
    setMessage("QR detected. Submitting attendance...");
    onQrPayloadDetected(qrPayload);
  }, [onQrPayloadDetected, stopActiveCamera]);

  const scanVideoFrame = useCallback(() => {
    animationFrameRef.current = null;
    if (decodedRef.current || !streamRef.current) return;

    const videoElement = videoRef.current;
    if (videoElement && videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const qrPayload = decodeQrFromCanvas(canvas, videoElement, videoElement.videoWidth, videoElement.videoHeight);
      if (qrPayload) {
        submitDetectedPayload(qrPayload);
        return;
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(scanVideoFrame);
  }, [submitDetectedPayload]);

  const startDecodeLoop = useCallback(() => {
    stopDecodeLoop();
    animationFrameRef.current = window.requestAnimationFrame(scanVideoFrame);
  }, [scanVideoFrame, stopDecodeLoop]);

  const stopScanner = useCallback((nextStatus: ScannerStatus = "idle") => {
    stopCameraSession();
    setStatus(nextStatus);
    if (nextStatus === "idle") {
      setMessage("Camera stopped. You can start it again or use manual token entry.");
    }
  }, [stopCameraSession]);

  useEffect(() => {
    setDiagnostics(getCameraDiagnostics());
    return () => {
      mountedRef.current = false;
      stopCameraSession();
    };
  }, [stopCameraSession]);

  useEffect(() => {
    const stopForPageLifecycle = () => {
      stopCameraSession();
    };
    const stopWhenHidden = () => {
      if (document.visibilityState === "hidden") stopCameraSession();
    };

    window.addEventListener("pagehide", stopForPageLifecycle);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.removeEventListener("pagehide", stopForPageLifecycle);
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, [stopCameraSession]);

  async function startCamera() {
    if (disabled || status === "checking-support" || status === "requesting-permission" || status === "camera-active") return;

    const requestId = cameraRequestIdRef.current + 1;
    cameraRequestIdRef.current = requestId;
    decodedRef.current = false;

    const currentDiagnostics = getCameraDiagnostics();
    setDiagnostics(currentDiagnostics);
    logCameraDiagnostics("start_camera_tap", currentDiagnostics);
    setStatus("checking-support");
    setCameraError(null);
    setImageDecodeMessage(null);
    setMessage("Checking camera support...");

    await waitForPaint();

    if (!currentDiagnostics.isSecureContext) {
      setStatus("https-required");
      setCameraError("Camera requires a secure HTTPS connection. Please open the approved HTTPS pilot link.");
      setMessage("Camera was not started because this page is not running in a secure browser context.");
      return;
    }

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      setStatus(currentDiagnostics.isLikelyInAppBrowser ? "in-app-browser" : "unsupported");
      setCameraError(
        currentDiagnostics.isLikelyInAppBrowser
          ? "This looks like an in-app browser. Open the approved HTTPS link in Safari or Chrome for camera access."
          : "Camera is not available in this browser context. Use the approved HTTPS link in Safari/Chrome."
      );
      setMessage("Use manual token entry or the QR image upload fallback if this browser does not expose camera access.");
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      setStatus("error");
      setCameraError("Camera preview is not ready. Please try again or use manual token entry.");
      return;
    }

    setStatus("requesting-permission");
    setCameraError(null);
    setMessage("Requesting camera permission...");
    await waitForPaint();

    let stream: MediaStream | null = null;
    try {
      stopActiveCamera();
      stream = await requestCameraStream(mediaDevices);

      if (!mountedRef.current || cameraRequestIdRef.current !== requestId) {
        stopMediaStream(stream);
        return;
      }

      streamRef.current = stream;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.setAttribute("playsinline", "true");
      videoElement.setAttribute("webkit-playsinline", "true");
      videoElement.srcObject = stream;

      try {
        await videoElement.play();
      } catch (playError) {
        stopMediaStream(stream);
        streamRef.current = null;
        clearVideoPreview();
        setStatus("error");
        setCameraError("Camera stream opened, but the video preview could not start. Please retry or use manual token entry.");
        setMessage("Camera preview playback failed.");
        logCameraDiagnostics("video_play_failed", getCameraDiagnostics());
        console.info("[JinaCampus Staff QR camera]", {
          eventName: "video_play_failed",
          errorName: playError instanceof DOMException ? playError.name : "UnknownError"
        });
        return;
      }

      if (!mountedRef.current || cameraRequestIdRef.current !== requestId) {
        stopMediaStream(stream);
        clearVideoPreview();
        return;
      }

      setStatus("camera-active");
      setMessage("Point your camera at the staff attendance QR. The scan submits automatically when detected.");
      startDecodeLoop();
    } catch (error) {
      if (cameraRequestIdRef.current !== requestId) {
        stopMediaStream(stream);
        return;
      }

      stopActiveCamera();
      stopMediaStream(stream);
      decodedRef.current = false;
      const safeError = cameraErrorMessage(error);
      setStatus(safeError.status);
      setCameraError(safeError.message);
      setMessage("Use manual token entry if camera scanning is unavailable.");
      console.info("[JinaCampus Staff QR camera]", {
        eventName: "camera_start_failed",
        errorName:
          error instanceof DOMException || error instanceof CameraTimeoutError ? error.name : "UnknownError"
      });
    }
  }

  async function decodeUploadedImage(file: File) {
    if (disabled || imageDecodeStatus === "decoding") return;

    setImageDecodeStatus("decoding");
    setImageDecodeMessage("Reading QR image...");
    setCameraError(null);

    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await loadImageFromObjectUrl(imageUrl);
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const qrPayload = decodeQrFromCanvas(canvas, image, image.naturalWidth, image.naturalHeight);
      if (!qrPayload) {
        setImageDecodeStatus("error");
        setImageDecodeMessage("Could not read a staff attendance QR from this image. Use a fresh QR photo or manual token entry.");
        return;
      }

      setImageDecodeStatus("idle");
      setImageDecodeMessage("QR image decoded. Submitting attendance...");
      onQrPayloadDetected(qrPayload);
    } catch {
      setImageDecodeStatus("error");
      setImageDecodeMessage("Could not read a staff attendance QR from this image. Use a fresh QR photo or manual token entry.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const isCheckingSupport = status === "checking-support";
  const isRequestingPermission = status === "requesting-permission";
  const isCameraActive = status === "camera-active";
  const startDisabled = disabled || isCheckingSupport || isRequestingPermission || isCameraActive;
  const startLabel = isCheckingSupport
    ? "Checking..."
    : isRequestingPermission
      ? "Requesting..."
      : isCameraActive
        ? "Camera Active"
        : "Start Camera";
  const isMobile = variant === "mobile";
  const sectionClassName = isMobile ? "space-y-4" : "premium-card p-4 sm:p-5";
  const previewClassName = isMobile
    ? "min-h-[42vh] w-full bg-slate-950 object-cover"
    : "aspect-[4/3] w-full max-h-[70vh] bg-slate-950 object-cover";

  return (
    <section className={sectionClassName} aria-labelledby="staff-camera-scanner-title">
      <div className={`flex flex-col gap-4 ${isMobile ? "" : "sm:flex-row sm:items-start sm:justify-between"}`}>
        <div>
          <h2 id="staff-camera-scanner-title" className={isMobile ? "text-base font-semibold text-slate-950" : "text-lg font-semibold text-slate-950"}>
            Scan QR
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Allow camera access to scan the QR code displayed at the school office or gate.
          </p>
        </div>
        <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "sm:flex sm:items-center"}`}>
          <button
            type="button"
            onClick={startCamera}
            disabled={startDisabled}
            className={`premium-primary-button min-h-12 w-full gap-2 premium-focus ${isMobile ? "text-base" : "sm:w-auto"}`}
          >
            {isCheckingSupport || isRequestingPermission ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden="true" />
            )}
            {startLabel}
          </button>
          <button
            type="button"
            onClick={() => stopScanner()}
            disabled={!isRequestingPermission && !isCameraActive}
            className={`premium-secondary-button min-h-12 w-full gap-2 premium-focus ${isMobile ? "text-base" : "sm:w-auto"}`}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>

      <div className={`${isMobile ? "" : "mt-5"} overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-inner`}>
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          {...{ "webkit-playsinline": "true" }}
          className={previewClassName}
          aria-label="Staff QR camera preview"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/88 p-3 text-sm leading-6 text-slate-600">
        <p className="mb-2 inline-flex min-h-8 items-center rounded-full bg-indigo-50 px-3 text-xs font-semibold text-indigo-700">
          {statusLabel(status)}
        </p>
        <p aria-live="polite">{message}</p>
        <p className="mt-2 text-xs text-slate-500">Camera scanning requires HTTPS in deployed environments. Localhost works for development.</p>
      </div>

      <div
        className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs leading-5 text-slate-600"
        data-camera-diagnostics="true"
      >
        <p className="font-semibold text-slate-800">Camera diagnostics</p>
        <dl className="mt-2 grid gap-1 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-700">Secure context</dt>
            <dd>{diagnostics?.isSecureContext ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">navigator.mediaDevices</dt>
            <dd>{diagnostics?.hasMediaDevices ? "Available" : "Missing"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">getUserMedia</dt>
            <dd>{diagnostics?.hasGetUserMedia ? "Available" : "Missing"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Likely in-app browser</dt>
            <dd>{diagnostics?.isLikelyInAppBrowser ? "Yes" : "No"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-slate-700">Current origin</dt>
            <dd className="break-all">{diagnostics?.origin ?? "Checking in browser..."}</dd>
          </div>
        </dl>
        <details className="mt-2">
          <summary className="cursor-pointer font-medium text-slate-700">Browser user agent</summary>
          <p className="mt-1 break-words">{diagnostics?.userAgent ?? "Checking in browser..."}</p>
        </details>
      </div>

      {cameraError ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <VideoOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{cameraError}</p>
        </div>
      ) : null}

      {diagnostics && !diagnostics.isSecureContext ? (
        <div
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
          data-camera-https-warning="true"
        >
          Camera requires a secure HTTPS connection. Please open the approved HTTPS pilot link.
        </div>
      ) : null}

      {diagnostics?.isLikelyInAppBrowser ? (
        <div
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
          data-camera-inapp-warning="true"
        >
          This looks like an in-app browser. Open the approved HTTPS link in Safari or Chrome for camera access.
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-3 text-sm leading-6 text-slate-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Upload QR image/photo</p>
            <p className="text-xs text-slate-500">
              Controlled fallback for camera failures. The server still validates branch, QR purpose, expiry, identity, and replay rules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || imageDecodeStatus === "decoding"}
            className="premium-secondary-button w-full gap-2 sm:w-auto premium-focus"
          >
            <ImageUp className="h-4 w-4" aria-hidden="true" />
            {imageDecodeStatus === "decoding" ? "Reading..." : "Upload QR image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={disabled || imageDecodeStatus === "decoding"}
            className="sr-only"
            aria-label="Upload QR image for attendance scan"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void decodeUploadedImage(file);
            }}
          />
        </div>
        {imageDecodeMessage ? <p className="mt-3 text-xs text-slate-600">{imageDecodeMessage}</p> : null}
      </div>
    </section>
  );
}
