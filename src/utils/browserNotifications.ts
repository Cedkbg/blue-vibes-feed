// Browser Notifications API utility

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const showBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    onClick?: () => void;
  }
) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Don't show if app is focused
  if (document.hasFocus()) return;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: options?.tag,
      requireInteraction: options?.requireInteraction || false,
      silent: true, // We handle sounds ourselves
    });

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    // Auto-close after 8s for regular notifications
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 8000);
    }
  } catch {
    // Silent fail for environments that don't support Notification constructor
  }
};

export const getNotificationTitle = (type: string): string => {
  switch (type) {
    case "like": return "Nouveau J'aime ❤️";
    case "comment": return "Nouveau commentaire 💬";
    case "follow": return "Nouvel abonné 👤";
    case "message": return "Nouveau message 📩";
    case "live": return "Live en cours 🔴";
    default: return "Nouvelle notification";
  }
};
