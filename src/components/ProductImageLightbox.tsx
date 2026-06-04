"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getOptimizedImageUrl } from "@/lib/cloudinaryHelper";

interface ProductImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function ProductImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
  productName,
}: ProductImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for tracking gestures
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Touch gesture refs
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchScaleRef = useRef<number>(1);
  const lastTouchTimeRef = useRef<number>(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update active index when initialIndex changes on open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex]);

  // Reset zoom states
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard navigation & body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, activeIndex, scale]);

  if (!isOpen || !mounted) return null;

  // Calculate boundary clamping for dragging
  const clampPosition = (x: number, y: number, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 };
    
    // Estimate bounds based on standard viewport dimensions
    const maxDragX = (window.innerWidth * (currentScale - 1)) / 2;
    const maxDragY = (window.innerHeight * (currentScale - 1)) / 2;
    
    return {
      x: Math.max(-maxDragX, Math.min(maxDragX, x)),
      y: Math.max(-maxDragY, Math.min(maxDragY, y)),
    };
  };

  const handleNextImage = () => {
    resetZoom();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    resetZoom();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoomIn = () => {
    setScale((prev) => {
      const next = Math.min(prev + 0.5, 4);
      return next;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    
    setScale((prev) => {
      const target = prev + direction * zoomFactor * prev;
      const nextScale = Math.min(Math.max(target, 1), 4);
      
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Adjust panning slightly to stay bounded
        setPosition((prevPos) => clampPosition(prevPos.x, prevPos.y, nextScale));
      }
      return nextScale;
    });
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = { x: position.x, y: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    const targetX = dragOffsetRef.current.x + dx;
    const targetY = dragOffsetRef.current.y + dy;
    
    setPosition(clampPosition(targetX, targetY, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      // Single touch: swipe or drag
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      dragOffsetRef.current = { x: position.x, y: position.y };
      
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2) {
      // Two touches: pinch-to-zoom
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      initialTouchDistanceRef.current = distance;
      initialTouchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      if (scale > 1 && isDragging) {
        // Dragging/panning
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;
        
        const targetX = dragOffsetRef.current.x + dx;
        const targetY = dragOffsetRef.current.y + dy;
        
        setPosition(clampPosition(targetX, targetY, scale));
      }
    } else if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      // Pinch to zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      const ratio = distance / initialTouchDistanceRef.current;
      const nextScale = Math.min(Math.max(initialTouchScaleRef.current * ratio, 1), 4);
      
      setScale(nextScale);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((prevPos) => clampPosition(prevPos.x, prevPos.y, nextScale));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(false);
    initialTouchDistanceRef.current = null;

    if (e.changedTouches.length === 1 && scale === 1) {
      // Check for swipe gesture when zoomed out
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Swipe horizontal threshold
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 100) {
        if (deltaX > 0) {
          handlePrevImage();
        } else {
          handleNextImage();
        }
      } else {
        // Check for double tap to zoom
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTouchTimeRef.current < DOUBLE_TAP_DELAY) {
          handleDoubleTap(touch.clientX, touch.clientY);
        }
        lastTouchTimeRef.current = now;
      }
    }
  };

  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      
      // Focus pan offset towards double tapped region
      const targetX = (window.innerWidth / 2 - clientX) * 1.5;
      const targetY = (window.innerHeight / 2 - clientY) * 1.5;
      
      setPosition(clampPosition(targetX, targetY, 2.5));
    }
  };

  const optimizedMainImage = getOptimizedImageUrl(images[activeIndex], 1400);

  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in touch-none"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header controls */}
      <header className="flex justify-between items-center px-6 py-4 z-10 w-full bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black text-[#38BDF8] tracking-widest uppercase">
            Denim Dynasty View
          </span>
          <span className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-md">
            {productName}
          </span>
        </div>

        {/* Counter index indicator */}
        <span className="text-xs font-bold text-neutral-400 bg-neutral-900/80 px-3 py-1.5 rounded-full">
          {activeIndex + 1} / {images.length}
        </span>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="text-white hover:text-[#38BDF8] p-2.5 bg-neutral-900/60 hover:bg-neutral-800/80 rounded-full transition cursor-pointer"
          aria-label="Close fullscreen view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Viewport Content */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden w-full">
        {/* Navigation Arrows */}
        {images.length > 1 && scale === 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 z-10 text-white hover:text-[#38BDF8] p-3.5 bg-neutral-900/60 hover:bg-neutral-900 rounded-full transition cursor-pointer md:left-6"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 z-10 text-white hover:text-[#38BDF8] p-3.5 bg-neutral-900/60 hover:bg-neutral-900 rounded-full transition cursor-pointer md:right-6"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Display Zoomed Image */}
        <div 
          className="w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
          style={{
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onClick={(e) => {
            // Click to zoom-in/out toggler on desktop
            if (e.target === imageRef.current) {
              if (scale > 1) {
                resetZoom();
              } else {
                setScale(2);
                const rect = imageRef.current.getBoundingClientRect();
                const targetX = (window.innerWidth / 2 - e.clientX) * 1.2;
                const targetY = (window.innerHeight / 2 - e.clientY) * 1.2;
                setPosition(clampPosition(targetX, targetY, 2));
              }
            }
          }}
        >
          <img
            ref={imageRef}
            src={optimizedMainImage}
            alt={`${productName} fullscreen active`}
            className={`max-w-full max-h-full object-contain pointer-events-none select-none ${
              isDragging ? "" : "transition-transform duration-200 ease-out"
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          />
        </div>
      </div>

      {/* Footer toolbar controls & Thumbnails Strip */}
      <footer className="w-full z-10 flex flex-col items-center bg-gradient-to-t from-black/80 to-transparent pb-6 pt-4 gap-4">
        {/* Floating Toolbar Panel */}
        <div className="flex items-center gap-4 bg-neutral-900/80 backdrop-blur-md px-5 py-2 rounded-full border border-neutral-800 shadow-xl">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className={`p-1.5 rounded-full transition ${
              scale <= 1 ? "text-neutral-600 cursor-not-allowed" : "text-white hover:text-[#38BDF8] cursor-pointer"
            }`}
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
          </button>

          {/* Scale indicator percentage */}
          <span className="text-[10px] font-bold text-neutral-300 min-w-[50px] text-center tracking-widest uppercase">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className={`p-1.5 rounded-full transition ${
              scale >= 4 ? "text-neutral-600 cursor-not-allowed" : "text-white hover:text-[#38BDF8] cursor-pointer"
            }`}
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
          </button>

          {/* Separator line */}
          <div className="h-4 w-px bg-neutral-800" />

          {/* Reset Zoom */}
          <button
            onClick={resetZoom}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className={`p-1.5 rounded-full transition ${
              scale === 1 && position.x === 0 && position.y === 0
                ? "text-neutral-600 cursor-not-allowed"
                : "text-white hover:text-[#38BDF8] cursor-pointer"
            }`}
            aria-label="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
            </svg>
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 max-w-[90%] overflow-x-auto pb-1 no-scrollbar justify-center">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  resetZoom();
                  setActiveIndex(idx);
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                  idx === activeIndex ? "border-[#38BDF8] scale-105" : "border-neutral-800 opacity-60 hover:opacity-100"
                }`}
                aria-label={`Go to image ${idx + 1}`}
              >
                <img
                  src={getOptimizedImageUrl(img, 120)}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>,
    document.body
  );
}
