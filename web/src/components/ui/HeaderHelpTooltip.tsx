"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderHelpTooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}

export function HeaderHelpTooltip({
  label,
  children,
  className,
  panelClassName,
}: HeaderHelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex shrink-0 rounded-sm text-command-text-muted transition-colors hover:text-command-teal-bright focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-command-teal-bright",
          className,
        )}
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className={cn(
              "w-56 max-w-[min(16rem,calc(100vw-1.5rem))] rounded-lg border border-command-border bg-command-card-elevated p-2.5 text-left normal-case shadow-lg",
              panelClassName,
            )}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
