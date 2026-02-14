import { useEffect, useState, useRef, useCallback } from "react";
import { Platform } from "react-native";

/**
 * Cross-platform audio player hook.
 * On native: uses expo-audio. On web: uses HTML5 Audio API.
 */
export function useSoundPlayer(url: string | null) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<any>(null);

  useEffect(() => {
    if (!url) {
      setIsReady(false);
      return;
    }

    const setup = async () => {
      try {
        if (Platform.OS === "web") {
          // Web: use HTML5 Audio
          const audio = new Audio(url);
          audio.preload = "auto";
          audio.addEventListener("canplaythrough", () => setIsReady(true));
          audio.addEventListener("ended", () => setIsPlaying(false));
          audio.addEventListener("error", () => {
            setError("Failed to load audio");
            setIsReady(false);
          });
          audioRef.current = audio;
        } else {
          // Native: use expo-audio
          const { createAudioPlayer, setAudioModeAsync } = await import("expo-audio");
          await setAudioModeAsync({ playsInSilentMode: true });
          const player = createAudioPlayer({ uri: url });
          audioRef.current = player;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to setup audio:", err);
        setError("Failed to setup audio player");
      }
    };

    setup();

    return () => {
      if (audioRef.current) {
        if (Platform.OS === "web") {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        } else {
          try {
            audioRef.current.remove?.();
          } catch {
            // ignore cleanup errors
          }
          audioRef.current = null;
        }
      }
    };
  }, [url]);

  const play = useCallback(async () => {
    if (!audioRef.current || !url) {
      setError("Audio not ready");
      return;
    }

    try {
      if (Platform.OS === "web") {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } else {
        audioRef.current.seekTo(0);
        audioRef.current.play();
      }
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
      setError("Failed to play audio");
    }
  }, [url]);

  const pause = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Failed to pause audio:", err);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        if (Platform.OS === "web") {
          audioRef.current.currentTime = 0;
        } else {
          audioRef.current.seekTo(0);
        }
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Failed to stop audio:", err);
    }
  }, []);

  return {
    isReady: isReady || (Platform.OS === "web" && !!url),
    isPlaying,
    error,
    play,
    pause,
    stop,
  };
}
