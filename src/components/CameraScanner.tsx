import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  SwitchCamera,
  Zap,
  ZapOff,
  Keyboard,
  QrCode,
  ScanFace,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Eye,
  Sliders,
} from 'lucide-react';
import { Pupil, ScanMethod } from '../types';
import { getAllPupils } from '../services/storage';
import {
  matchLiveVideoFace,
  preheatPupilDescriptors,
  FaceBoundingBox,
  BiometricSecurityMode,
} from '../services/faceRecognitionService';

interface CameraScannerProps {
  onScan: (
    decodedText: string,
    metadata?: {
      method: ScanMethod;
      confidence?: number;
      faceSnapshot?: string;
    }
  ) => void;
  paused?: boolean;
}

export type ScannerMode = 'AUTO' | 'FACE' | 'QR';

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, paused = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastFaceCheckTime = useRef<number>(0);

  // Multi-frame consensus tracking for zero-error verification
  const consecutiveFaceMatches = useRef<{
    studentId: string;
    count: number;
    lastSeen: number;
    bestConfidence: number;
    lastSnapshot?: string;
  }>({
    studentId: '',
    count: 0,
    lastSeen: 0,
    bestConfidence: 0,
  });

  const [pupils, setPupils] = useState<Pupil[]>(() => getAllPupils());
  const [scannerMode, setScannerMode] = useState<ScannerMode>('AUTO');
  const [securityMode, setSecurityMode] = useState<BiometricSecurityMode>('STRICT');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user'); // default to user for face recognition
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isScanningActive] = useState(true);

  // Biometric state tracking
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isRealFace, setIsRealFace] = useState(false);
  const [faceQuality, setFaceQuality] = useState(0);
  const [qualityFeedback, setQualityFeedback] = useState<string>('');
  const [activeFaceBox, setActiveFaceBox] = useState<FaceBoundingBox | null>(null);
  const [analyzingFace, setAnalyzingFace] = useState(false);
  const [ambiguousAlert, setAmbiguousAlert] = useState<string | null>(null);

  // Live consensus lock progression (0 to 3)
  const [consensusStep, setConsensusStep] = useState<number>(0);
  const [candidatePreview, setCandidatePreview] = useState<{
    pupil: Pupil;
    confidence: number;
    margin: number;
    snapshot?: string;
  } | null>(null);

  // Pre-warm pupil face descriptors on mount or when pupils change or window is focused
  useEffect(() => {
    const syncPupils = () => {
      const list = getAllPupils();
      setPupils(list);
      preheatPupilDescriptors(list);
    };
    syncPupils();
    window.addEventListener('focus', syncPupils);
    return () => window.removeEventListener('focus', syncPupils);
  }, []);

  // Stop camera helper
  const stopStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser/device.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setHasCameraPermission(true);

        // Check if flashlight torch is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        setHasTorch(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please allow camera permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No video camera detected on this system.');
      } else {
        setCameraError(err.message || 'Unable to start camera.');
      }
    }
  }, [facingMode, stopStream]);

  // Restart camera when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  // Execute manual face capture and match
  const handleManualFaceScan = async () => {
    if (!videoRef.current || paused) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setAnalyzingFace(true);
    setAmbiguousAlert(null);
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setAnalyzingFace(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const result = await matchLiveVideoFace(canvas, pupils, securityMode);

    setAnalyzingFace(false);
    if (result.isAmbiguous) {
      setAmbiguousAlert('Ambiguous facial match. Please look straight at the camera or scan your QR card.');
      return;
    }

    if (result.matchedPupil && result.isRealFace) {
      setCandidatePreview({
        pupil: result.matchedPupil,
        confidence: result.confidence,
        margin: Math.round(result.scoreMargin * 100),
        snapshot: result.faceSnapshot,
      });

      onScan(result.matchedPupil.studentId, {
        method: 'FACE_RECOGNITION',
        confidence: result.confidence,
        faceSnapshot: result.faceSnapshot,
      });
    } else {
      setAmbiguousAlert(result.qualityFeedback || 'No matching enrolled pupil recognized.');
    }
  };

  // Continuous live processing loop
  useEffect(() => {
    let active = true;

    const tick = async () => {
      if (!active) return;

      if (
        !paused &&
        isScanningActive &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const video = videoRef.current;
        let canvas = canvasRef.current;

        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasRef.current = canvas;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width && height) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);

            // 1. QR Code Scan (if mode is AUTO or QR)
            if (scannerMode === 'AUTO' || scannerMode === 'QR') {
              const imageData = ctx.getImageData(0, 0, width, height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                consecutiveFaceMatches.current = {
                  studentId: '',
                  count: 0,
                  lastSeen: 0,
                  bestConfidence: 0,
                };
                setConsensusStep(0);
                onScan(code.data, { method: 'QR_CODE' });
                animationFrameId.current = requestAnimationFrame(tick);
                return;
              }
            }

            // 2. High-Accuracy Biometric Face Recognition (if mode is AUTO or FACE)
            if (scannerMode === 'AUTO' || scannerMode === 'FACE') {
              const now = Date.now();
              // Check every 280ms for responsive tracking without CPU overload
              if (now - lastFaceCheckTime.current > 280) {
                lastFaceCheckTime.current = now;

                const matchResult = await matchLiveVideoFace(canvas, pupils, securityMode);
                setIsFaceDetected(matchResult.faceDetected);
                setIsRealFace(matchResult.isRealFace);
                setFaceQuality(matchResult.faceQuality);
                setQualityFeedback(matchResult.qualityFeedback || '');
                setActiveFaceBox(matchResult.faceBox || null);

                // Handle Ambiguity Warning
                if (matchResult.isAmbiguous) {
                  setAmbiguousAlert('Ambiguous Match: Face too similar to multiple students. Hold still.');
                  consecutiveFaceMatches.current = { studentId: '', count: 0, lastSeen: 0, bestConfidence: 0 };
                  setConsensusStep(0);
                  setCandidatePreview(null);
                } else {
                  setAmbiguousAlert(null);
                }

                // Consensus Logic: Require 3 consecutive frames in STRICT mode (2 in BALANCED mode)
                const requiredFrames = securityMode === 'STRICT' ? 3 : 2;

                if (matchResult.matchedPupil && matchResult.isRealFace && !matchResult.isAmbiguous) {
                  const candidateId = matchResult.matchedPupil.studentId;
                  const tracker = consecutiveFaceMatches.current;

                  // Check if previous frame was within 1200ms
                  const isRecent = now - tracker.lastSeen < 1200;

                  if (tracker.studentId === candidateId && isRecent) {
                    tracker.count++;
                    tracker.lastSeen = now;
                    tracker.bestConfidence = Math.max(tracker.bestConfidence, matchResult.confidence);
                    if (matchResult.faceSnapshot) tracker.lastSnapshot = matchResult.faceSnapshot;
                  } else {
                    consecutiveFaceMatches.current = {
                      studentId: candidateId,
                      count: 1,
                      lastSeen: now,
                      bestConfidence: matchResult.confidence,
                      lastSnapshot: matchResult.faceSnapshot,
                    };
                  }

                  const currentCount = consecutiveFaceMatches.current.count;
                  setConsensusStep(currentCount);

                  setCandidatePreview({
                    pupil: matchResult.matchedPupil,
                    confidence: matchResult.confidence,
                    margin: Math.round(matchResult.scoreMargin * 100),
                    snapshot: matchResult.faceSnapshot,
                  });

                  // If multi-frame consensus threshold is achieved!
                  if (currentCount >= requiredFrames) {
                    consecutiveFaceMatches.current = {
                      studentId: '',
                      count: 0,
                      lastSeen: 0,
                      bestConfidence: 0,
                    };
                    setConsensusStep(0);

                    onScan(matchResult.matchedPupil.studentId, {
                      method: 'FACE_RECOGNITION',
                      confidence: matchResult.confidence,
                      faceSnapshot: matchResult.faceSnapshot,
                    });
                  }
                } else {
                  // Decay consensus if face disappears or mismatch
                  if (now - consecutiveFaceMatches.current.lastSeen > 1200) {
                    consecutiveFaceMatches.current = {
                      studentId: '',
                      count: 0,
                      lastSeen: 0,
                      bestConfidence: 0,
                    };
                    setConsensusStep(0);
                    setCandidatePreview(null);
                  }
                }
              }
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [paused, isScanningActive, onScan, scannerMode, securityMode, pupils]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim(), { method: 'MANUAL' });
      setManualInput('');
    }
  };

  const requiredConsensus = securityMode === 'STRICT' ? 3 : 2;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Viewport Header Controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        {/* Mode Selector Tabs */}
        <div className="flex bg-neutral-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setScannerMode('AUTO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scannerMode === 'AUTO'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Dual Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('FACE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scannerMode === 'FACE'
                ? 'bg-[#0C4A34] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5 text-emerald-300" />
            <span>Face Biometrics</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('QR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scannerMode === 'QR'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-blue-300" />
            <span>QR Card</span>
          </button>
        </div>

        {/* Biometric Security Mode Selector */}
        {scannerMode !== 'QR' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-500">Security:</span>
            <button
              type="button"
              onClick={() => setSecurityMode(prev => (prev === 'STRICT' ? 'BALANCED' : 'STRICT'))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                securityMode === 'STRICT'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-300'
              }`}
              title={
                securityMode === 'STRICT'
                  ? 'Zero-Error Mode: Requires 78%+ match, 7% runner-up margin, and 3-frame consensus'
                  : 'Balanced Mode: 72%+ match and 2-frame consensus'
              }
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{securityMode === 'STRICT' ? 'Zero-Error (Strict)' : 'Balanced'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Video Viewfinder Container */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/11 bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border-2 border-neutral-300 flex items-center justify-center">
        {/* Live Camera Video Feed */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          playsInline
          muted
        />

        {/* Hidden Canvas for Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* VIEWPORT OVERLAYS */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
          {/* FACE RECOGNITION OR DUAL RETICLE */}
          {scannerMode !== 'QR' ? (
            <div className="relative flex flex-col items-center justify-center">
              {/* Biometric Face Oval Target with Dynamic Border States */}
              <div
                className={`relative w-48 sm:w-52 h-64 rounded-[50%/60%] border-2 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.56)] flex items-center justify-center ${
                  consensusStep >= requiredConsensus
                    ? 'border-emerald-400 ring-4 ring-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                    : consensusStep > 0
                    ? 'border-blue-400 ring-2 ring-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse'
                    : ambiguousAlert
                    ? 'border-amber-400 ring-2 ring-amber-400/60'
                    : isFaceDetected
                    ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : 'border-blue-300/70 border-dashed'
                }`}
              >
                {/* Anatomical Alignment Crosshairs */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/40 rounded-full" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-white/30 rounded-full" />
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white/30 rounded-full" />

                {/* Animated Biometric Scanning Wave */}
                {!paused && (
                  <div
                    className={`w-full h-1 shadow-[0_0_12px_#10b981] ${
                      consensusStep > 0
                        ? 'bg-gradient-to-r from-transparent via-blue-400 to-transparent'
                        : isFaceDetected
                        ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-blue-300 to-transparent'
                    }`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      animation: 'faceScanPulse 2.4s infinite ease-in-out',
                    }}
                  />
                )}

                {/* 4 Corner Crosshairs */}
                <div className="absolute top-2 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-300" />
                <div className="absolute top-2 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-300" />
                <div className="absolute bottom-2 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-300" />
                <div className="absolute bottom-2 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-300" />

                {/* Multi-Frame Consensus Progress Ring */}
                {consensusStep > 0 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-900 text-white font-mono text-[10px] font-bold border border-blue-400 flex items-center gap-1 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    <span>
                      Locking Consensus {consensusStep}/{requiredConsensus}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Indicator Pill */}
              <div className="mt-4 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white border border-white/20 shadow-lg">
                {ambiguousAlert ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-200">{ambiguousAlert}</span>
                  </>
                ) : candidatePreview && consensusStep > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-emerald-300">
                      Identified: <strong>{candidatePreview.pupil.name}</strong> ({candidatePreview.confidence}% · +{candidatePreview.margin}% margin)
                    </span>
                  </>
                ) : isFaceDetected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-emerald-300">
                      {qualityFeedback || 'Face Detected · Analyzing High-Dimensional Biometrics...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span>
                      {scannerMode === 'AUTO'
                        ? 'Position face or hold Pupil ID QR inside'
                        : 'Align pupil face inside oval frame'}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* QR-ONLY VIEWFINDER TARGET */
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 border-2 border-blue-400 rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400" />

                {!paused && (
                  <div
                    className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_#3b82f6] animate-pulse"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      animation: 'scanLine 2.2s infinite ease-in-out',
                    }}
                  />
                )}
              </div>

              <div className="mt-4 bg-black/75 backdrop-blur-sm px-3.5 py-1 rounded-full text-[11px] font-medium text-blue-100 tracking-wide text-center border border-white/10">
                Align Pupil ID QR Code inside frame
              </div>
            </div>
          )}
        </div>

        {/* Live Top Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-amber-300 uppercase tracking-widest border border-white/10">
            {scannerMode === 'AUTO' ? '⚡ Dual Mode' : scannerMode === 'FACE' ? '👤 Face Biometrics' : '📷 QR Card'}
          </div>
          {scannerMode !== 'QR' && (
            <div className="px-2 py-0.5 rounded-md bg-emerald-950/70 backdrop-blur-sm text-[10px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{securityMode === 'STRICT' ? 'Zero-Error Margin' : 'Balanced'}</span>
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm cursor-pointer"
              title="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-4 h-4 text-amber-400" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={toggleCameraFacing}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm cursor-pointer"
            title={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} Camera`}
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Shutter Snap Face Button */}
        {scannerMode !== 'QR' && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-auto">
            <button
              type="button"
              onClick={handleManualFaceScan}
              disabled={analyzingFace || paused}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0C4A34]/90 hover:bg-[#0C4A34] text-white text-xs font-bold backdrop-blur-md shadow-lg border border-amber-300/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzingFace ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Deep Biometric Matching...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-3.5 h-3.5 text-amber-300" />
                  <span>Scan / Recognize Face Now</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Camera Permission / Error Overlay */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <Camera className="w-12 h-12 text-neutral-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Camera Feed Inactive</h4>
            <p className="text-xs text-neutral-300 max-w-xs mb-4">
              {cameraError || 'Camera permissions might be disabled or in use by another application.'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Retry Camera Access
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; opacity: 0.2; }
          50% { top: 88%; opacity: 1; }
          100% { top: 10%; opacity: 0.2; }
        }
        @keyframes faceScanPulse {
          0% { top: 18%; opacity: 0.3; }
          50% { top: 82%; opacity: 1; }
          100% { top: 18%; opacity: 0.3; }
        }
      `}</style>

      {/* Manual Input Form */}
      <div className="w-full max-w-md mt-4 bg-white border border-neutral-200 rounded-xl p-3 shadow-xs">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
              <Keyboard className="w-4 h-4 text-blue-600" />
            </div>
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value.toUpperCase())}
              placeholder="Or enter Student ID (e.g. STU-000001)"
              className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Record Scan
          </button>
        </form>
      </div>

      {/* Biometric Pupil Face Test Simulator */}
      <div className="w-full max-w-md mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
            <ScanFace className="w-3.5 h-3.5 text-emerald-700" />
            <span>Test Pupil Face Recognition Simulator:</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
            Click pupil to simulate gate camera
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pupils.slice(0, 4).map(pupil => (
            <button
              key={pupil.id}
              type="button"
              onClick={() => {
                onScan(pupil.studentId, {
                  method: 'FACE_RECOGNITION',
                  confidence: 96,
                  faceSnapshot: pupil.photo,
                });
              }}
              className="flex items-center gap-2 p-1.5 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-lg transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="w-7 h-7 rounded-md overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                {pupil.photo ? (
                  <img src={pupil.photo} alt={pupil.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-emerald-800">
                    {pupil.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-neutral-900 truncate leading-tight group-hover:text-emerald-900">
                  {pupil.name.split(' ')[0]}
                </div>
                <div className="text-[9px] font-mono text-emerald-700 font-semibold truncate leading-none">
                  {pupil.studentId}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
