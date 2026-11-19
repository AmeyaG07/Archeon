"use client";

import React from "react";
import { useAudio } from "@/providers/AudioProvider";
import { Volume2, VolumeX } from "lucide-react";

export function AudioToggle() {
  const { isMuted, toggleMute, playSfx } = useAudio();

  return (
    <button
      onClick={() => {
        playSfx("logo");
        toggleMute();
      }}
      className="group flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300 text-xs font-mono tracking-wider text-slate-300 hover:text-white"
      title={isMuted ? "Unmute ambient audio" : "Mute ambient audio"}
    >
      <div className="flex items-center space-x-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`w-0.5 rounded-full bg-cyan-400 transition-all duration-300 ${
              !isMuted
                ? "animate-pulse"
                : "h-1 opacity-40 group-hover:opacity-75"
            }`}
            style={{
              height: !isMuted ? `${(bar % 3 + 1) * 4}px` : "3px",
              animationDelay: `${bar * 150}ms`
            }}
          />
        ))}
      </div>
      <span className="text-[11px] uppercase tracking-widest font-mono">
        {isMuted ? "Sound Off" : "Sound On"}
      </span>
      {isMuted ? (
        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
      )}
    </button>
  );
}
