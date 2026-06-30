"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface SelfieCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onClear: () => void;
  preview: string | null;
}

export function SelfieCapture({ onCapture, onClear, preview }: SelfieCaptureProps) {
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
    } catch {
      setCameraError("دسترسی به دوربین امکان‌پذیر نیست. از گالری انتخاب کنید.");
      fileInputRef.current?.click();
    }
  };

  useEffect(() => {
    if (mode === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        setMode("idle");
        onCapture(file, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file, URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleRetake = () => {
    onClear();
    startCamera();
  };

  if (mode === "camera") {
    return (
      <div className="selfie-camera">
        <div className="selfie-camera-viewport">
          <video ref={videoRef} autoPlay playsInline muted className="selfie-camera-video" />
        </div>
        <div className="selfie-camera-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { stopCamera(); setMode("idle"); }}>
            انصراف
          </button>
          <button type="button" className="btn btn-primary selfie-capture-btn" onClick={capturePhoto} aria-label="گرفتن عکس">
            <span className="capture-ring" />
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
            گالری
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={handleFileChange}
          hidden
        />
      </div>
    );
  }

  return (
    <div className="selfie-upload">
      <div className="selfie-dropzone" onClick={preview ? undefined : startCamera}>
        {preview ? (
          <img src={preview} alt="پیش‌نمایش سلفی" />
        ) : (
          <>
            <span className="dropzone-icon">📸</span>
            <span className="dropzone-text">باز کردن دوربین</span>
          </>
        )}
      </div>

      {cameraError && (
        <p style={{ fontSize: "0.75rem", color: "var(--danger)", textAlign: "center" }}>{cameraError}</p>
      )}

      <div className="selfie-actions-row">
        {!preview ? (
          <>
            <button type="button" className="btn btn-primary" onClick={startCamera}>
              📷 گرفتن سلفی
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
              انتخاب از گالری
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={handleRetake}>
              عکس مجدد
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
              انتخاب از گالری
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
        فرمت‌های مجاز: JPG, PNG, WebP — حداکثر ۵ مگابایت
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        onChange={handleFileChange}
        hidden
      />
    </div>
  );
}
