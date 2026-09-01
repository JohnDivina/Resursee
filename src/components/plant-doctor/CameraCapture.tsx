'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, ArrowsClockwise, Check } from '@phosphor-icons/react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file instead.');
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      setCapturedUrl(null);
      setCapturedBlob(null);
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, startCamera]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `plant-snapshot-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    onCapture(file);
    onClose();
  };

  const handleRetake = () => {
    setCapturedUrl(null);
    setCapturedBlob(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-white/20 bg-neutral-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Camera size={18} weight="bold" />
            </span>
            <span className="text-sm font-bold">Snap Plant or Leaf Photo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-xs text-rose-400">
              {cameraError}
            </div>
          ) : capturedUrl ? (
            <img
              src={capturedUrl}
              alt="Captured leaf preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Botanical Target Reticle */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-[24px] border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
                  <span className="font-mono text-[10px] text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full">
                    Center Leaf in Frame
                  </span>
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-5">
          {capturedUrl ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-700 active:scale-95 cursor-pointer"
              >
                <ArrowsClockwise size={15} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 cursor-pointer"
              >
                <Check size={16} weight="bold" />
                <span>Use this Photo</span>
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onClick={handleFlipCamera}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 active:scale-95 cursor-pointer"
                title="Switch camera"
              >
                <ArrowsClockwise size={20} />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/40 bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 hover:scale-105 active:scale-90 transition-transform cursor-pointer"
              >
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Camera size={24} weight="fill" />
                </div>
              </button>

              <div className="w-11" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
