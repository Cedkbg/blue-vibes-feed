/**
 * Client-side video compression utility
 * Reduces video file size before upload for faster uploads on slow connections
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number; // in bits per second
  audioBitrate?: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  videoBitrate: 1_500_000, // 1.5 Mbps
};

export const compressVideo = (
  file: File,
  onProgress?: (progress: number) => void,
  options: CompressOptions = DEFAULT_OPTIONS
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already small enough (<5MB), skip compression
    if (file.size < 5 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const { maxWidth = 1280, maxHeight = 720 } = options;

      // Calculate scaled dimensions
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Ensure even dimensions (required for some codecs)
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      // Check if MediaRecorder supports webm
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const stream = canvas.captureStream(30);

      // Try to capture audio too
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      } catch {
        // No audio or unsupported - continue without
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitrate || DEFAULT_OPTIONS.videoBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: mimeType });
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, ".webm"),
          { type: mimeType, lastModified: Date.now() }
        );

        // Only use compressed if actually smaller
        if (compressedFile.size < file.size) {
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback: return original file
        resolve(file);
      };

      video.onplay = () => {
        recorder.start(1000); // Collect data every second

        const draw = () => {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);

          if (onProgress && video.duration) {
            onProgress(Math.min((video.currentTime / video.duration) * 100, 100));
          }

          requestAnimationFrame(draw);
        };
        draw();
      };

      video.onended = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      };

      video.play().catch(() => {
        URL.revokeObjectURL(url);
        resolve(file); // Fallback
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback
    };
  });
};

export const compressImage = async (
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<File> => {
  if (file.size < 500 * 1024) return file; // Skip if < 500KB

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name, { type: "image/webp", lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
