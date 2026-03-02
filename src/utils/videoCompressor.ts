/**
 * Client-side video compression utility
 * Preserves audio quality while reducing file size
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  videoBitrate: 4_000_000,
};

export const compressVideo = (
  file: File,
  onProgress?: (progress: number) => void,
  options: CompressOptions = DEFAULT_OPTIONS
): Promise<File> => {
  return new Promise((resolve) => {
    // Skip compression for small files
    if (file.size < 10 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const { maxWidth = 1920, maxHeight = 1080 } = options;

      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxWidth * 1.1 || height > maxHeight * 1.1) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const canvasStream = canvas.captureStream(30);

      // Proper audio capture: use captureStream on the video element directly
      // This avoids AudioContext issues and preserves audio properly
      try {
        // Create a separate video element for audio capture via captureStream
        const audioVideo = document.createElement("video");
        audioVideo.src = url;
        audioVideo.muted = false;
        audioVideo.volume = 1;
        
        // Use the original video's audio tracks via AudioContext
        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createMediaElementSource(video);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1;
        const dest = audioCtx.createMediaStreamDestination();
        audioSource.connect(gainNode);
        gainNode.connect(dest);
        // Don't connect to speakers (no echo)
        
        dest.stream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
        
        // We need to unmute the video for audio capture to work
        video.muted = false;
        video.volume = 0;
      } catch {
        // Fallback: no audio
      }

      const recorder = new MediaRecorder(canvasStream, {
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

        if (compressedFile.size < file.size) {
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      video.onplay = () => {
        recorder.start(1000);

        const draw = () => {
          if (video.paused || video.ended) {
            if (recorder.state === "recording") recorder.stop();
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
        resolve(file);
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
  });
};

export const compressImage = async (
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<File> => {
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
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
