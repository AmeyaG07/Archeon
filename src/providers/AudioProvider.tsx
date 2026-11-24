"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSfx: (name: string) => void;
  hasInteracted: boolean;
  setHasInteracted: (val: boolean) => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: true,
  toggleMute: () => {},
  playSfx: () => {},
  hasInteracted: false,
  setHasInteracted: () => {}
});

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<HTMLAudioElement | null>(null);
  const sfxCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Initialize audio elements once mounted
  useEffect(() => {
    const bg = new Audio("/audio/music-highq.ogg");
    bg.loop = true;
    bg.volume = 0.25;
    bgMusicRef.current = bg;

    const room = new Audio("/audio/room.ogg");
    room.loop = true;
    room.volume = 0.2;
    roomRef.current = room;

    const sfxFiles = [
      "ui-short",
      "ui-long",
      "click-project",
      "enter-project",
      "leave-project",
      "beeps",
      "beeps2",
      "beeps3",
      "manifesto",
      "logo"
    ];

    sfxFiles.forEach((name) => {
      const audio = new Audio(`/audio/${name}.ogg`);
      audio.volume = 0.4;
      sfxCache.current.set(name, audio);
    });

    return () => {
      bg.pause();
      room.pause();
    };
  }, []);

  const playSfx = useCallback((name: string) => {
    if (isMuted) return;
    const sound = sfxCache.current.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setHasInteracted(true);
      if (bgMusicRef.current && roomRef.current) {
        if (!next) {
          bgMusicRef.current.play().catch(() => {});
          roomRef.current.play().catch(() => {});
        } else {
          bgMusicRef.current.pause();
          roomRef.current.pause();
        }
      }
      return next;
    });
  }, []);

  // Listen for initial user gesture to enable audio context if unmuted
  useEffect(() => {
    const handleFirstGesture = () => {
      setHasInteracted(true);
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
    window.addEventListener("pointerdown", handleFirstGesture);
    window.addEventListener("keydown", handleFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playSfx, hasInteracted, setHasInteracted }}>
      {children}
    </AudioContext.Provider>
  );
}
