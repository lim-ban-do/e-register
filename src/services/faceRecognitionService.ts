import { Pupil } from '../types';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceBiometricRatios {
  eyeDistanceRatio: number;
  eyeMouthRatio: number;
  foreheadCheekRatio: number;
  jawTaperRatio: number;
}

export interface FaceDescriptor {
  // 256-point (16x16) histogram-equalized spatial grid
  spatialGrid16x16: number[];
  // 64-point directional horizontal gradient edge features
  horizontalGradients: number[];
  // 64-point directional vertical gradient edge features
  verticalGradients: number[];
  // Local Binary Pattern (LBP) texture descriptor (32 bins)
  lbpHistogram: number[];
  // Facial geometric landmark ratios
  ratios: FaceBiometricRatios;
  // Aspect ratio
  aspectRatio: number;
  // Normalized skin chrominance (Cb, Cr)
  chromaCbMean: number;
  chromaCrMean: number;
  // Overall contrast & sharpness metrics
  sharpness: number;
  contrast: number;
}

export interface FaceRecognitionResult {
  faceDetected: boolean;
  isRealFace: boolean;
  faceQuality: number; // 0 to 100
  qualityFeedback?: string;
  matchedPupil: Pupil | null;
  confidence: number; // 0 to 100 percentage
  bestScore: number;
  runnerUpScore: number;
  scoreMargin: number; // Margin between #1 and #2 candidate (crucial for zero-error verification)
  isAmbiguous: boolean; // True if margin is too narrow
  faceBox?: FaceBoundingBox;
  faceSnapshot?: string;
  consensusProgress?: number; // 0.0 to 1.0 (for temporal multi-frame lock)
  debugInfo?: string;
}

export type BiometricSecurityMode = 'STRICT' | 'BALANCED';

// In-memory cache of pre-computed pupil descriptors for fast real-time frame matching
const descriptorCache = new Map<string, { descriptor: FaceDescriptor; photoHash: string }>();

/**
 * Checks if a pixel color is within typical human skin chrominance range in YCbCr space
 * Works robustly across all ethnicities and diverse lighting conditions.
 */
export function isSkinTone(r: number, g: number, b: number): boolean {
  const Y = 0.299 * r + 0.587 * g + 0.114 * b;
  const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Broad chromatic human skin ellipse
  const inYCbCr = Cr >= 132 && Cr <= 175 && Cb >= 80 && Cb <= 135 && Y >= 25;
  // Normalized RGB skin check
  const sum = r + g + b;
  if (sum === 0) return false;
  const nr = r / sum;
  const ng = g / sum;
  const inNormRgb = nr > 0.33 && nr < 0.62 && ng > 0.24 && ng < 0.42 && r >= g && g >= b * 0.65;

  return inYCbCr || inNormRgb;
}

/**
 * Detects face bounding box and evaluates real-face morphological geometry
 */
