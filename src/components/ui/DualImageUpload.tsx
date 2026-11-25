"use client";

import React, { useState, useRef } from "react";
import { Upload, Link2, Image as ImageIcon, X, CheckCircle2, HardDrive, Globe } from "lucide-react";

interface DualImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  placeholder?: string;
}

/**
 * Normalizes Google Drive and public links into direct embeddable image URLs
 */
export function normalizeDriveOrImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // Match Google Drive file ID:
  // e.g. drive.google.com/file/d/{ID}/... or drive.google.com/open?id={ID} or drive.google.com/uc?id={ID}
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    // Google's direct high-res image thumbnail endpoint for Drive files
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

export function DualImageUpload({
  label = "Upload Image / Photo",
  value,
  onChange,
  required = false,
  placeholder = "Paste Google Drive share link, Dropbox or image URL...",
}: DualImageUploadProps) {
  const [activeTab, setActiveTab] = useState<"device" | "drive">("device");
  const [driveInput, setDriveInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDriveSubmit = () => {
    if (!driveInput.trim()) return;
    const normalized = normalizeDriveOrImageUrl(driveInput);
    onChange(normalized);
  };

  const handleClear = () => {
    onChange("");
    setDriveInput("");
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Label & Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Source Toggle */}
        <div className="inline-flex self-start sm:self-auto shrink-0 rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("device")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xs transition-colors ${
              activeTab === "device"
                ? "bg-white font-semibold text-[#171717] shadow-2xs"
                : "text-[#77736C] hover:text-[#171717]"
            }`}
          >
            <HardDrive size={11} /> Device File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("drive")}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-xs transition-colors ${
              activeTab === "drive"
                ? "bg-white font-semibold text-[#171717] shadow-2xs"
                : "text-[#77736C] hover:text-[#171717]"
            }`}
          >
            <Globe size={11} /> Google Drive / URL
          </button>
        </div>
      </div>

      {/* Mode A: Local Device Upload */}
      {activeTab === "device" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-sm cursor-pointer transition-colors ${
            dragActive
              ? "border-[#A58A64] bg-[#F4EFE2]/40"
              : "border-[#D8D6D0] bg-white hover:border-[#A58A64]/70 hover:bg-[#FAF9F5]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <Upload size={20} className="text-[#A58A64] mb-1.5" />
          <p className="font-mono text-xs font-semibold text-[#171717]">
            Click to upload from device, or drag & drop
          </p>
          <p className="font-mono text-[10px] text-[#77736C] mt-0.5">
            PNG, JPG, WEBP, or HEIC (Up to 15MB)
          </p>

          {fileName && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#EAF1E8] text-[#547A51] font-mono text-[10px]">
              <CheckCircle2 size={11} /> {fileName}
            </div>
          )}
        </div>
      )}

      {/* Mode B: Google Drive / Cloud Link Import */}
      {activeTab === "drive" && (
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 size={13} className="absolute left-3 top-2.5 text-[#A58A64]" />
              <input
                type="url"
                value={driveInput}
                onChange={(e) => setDriveInput(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] pl-8 pr-3 py-1.5 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleDriveSubmit}
              className="px-3 py-1.5 bg-[#171717] text-white font-mono text-[10px] uppercase tracking-wider rounded-sm hover:bg-[#A58A64] transition-colors shrink-0"
            >
              Apply Link
            </button>
          </div>
          <p className="font-mono text-[10px] text-[#77736C]">
            Tip: Paste any Google Drive &quot;Anyone with the link can view&quot; share link. It will be converted into a direct high-res image automatically.
          </p>
        </div>
      )}

      {/* Live Image Preview */}
      {value && (
        <div className="relative mt-2 p-2 rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-sm border border-[#D8D6D0] overflow-hidden bg-white shrink-0">
              <img
                src={value}
                alt="Upload preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold text-[#171717] flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#10B981]" /> Image Attached
              </p>
              <p className="font-mono text-[9px] text-[#77736C] truncate max-w-xs sm:max-w-md">
                {value.startsWith("data:") ? "Local file (Ready for submission)" : value}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-[#77736C] hover:text-red-600 transition-colors"
            title="Remove image"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
