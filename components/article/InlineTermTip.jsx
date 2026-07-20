"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

export default function InlineTermTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const id = useId();
  const popoverRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const gutter = 18;
    let nextShift = 0;
    if (rect.left < gutter) nextShift += gutter - rect.left;
    if (rect.right + nextShift > window.innerWidth - gutter) {
      nextShift -= rect.right + nextShift - (window.innerWidth - gutter);
    }
    setShift(nextShift);
  }, [open]);

  return (
    <span className="essay-term">
      <span>{label}</span>
      <span
        className={`essay-term-control ${open ? "is-open" : ""}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.querySelector("button")?.focus();
          }
        }}
      >
        <button
          type="button"
          aria-label={`Explain ${label}`}
          aria-expanded={open}
          aria-controls={id}
          aria-describedby={open ? id : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          ?
        </button>
        <span
          className="essay-term-popover"
          id={id}
          ref={popoverRef}
          role="tooltip"
          style={{ "--popover-shift": `${shift}px` }}
        >
          {children}
        </span>
      </span>
    </span>
  );
}