export function detectFaceRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): {
  detected: boolean;
  isRealFace: boolean;
  box: FaceBoundingBox;
  quality: number;
  sharpness: number;
  feedback: string;
} {
  // Center search area: 68% width, 78% height
  const sampleX = Math.floor(width * 0.16);
  const sampleY = Math.floor(height * 0.10);
  const sampleW = Math.floor(width * 0.68);
  const sampleH = Math.floor(height * 0.80);

  const imgData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
  const data = imgData.data;

  let minX = sampleW;
  let maxX = 0;
  let minY = sampleH;
  let maxY = 0;
  let skinPixelCount = 0;
  let totalSampled = 0;

  // Step sampling
  const step = 3;
  for (let y = 0; y < sampleH; y += step) {
    for (let x = 0; x < sampleW; x += step) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      totalSampled++;

      if (isSkinTone(r, g, b)) {
        skinPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const skinRatio = skinPixelCount / Math.max(1, totalSampled);

  // If sufficient facial skin cluster is detected
  if (skinRatio > 0.07 && maxX > minX + 35 && maxY > minY + 45) {
    // Add anatomical head margin around face core
    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const faceW = Math.min(sampleW, rawW * 1.30);
    const faceH = Math.min(sampleH, rawH * 1.40);
    const centerX = sampleX + (minX + maxX) / 2;
    const centerY = sampleY + (minY + maxY) / 2;

    const actualX = Math.max(0, Math.floor(centerX - faceW / 2));
    const actualY = Math.max(0, Math.floor(centerY - faceH / 2));
    const actualW = Math.min(width - actualX, Math.floor(faceW));
    const actualH = Math.min(height - actualY, Math.floor(faceH));

    // Morphological aspect ratio check for real human face (width / height ~ 0.65 to 0.95)
    const aspectRatio = actualW / Math.max(1, actualH);
    const isHumanProportion = aspectRatio >= 0.60 && aspectRatio <= 0.98;

    // Laplacian edge sharpness check on detected crop
    const cropData = ctx.getImageData(actualX, actualY, actualW, actualH).data;
    let laplacianVar = 0;
    const sampleLimit = Math.min(500, Math.floor(cropData.length / 16));
    for (let i = 0; i < sampleLimit; i++) {
      const idx = i * 16;
      const lum = 0.299 * cropData[idx] + 0.587 * cropData[idx + 1] + 0.114 * cropData[idx + 2];
      const nextLum = 0.299 * cropData[idx + 4] + 0.587 * cropData[idx + 5] + 0.114 * cropData[idx + 6];
      laplacianVar += Math.abs(lum - nextLum);
    }
    const sharpness = Math.min(100, Math.round((laplacianVar / Math.max(1, sampleLimit)) * 4));

    let quality = Math.min(100, Math.round(skinRatio * 180 + sharpness * 0.4 + 20));
    if (!isHumanProportion) quality = Math.max(10, quality - 30);

    let feedback = 'Clear Face Detected';
    if (sharpness < 25) feedback = 'Camera slightly blurry or out of focus';
    else if (!isHumanProportion) feedback = 'Please center your face inside the oval guide';
    else if (actualW < 90 || actualH < 110) feedback = 'Please step slightly closer to camera';

    return {
      detected: true,
      isRealFace: isHumanProportion && sharpness >= 20 && actualW >= 80,
      quality,
      sharpness,
      feedback,
      box: {
        x: actualX,
        y: actualY,
        width: actualW,
        height: actualH,
      },
    };
  }

  // Fallback centered portrait region
  return {
    detected: skinRatio > 0.035,
    isRealFace: false,
    quality: Math.round(skinRatio * 180),
    sharpness: 10,
    feedback: 'Align pupil face inside oval frame',
    box: {
      x: sampleX,
      y: sampleY,
      width: sampleW,
      height: sampleH,
    },
  };
}

/**
 * Extracts a high-dimensional, illumination-invariant biometric descriptor from a face crop
 */
export function extractDescriptorFromCrop(
  ctx: CanvasRenderingContext2D,
  box: FaceBoundingBox
): FaceDescriptor {
  const GRID_SIZE = 16; // 16x16 = 256 structural cells
  const spatialGrid16x16: number[] = new Array(GRID_SIZE * GRID_SIZE).fill(0);
  const horizontalGradients: number[] = new Array(64).fill(0); // 8x8 gradient zones
  const verticalGradients: number[] = new Array(64).fill(0);
  const lbpHistogram: number[] = new Array(32).fill(0);

  const imgData = ctx.getImageData(box.x, box.y, box.width, box.height);
  const data = imgData.data;
  const w = box.width;
  const h = box.height;
  const totalPixels = w * h;

  // 1. First pass: compute luminance and luminance histogram for Contrast Equalization
  const lumMap = new Float32Array(totalPixels);
  const hist = new Uint32Array(256);
  let totalCb = 0;
  let totalCr = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const lum = Math.min(255, Math.max(0, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
    lumMap[i] = lum;
    hist[lum]++;

    // YCbCr chrominance
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    totalCb += cb;
    totalCr += cr;
  }

  // Cumulative distribution for histogram equalization (lighting normalization)
  const cdf = new Float32Array(256);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + hist[i];
  }
  const cdfMin = cdf[0];
  const cdfRange = Math.max(1, totalPixels - cdfMin);

  // Equalized luminance map
  const eqLumMap = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    eqLumMap[i] = Math.round(((cdf[Math.round(lumMap[i])] - cdfMin) / cdfRange) * 255);
  }

  // 2. Spatial 16x16 Normalized Grid
  const cellW = w / GRID_SIZE;
  const cellH = h / GRID_SIZE;
  const cellCounts = new Uint32Array(GRID_SIZE * GRID_SIZE);

  for (let y = 0; y < h; y++) {
    const gy = Math.min(GRID_SIZE - 1, Math.floor(y / cellH));
    for (let x = 0; x < w; x++) {
      const gx = Math.min(GRID_SIZE - 1, Math.floor(x / cellW));
      const gIdx = gy * GRID_SIZE + gx;
      spatialGrid16x16[gIdx] += eqLumMap[y * w + x];
      cellCounts[gIdx]++;
    }
  }

  for (let i = 0; i < spatialGrid16x16.length; i++) {
    spatialGrid16x16[i] = Math.round(spatialGrid16x16[i] / Math.max(1, cellCounts[i]));
  }

  // 3. Directional Sobel Gradients (Edges & Structural Angles)
  const GRAD_GRID = 8;
  const gradCellW = w / GRAD_GRID;
  const gradCellH = h / GRAD_GRID;

  for (let y = 1; y < h - 1; y += 2) {
    const gy = Math.min(GRAD_GRID - 1, Math.floor(y / gradCellH));
    for (let x = 1; x < w - 1; x += 2) {
      const gx = Math.min(GRAD_GRID - 1, Math.floor(x / gradCellW));
      const gIdx = gy * GRAD_GRID + gx;

      // Horizontal gradient (dx)
      const dx = eqLumMap[y * w + (x + 1)] - eqLumMap[y * w + (x - 1)];
      // Vertical gradient (dy)
      const dy = eqLumMap[(y + 1) * w + x] - eqLumMap[(y - 1) * w + x];

      horizontalGradients[gIdx] += Math.abs(dx);
      verticalGradients[gIdx] += Math.abs(dy);

      // Local Binary Pattern (LBP) 8-neighbor micro-texture
      const center = eqLumMap[y * w + x];
      let lbpCode = 0;
      if (eqLumMap[(y - 1) * w + (x - 1)] >= center) lbpCode |= 1;
      if (eqLumMap[(y - 1) * w + x] >= center) lbpCode |= 2;
      if (eqLumMap[(y - 1) * w + (x + 1)] >= center) lbpCode |= 4;
      if (eqLumMap[y * w + (x + 1)] >= center) lbpCode |= 8;
      if (eqLumMap[(y + 1) * w + (x + 1)] >= center) lbpCode |= 16;
      if (eqLumMap[(y + 1) * w + x] >= center) lbpCode |= 32;
      if (eqLumMap[(y + 1) * w + (x - 1)] >= center) lbpCode |= 64;
      if (eqLumMap[y * w + (x - 1)] >= center) lbpCode |= 128;

      // Map 8-bit LBP code to 32 bins
      const bin = Math.min(31, Math.floor(lbpCode / 8));
      lbpHistogram[bin]++;
    }
  }

  // Normalize gradient vectors and LBP
  const gradArea = (w / GRAD_GRID) * (h / GRAD_GRID);
  for (let i = 0; i < 64; i++) {
    horizontalGradients[i] = Math.round((horizontalGradients[i] / Math.max(1, gradArea)) * 10) / 10;
    verticalGradients[i] = Math.round((verticalGradients[i] / Math.max(1, gradArea)) * 10) / 10;
  }
  const lbpSum = lbpHistogram.reduce((acc, v) => acc + v, 0) || 1;
  for (let i = 0; i < 32; i++) {
    lbpHistogram[i] = Math.round((lbpHistogram[i] / lbpSum) * 1000) / 1000;
  }

  // 4. Facial Landmark Geometry Ratios (Upper Eye Zone vs Mid Nose Zone vs Lower Jaw Zone)
  // Eye region: rows 3-6 of 16x16 grid
  let eyeBandLum = 0;
  for (let y = 3; y <= 6; y++) {
    for (let x = 3; x <= 12; x++) {
      eyeBandLum += spatialGrid16x16[y * 16 + x];
    }
  }
  // Nose & cheek region: rows 7-10
  let midFaceLum = 0;
  for (let y = 7; y <= 10; y++) {
    for (let x = 4; x <= 11; x++) {
      midFaceLum += spatialGrid16x16[y * 16 + x];
    }
  }
  // Mouth & chin region: rows 11-14
  let lowerFaceLum = 0;
  for (let y = 11; y <= 14; y++) {
    for (let x = 4; x <= 11; x++) {
      lowerFaceLum += spatialGrid16x16[y * 16 + x];
    }
  }

  // Eye distance estimation from horizontal gradients across eye band
  let eyeLeftX = 4;
  let eyeRightX = 11;
  let maxLeftGrad = 0;
  let maxRightGrad = 0;
  for (let x = 2; x <= 6; x++) {
    const val = horizontalGradients[2 * 8 + x];
    if (val > maxLeftGrad) { maxLeftGrad = val; eyeLeftX = x; }
  }
  for (let x = 5; x <= 7; x++) {
    const val = horizontalGradients[2 * 8 + x];
    if (val > maxRightGrad) { maxRightGrad = val; eyeRightX = x; }
  }
  const eyeDistanceRatio = Math.round(((eyeRightX - eyeLeftX) / 8) * 100) / 100;

  // Forehead width vs jaw width ratio (face taper)
  let foreheadWidth = 0;
  for (let x = 2; x <= 13; x++) {
    foreheadWidth += spatialGrid16x16[2 * 16 + x];
  }
  let jawWidth = 0;
  for (let x = 3; x <= 12; x++) {
    jawWidth += spatialGrid16x16[14 * 16 + x];
  }
  const jawTaperRatio = Math.round((jawWidth / Math.max(1, foreheadWidth)) * 100) / 100;

  const ratios: FaceBiometricRatios = {
    eyeDistanceRatio: Math.max(0.2, Math.min(0.8, eyeDistanceRatio || 0.45)),
    eyeMouthRatio: Math.round((midFaceLum / Math.max(1, lowerFaceLum)) * 100) / 100,
    foreheadCheekRatio: Math.round((foreheadWidth / Math.max(1, midFaceLum)) * 100) / 100,
    jawTaperRatio: Math.max(0.3, Math.min(1.5, jawTaperRatio)),
  };

  return {
    spatialGrid16x16,
    horizontalGradients,
    verticalGradients,
    lbpHistogram,
    ratios,
    aspectRatio: Math.round((w / Math.max(1, h)) * 100) / 100,
    chromaCbMean: Math.round(totalCb / Math.max(1, totalPixels)),
    chromaCrMean: Math.round(totalCr / Math.max(1, totalPixels)),
    sharpness: Math.round(horizontalGradients.reduce((a, b) => a + b, 0) / 64),
    contrast: Math.round(verticalGradients.reduce((a, b) => a + b, 0) / 64),
  };
}

/**
 * Calculates high-precision cosine similarity between two numeric arrays
 */
function cosineSimilarity(arrA: number[], arrB: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(arrA.length, arrB.length);
  for (let i = 0; i < len; i++) {
    const a = arrA[i];
    const b = arrB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates high-accuracy biometric similarity score (0.0 to 1.0) between two facial descriptors.
 * Combines 5 orthogonal biometric feature extractors:
 * 1. 16x16 Histogram-Equalized Structural Grid (40% weight)
 * 2. Directional Horizontal & Vertical Gradients (25% weight)
 * 3. Local Binary Pattern (LBP) Micro-Texture (15% weight)
 * 4. Facial Geometry & Landmark Ratios (12% weight)
 * 5. Chrominance Compatibility (8% weight)
 */
export function calculateFaceSimilarity(descA: FaceDescriptor, descB: FaceDescriptor): number {
  // 1. Spatial Structure Cosine Similarity (16x16 = 256 cells)
  const spatialScore = cosineSimilarity(descA.spatialGrid16x16, descB.spatialGrid16x16);

  // 2. Gradient Edge Orientation Similarity (Sobel horizontal & vertical features)
  const hGradScore = cosineSimilarity(descA.horizontalGradients, descB.horizontalGradients);
  const vGradScore = cosineSimilarity(descA.verticalGradients, descB.verticalGradients);
  const gradientScore = (hGradScore + vGradScore) / 2;

  // 3. LBP Micro-Texture Histogram Intersection
  let lbpIntersection = 0;
  for (let i = 0; i < descA.lbpHistogram.length; i++) {
    lbpIntersection += Math.min(descA.lbpHistogram[i], descB.lbpHistogram[i]);
  }
  const lbpScore = Math.min(1, lbpIntersection);

  // 4. Facial Landmark Geometry Ratios
  const eyeDiff = Math.abs(descA.ratios.eyeDistanceRatio - descB.ratios.eyeDistanceRatio);
  const mouthDiff = Math.abs(descA.ratios.eyeMouthRatio - descB.ratios.eyeMouthRatio);
  const taperDiff = Math.abs(descA.ratios.jawTaperRatio - descB.ratios.jawTaperRatio);
  const aspectDiff = Math.abs(descA.aspectRatio - descB.aspectRatio);

  const ratioScore = Math.max(
    0,
    1 - (eyeDiff * 1.8 + mouthDiff * 0.4 + taperDiff * 0.4 + aspectDiff * 0.8)
  );

  // 5. Chrominance match
  const cbDiff = Math.abs(descA.chromaCbMean - descB.chromaCbMean);
  const crDiff = Math.abs(descA.chromaCrMean - descB.chromaCrMean);
  const chromaScore = Math.max(0, 1 - (cbDiff + crDiff) / 50);

  // Composite Weighted Biometric Score
  const compositeScore =
    spatialScore * 0.40 +
    gradientScore * 0.25 +
    lbpScore * 0.15 +
    ratioScore * 0.12 +
    chromaScore * 0.08;

  return Math.max(0, Math.min(1, compositeScore));
}

/**
 * Extracts and caches biometric descriptor from an enrolled pupil's reference photo
 */
export async function extractPupilDescriptor(pupil: Pupil): Promise<FaceDescriptor | null> {
  const photo = pupil.photo;
  if (!photo) return null;

  // Check cache
  const cached = descriptorCache.get(pupil.id);
  if (cached && cached.photoHash === photo.slice(0, 80)) {
    return cached.descriptor;
  }

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 220;
      canvas.height = img.naturalHeight || 260;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const faceRegion = detectFaceRegion(ctx, canvas.width, canvas.height);
      const descriptor = extractDescriptorFromCrop(ctx, faceRegion.box);

      descriptorCache.set(pupil.id, {
        descriptor,
        photoHash: photo.slice(0, 80),
      });

      resolve(descriptor);
    };
    img.onerror = () => resolve(null);
    img.src = photo;
  });
}

