"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { Box, IconButton, Typography } from "@mui/material";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";

// One object URL per File, so previews survive re-renders; released when the file is removed
const previewUrls = new WeakMap<File, string>();
const previewUrl = (file: File) => {
  let url = previewUrls.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    previewUrls.set(file, url);
  }
  return url;
};

interface MediaDropzoneProps {
  kind: "image" | "video";
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  max: number;
  maxBytes: number;
  /** Called with a message when files are skipped (too big, wrong type, over the limit) */
  onReject: (message: string) => void;
}

/** Drag-and-drop (or click) file picker with thumbnail previews. */
function MediaDropzone({
  kind,
  label,
  files,
  onChange,
  max,
  maxBytes,
  onReject,
}: MediaDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = files.length >= max;
  const maxMb = Math.round(maxBytes / 1024 / 1024);

  const addFiles = (incoming: File[]) => {
    const ofKind = incoming.filter((f) => f.type.startsWith(`${kind}/`));
    const tooBig = ofKind.filter((f) => f.size > maxBytes);
    const accepted = ofKind.filter((f) => f.size <= maxBytes).slice(0, max - files.length);
    const problems: string[] = [];
    if (ofKind.length < incoming.length) problems.push(`Only ${kind} files can be added here.`);
    if (tooBig.length) {
      problems.push(
        `${tooBig.map((f) => f.name).join(", ")} ${tooBig.length === 1 ? "is" : "are"} larger than ${maxMb}MB.`,
      );
    }
    if (ofKind.length - tooBig.length > accepted.length) problems.push(`You can add up to ${max}.`);
    if (problems.length) onReject(problems.join(" "));
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // Allow picking the same file again after removing it
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!full) addFiles(Array.from(e.dataTransfer.files));
  };

  const remove = (index: number) => {
    const file = files[index];
    const url = file && previewUrls.get(file);
    if (url) URL.revokeObjectURL(url);
    if (file) previewUrls.delete(file);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box
        component="label"
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          p: 3,
          textAlign: "center",
          borderRadius: 4,
          border: "2px dashed",
          borderColor: dragging ? "primary.main" : "divider",
          bgcolor: dragging ? "rgba(var(--mui-palette-primary-mainChannel) / 0.06)" : "transparent",
          cursor: full ? "not-allowed" : "pointer",
          opacity: full ? 0.6 : 1,
          transition: "border-color 0.2s, background-color 0.2s",
          "&:hover": full ? undefined : { borderColor: "primary.main" },
          "&:focus-within": { borderColor: "primary.main" },
        }}
      >
        <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" color="text.secondary">
          {full
            ? `Limit reached (${max})`
            : `Drag & drop or click to browse · up to ${max}, ${maxMb}MB each`}
        </Typography>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={`${kind}/*`}
          multiple
          onChange={handleInput}
          disabled={full}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
        />
      </Box>

      {files.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
            gap: 1.5,
            mt: 1.5,
          }}
        >
          {files.map((file, index) => (
            <Box
              key={`${file.name}-${file.lastModified}-${index}`}
              sx={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 3,
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
                "& img, & video": {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                },
              }}
            >
              {kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={previewUrl(file)} alt={file.name} />
              ) : (
                <video src={previewUrl(file)} muted playsInline />
              )}
              <IconButton
                size="small"
                aria-label={`Remove ${file.name}`}
                onClick={() => remove(index)}
                sx={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  color: "common.white",
                  bgcolor: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default MediaDropzone;
