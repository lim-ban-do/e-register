import React, { useState, useEffect, useRef } from 'react';
import { Pupil } from '../types';
import { getNextStudentId } from '../services/storage';
import { validateEnrollmentPhoto } from '../services/faceRecognitionService';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  SwitchCamera,
  User,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface PupilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    class: string;
    grade: string;
    status?: 'ACTIVE' | 'INACTIVE';
    photo?: string;
  }) => void;
  initialData?: Pupil | null;
}

export const PupilModal: React.FC<PupilModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [pupilClass, setPupilClass] = useState('A');
  const [grade, setGrade] = useState('12');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [autoId, setAutoId] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [biometricFeedback, setBiometricFeedback] = useState<{
    valid: boolean;
    qualityScore: number;
    feedback: string;
  } | null>(null);
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false);

  const applyPhotoWithValidation = async (photoUrl: string | undefined) => {
    setPhoto(photoUrl);
    if (!photoUrl) {
      setBiometricFeedback(null);
      return;
    }
    setIsValidatingPhoto(true);
    try {
      const res = await validateEnrollmentPhoto(photoUrl);
      setBiometricFeedback(res);
    } catch {
      setBiometricFeedback(null);
    } finally {
      setIsValidatingPhoto(false);
    }
  };

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start webcam
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error('Video play error:', e));
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser or upload an image file instead.'
          : 'Could not connect to camera. Please use file upload.'
      );
      setIsCameraActive(false);
    }
  };

  // Switch between front / back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Take snapshot from video feed
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Create square crop for portrait photo
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight, 480);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    if (facingMode === 'user') {
      // Mirror horizontally so snapshot feels natural
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    applyPhotoWithValidation(dataUrl);
    stopCamera();
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (!result) return;

      // Resize/crop image to square using canvas to keep localStorage light
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        const size = Math.min(img.width, img.height);
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDim, maxDim);
          applyPhotoWithValidation(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          applyPhotoWithValidation(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setPupilClass(initialData.class);
        setGrade(initialData.grade);
        setStatus(initialData.status);
        setAutoId(initialData.studentId);
        applyPhotoWithValidation(initialData.photo);
      } else {
        setName('');
        setPupilClass('A');
        setGrade('12');
        setStatus('ACTIVE');
        setAutoId(getNextStudentId());
        applyPhotoWithValidation(undefined);
      }
      setError(null);
      setCameraError(null);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, initialData]);

  // Connect video element when camera is active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the pupil full name.');
      return;
    }
    if (!pupilClass.trim()) {
      setError('Please select or specify a class section.');
      return;
    }
    if (!grade.trim()) {
      setError('Please select or enter the grade level.');
      return;
    }

    stopCamera();
    onSave({
      name: name.trim(),
      class: pupilClass.trim().toUpperCase(),
      grade: grade.trim(),
      status,
      photo: photo || undefined,
    });
    onClose();
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-blue-950">
              {initialData ? 'Edit Pupil Information' : 'Add New Pupil'}
            </h3>
            <p className="text-[11px] text-neutral-500">
              {initialData
                ? 'Update pupil classroom details and ID photo'
                : 'Enter details and capture or upload pupil ID photo'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Automatic ID Display Badge */}
        <div className="mb-4 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-800">
              {initialData ? 'Assigned Student ID' : 'Automatically Generated Student ID'}
            </div>
            <div className="font-mono text-sm font-bold text-blue-950 tracking-wider">
              {autoId || 'STU-000001'}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-800 font-semibold bg-white px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Unique Auto-ID</span>
          </div>
        </div>

        {/* Photo Upload or Capture Section */}
        <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-800">
              Pupil Photo (For ID Card)
            </label>
            <span className="text-[10px] font-medium text-slate-500">
              Capture or Upload
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Camera Viewfinder (when camera active) */}
          {isCameraActive ? (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-square max-w-[260px] mx-auto border-2 border-blue-600 flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-36 h-44 rounded-full border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-end justify-center pb-2">
                  <span className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded-full font-medium">
                    Align Face
                  </span>
                </div>
              </div>

              {/* Camera Action Overlay Controls */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between z-10">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                  title="Cancel camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              {/* Photo Preview Box */}
              <div className="relative group shrink-0">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-slate-300 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Pupil Portrait"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
                      <span className="text-[9px] font-semibold text-slate-400 leading-tight">
                        No Photo
                      </span>
                    </div>
                  )}
                </div>

                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(undefined)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md cursor-pointer transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Photo Action Buttons */}
              <div className="flex-1 w-full space-y-2 text-left">
                {photo ? (
                  <div>
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Photo Attached for ID Card</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retake with Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Different File</span>
                      </button>
                    </div>

                    {/* Real-Time Biometric Quality Validation Card */}
                    <div className="mt-2.5 p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-2xs">
                      {isValidatingPhoto ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          <span>Validating biometric facial landmarks...</span>
                        </div>
                      ) : biometricFeedback ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1 text-slate-800">
                              <ShieldCheck
                                className={`w-3.5 h-3.5 ${
                                  biometricFeedback.valid ? 'text-emerald-600' : 'text-amber-500'
                                }`}
                              />
                              Biometric Quality Score
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                                biometricFeedback.qualityScore >= 70
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : biometricFeedback.qualityScore >= 45
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {biometricFeedback.qualityScore}%
                            </span>
                          </div>
                          <p
                            className={`text-[10px] leading-tight ${
                              biometricFeedback.valid ? 'text-emerald-700 font-medium' : 'text-amber-700'
                            }`}
                          >
                            {biometricFeedback.feedback}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500">
                          <ShieldCheck className="w-3 h-3 text-slate-400" />
                          <span>Facial template ready for gate verification</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-600 mb-2 leading-tight">
                      Take a quick snapshot with webcam or upload a portrait picture for the pupil badge.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Capture Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <p className="text-[11px] text-red-600 mt-1.5 leading-tight">
                    {cameraError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pupil Details Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Pupil Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Pupil Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kenneth Limbando"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Grade */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Grade *
              </label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium cursor-pointer"
              >
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Class Section *
              </label>
              <select
                value={pupilClass}
                onChange={e => setPupilClass(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium cursor-pointer"
              >
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
                <option value="D">Class D</option>
                <option value="E">Class E</option>
              </select>
            </div>
          </div>

          {initialData && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Enrollment Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white cursor-pointer font-medium"
              >
                <option value="ACTIVE">Active (Can scan & record attendance)</option>
                <option value="INACTIVE">Inactive (Suspended or Transferred)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3.5 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {initialData ? 'Save Changes' : 'Generate Student ID & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
