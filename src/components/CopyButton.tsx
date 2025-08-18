import React, { useCallback, useEffect, useRef, useState } from "react";

export interface CopyButtonProps {
  /** The text to copy to the clipboard */
  text: string;
  /** Button content (defaults to "Copy") */
  children?: React.ReactNode;
  /** Message shown briefly after success (defaults to "Copied!") */
  successMessage?: string;
  /** Additional className for the button */
  className?: string;
  /** How long (ms) the success state stays visible */
  successTimeout?: number;
  /** Optional callback after successful copy */
  onCopy?: (text: string) => void;
}

/**
 * CopyButton - copies `text` to clipboard when clicked.
 * Provides accessible live-region feedback and a fallback for older browsers.
 */
export default function CopyButton({
  text,
  children,
  successMessage = "Copied!",
  className,
  successTimeout = 1500,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fallbackCopy = useCallback((value: string): boolean => {
    try {
      const textarea = document.createElement("textarea");
      // Prevent scrolling to bottom
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.width = "1px";
      textarea.style.height = "1px";
      textarea.style.padding = "0";
      textarea.style.border = "none";
      textarea.style.outline = "none";
      textarea.style.boxShadow = "none";
      textarea.style.background = "transparent";
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, value.length);
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const handleCopy = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      // Try clipboard API first
      let ok = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else {
          ok = fallbackCopy(text);
        }
      } catch (err) {
        console.error(err);
        // fallback
        ok = fallbackCopy(text);
      }

      if (ok) {
        setCopied(true);
        onCopy?.(text);

        // For screen readers: update live region text
        if (statusRef.current) {
          statusRef.current.textContent = successMessage;
        }

        // reset after timeout
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          if (statusRef.current) {
            statusRef.current.textContent = "";
          }
          timeoutRef.current = null;
        }, successTimeout);
      } else {
        // Optionally handle failure (e.g., show different UI). For now, brief console:
        console.warn("Copy to clipboard failed");
      }
    },
    [text, fallbackCopy, successMessage, successTimeout, onCopy]
  );

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleCopy}
        className={className}
        aria-pressed={copied}
        aria-label={
          typeof children === "string"
            ? copied
              ? `${children} (copied)`
              : children
            : "Copy to clipboard"
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        //   padding: "0.4rem 0.7rem",
        //   borderRadius: 6,
        //   border: "1px solid #ccc",
          background: copied ? "#f84565" : "#d63854",
          cursor: "pointer",
        }}
      >
        {children ?? "Copy"}
        {/* simple inline icon */}
        <span aria-hidden>{copied ? "✔️" : "📋"}</span>
      </button>

      {/* Accessible live region for screen readers */}
      <span
        ref={statusRef}
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </div>
  );
}
