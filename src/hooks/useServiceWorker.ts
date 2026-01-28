import { useEffect, useState } from "react";

export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      setRegistration(reg);
      setIsRegistered(true);
      console.log("Service Worker registered successfully");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  return { isRegistered, registration };
};
