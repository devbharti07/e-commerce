"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "none";
  durationMs?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
  durationMs = 600,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user prefers reduced motion, show immediately
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return "translateY(24px)";
      case "down":
        return "translateY(-24px)";
      case "left":
        return "translateX(24px)";
      case "right":
        return "translateX(-24px)";
      case "scale":
        return "scale(0.96)";
      case "none":
      default:
        return "none";
    }
  };

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : getInitialTransform(),
    transitionProperty: "opacity, transform",
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: `${delayMs}ms`,
    willChange: "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
