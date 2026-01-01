import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

const FileViewer = ({ files, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentFile = files[currentIndex];

  /* =======================
     HARD VIEW-ONLY PROTECTION
  ======================== */
  useEffect(() => {
    const disable = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disable);
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("contextmenu", disable);
      document.body.style.userSelect = "auto";
    };
  }, []);

  useEffect(() => {
    const type = getFileType(currentFile);
    if (type === "text" || type === "code") {
      loadTextContent();
    }
  }, [currentIndex]);

  /* =======================
     KEYBOARD CONTROLS
  ======================== */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && files.length > 1) handlePrevious();
      if (e.key === "ArrowRight" && files.length > 1) handleNext();
      if ((e.key === "+" || e.key === "=") && getFileType(currentFile) === "image")
        handleZoomIn();
      if ((e.key === "-" || e.key === "_") && getFileType(currentFile) === "image")
        handleZoomOut();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, files.length]);

  const loadTextContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(currentFile);
      const text = await res.text();
      setTextContent(text);
    } catch {
      setError("Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (url) => {
    const ext = url.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["txt", "md"].includes(ext)) return "text";
    if (["js", "jsx", "ts", "tsx", "html", "css", "json", "xml"].includes(ext))
      return "code";
    return "other";
  };

  const getFileName = (url) =>
    decodeURIComponent(url.split("/").pop().split("?")[0]);

  const handlePrevious = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : files.length - 1));
    resetState();
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < files.length - 1 ? i + 1 : 0));
    resetState();
  };

  const resetState = () => {
    setZoom(100);
    setError(null);
    setTextContent(null);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  /* =======================
     VIEW-ONLY RENDERING
  ======================== */
  const renderFileContent = () => {
    const type = getFileType(currentFile);

    if (type === "image") {
      return (
        <div className="flex justify-center items-center h-full relative">
          <img
            src={currentFile}
            alt=""
            draggable={false}
            style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}
            className="object-contain pointer-events-none"
          />
          <Watermark />
        </div>
      );
    }

    if (type === "pdf") {
      return (
        <div className="h-full relative">
          <iframe
            src={`${currentFile}#toolbar=0&navpanes=0&scrollbar=0`}
            title="PDF Viewer"
            className="w-full h-full"
          />
          <Watermark />
        </div>
      );
    }

    if (type === "text" || type === "code") {
      return (
        <div className="w-full h-full bg-gray-900 overflow-auto relative">
          <pre className="p-4 text-gray-100 text-sm font-mono whitespace-pre-wrap">
            {loading ? "Loading..." : textContent}
          </pre>
          <Watermark />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Preview not supported
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
        <div className="truncate">
          {getFileName(currentFile)} ({currentIndex + 1}/{files.length})
        </div>

        <div className="flex items-center gap-2">
          {getFileType(currentFile) === "image" && (
            <>
              <button onClick={handleZoomOut}><ZoomOut /></button>
              <span>{zoom}%</span>
              <button onClick={handleZoomIn}><ZoomIn /></button>
            </>
          )}
          <button onClick={onClose}><X /></button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 relative">{error ? error : renderFileContent()}</div>

      {/* NAVIGATION */}
      {files.length > 1 && (
        <>
          <button onClick={handlePrevious} className="nav-left">
            <ChevronLeft />
          </button>
          <button onClick={handleNext} className="nav-right">
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

/* =======================
   WATERMARK COMPONENT
======================= */
const Watermark = () => (
  <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
    <span className="text-white text-5xl opacity-10 rotate-[-30deg]">
      VIEW ONLY
    </span>
  </div>
);

export default FileViewer;