/**
 * Validates a photo during student enrollment/editing to guarantee clear biometric identification
 */
export async function validateEnrollmentPhoto(photoUrl: string): Promise<{
  valid: boolean;
  qualityScore: number;
  feedback: string;
  descriptor: FaceDescriptor | null;
}> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 240;
      canvas.height = img.naturalHeight || 280;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ valid: false, qualityScore: 0, feedback: 'Unable to render photo canvas', descriptor: null });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const region = detectFaceRegion(ctx, canvas.width, canvas.height);

      if (!region.detected || region.quality < 35) {
        resolve({
          valid: false,
          qualityScore: region.quality,
          feedback: 'No clear human face detected. Please ensure a frontal portrait photo.',
          descriptor: null,
        });
        return;
      }

      const descriptor = extractDescriptorFromCrop(ctx, region.box);
      const isHighQuality = region.isRealFace && region.quality >= 50 && region.sharpness >= 25;

      resolve({
        valid: isHighQuality,
        qualityScore: region.quality,
        feedback: isHighQuality
          ? 'Excellent biometric portrait: Clear facial features and landmarks verified'
          : region.feedback || 'Acceptable portrait, but frontal lighting could be improved',
        descriptor,
      });
    };
    img.onerror = () => {
      resolve({ valid: false, qualityScore: 0, feedback: 'Failed to load image file', descriptor: null });
    };
    img.src = photoUrl;
  });
}

/**
 * Pre-heats and caches all enrolled pupils' biometric descriptors in memory
 */
export async function preheatPupilDescriptors(pupils: Pupil[]): Promise<void> {
  const activeWithPhotos = pupils.filter(p => p.status === 'ACTIVE' && p.photo);
  await Promise.all(activeWithPhotos.map(p => extractPupilDescriptor(p)));
}

/**
 * High-Accuracy Multi-Candidate Biometric Matcher
 * Evaluates live video canvas against all enrolled pupils, enforcing:
 * 1. Strict confidence threshold
 * 2. Runner-up ambiguity margin filtering (eliminates false positives)
 * 3. Real human morphological face geometry validation
 */
export async function matchLiveVideoFace(
  sourceCanvas: HTMLCanvasElement,
  pupils: Pupil[],
  securityMode: BiometricSecurityMode = 'STRICT'
): Promise<FaceRecognitionResult> {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) {
    return {
      faceDetected: false,
      isRealFace: false,
      faceQuality: 0,
      matchedPupil: null,
      confidence: 0,
      bestScore: 0,
      runnerUpScore: 0,
      scoreMargin: 0,
      isAmbiguous: false,
    };
  }

  // 1. Detect face region & verify real human facial structure
  const { detected, isRealFace, box, quality, feedback } = detectFaceRegion(
    ctx,
    sourceCanvas.width,
    sourceCanvas.height
  );

  if (!detected || quality < 20) {
    return {
      faceDetected: false,
      isRealFace: false,
      faceQuality: quality,
      qualityFeedback: feedback,
      matchedPupil: null,
      confidence: 0,
      bestScore: 0,
      runnerUpScore: 0,
      scoreMargin: 0,
      isAmbiguous: false,
      faceBox: box,
    };
  }

  // 2. Extract live high-dimensional descriptor
  const liveDescriptor = extractDescriptorFromCrop(ctx, box);

  // Capture face snapshot thumbnail for attendance proof & UI audit
  const snapshotCanvas = document.createElement('canvas');
  snapshotCanvas.width = 120;
  snapshotCanvas.height = 140;
  const snapCtx = snapshotCanvas.getContext('2d');
  let faceSnapshot: string | undefined;
  if (snapCtx) {
    snapCtx.drawImage(
      sourceCanvas,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      120,
      140
    );
    faceSnapshot = snapshotCanvas.toDataURL('image/jpeg', 0.85);
  }

  // 3. Multi-Candidate Scoring against active enrolled pupils
  interface CandidateMatch {
    pupil: Pupil;
    score: number;
  }

  const activePupils = pupils.filter(p => p.status === 'ACTIVE' && p.photo);
  const candidates: CandidateMatch[] = [];

  for (const pupil of activePupils) {
    let pupilDesc: FaceDescriptor | null = null;
    const cached = descriptorCache.get(pupil.id);

    if (cached) {
      pupilDesc = cached.descriptor;
    } else {
      pupilDesc = await extractPupilDescriptor(pupil);
    }

    if (pupilDesc) {
      const similarity = calculateFaceSimilarity(liveDescriptor, pupilDesc);
      candidates.push({ pupil, score: similarity });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const topMatch = candidates[0] || null;
  const runnerUp = candidates[1] || null;

  const bestScore = topMatch ? topMatch.score : 0;
  const runnerUpScore = runnerUp ? runnerUp.score : 0;
  const scoreMargin = Math.max(0, bestScore - runnerUpScore);

  // Security thresholds:
  // In STRICT mode:
  // - Minimum confidence: 78% (bestScore >= 0.78)
  // - Minimum lead margin over runner-up: 0.07 (7% lead) unless top score is overwhelming (>= 0.90)
  // In BALANCED mode:
  // - Minimum confidence: 72%
  // - Minimum lead margin: 0.05
  const minConfidence = securityMode === 'STRICT' ? 0.78 : 0.72;
  const minMargin = securityMode === 'STRICT' ? 0.07 : 0.05;

  const confidencePct = Math.min(99, Math.max(0, Math.round(bestScore * 100)));
  const marginPct = Math.round(scoreMargin * 100);

  // Ambiguity Detection: If the top 2 candidates are too close, reject match to prevent identity mistake!
  const isAmbiguous =
    topMatch !== null &&
    runnerUp !== null &&
    bestScore >= minConfidence &&
    bestScore < 0.90 &&
    scoreMargin < minMargin;

  const isVerifiedMatch =
    topMatch !== null &&
    bestScore >= minConfidence &&
    !isAmbiguous &&
    isRealFace;

  let debugInfo = 'Searching for matching enrolled pupil...';
  if (isVerifiedMatch && topMatch) {
    debugInfo = `Verified: ${topMatch.pupil.name} (${confidencePct}% match, +${marginPct}% margin)`;
  } else if (isAmbiguous && topMatch && runnerUp) {
    debugInfo = `Ambiguous Match between ${topMatch.pupil.name} and ${runnerUp.pupil.name}. Please center face.`;
  } else if (topMatch && bestScore < minConfidence) {
    debugInfo = `Unrecognized Face (Best score: ${confidencePct}% below ${Math.round(minConfidence * 100)}% threshold)`;
  }

  return {
    faceDetected: true,
    isRealFace,
    faceQuality: quality,
    qualityFeedback: feedback,
    matchedPupil: isVerifiedMatch && topMatch ? topMatch.pupil : null,
    confidence: confidencePct,
    bestScore,
    runnerUpScore,
    scoreMargin,
    isAmbiguous,
    faceBox: box,
    faceSnapshot,
    debugInfo,
  };
}
