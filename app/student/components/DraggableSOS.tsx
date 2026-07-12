"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import api from "../../lib/api";

const mockData = {
  adminEmail: "admin@bwf.edu",
  edgeGap: 24,
  fabSize: 58,
  uiStrings: {
    tooltipDefault: "Sends a direct emergency alert to Admin",
    tooltipSuccess: "Alert Sent Successfully!",
    fabLabel: "SOS",
    fabLabelSent: "SENT",
    modalEyebrow: "Emergency Support",
    modalTitle: "Need urgent help right now?",
    modalText: "This will send an immediate, direct email to the BWF Founder/Admin. Use this when you or someone else is unsafe.",
    confirmBtn: "Confirm SOS Alert",
    sendingBtn: "Sending alert...",
    emailSubject: "URGENT SOS ALERT - Direct escalation to BWF Founder/Admin",
    emailBody: "This is an emergency SOS alert from a student. Immediate direct action is requested from the BWF Founder/Admin."
  }
};

export default function DraggableSOS() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hasCustomPosition, setHasCustomPosition] = useState(false);

  // SOS Message state
  const [sosMessage, setSosMessage] = useState("");
  const { authId } = useProfile();

  const triggerSOS = async () => {
    setSending(true);
    try {
      const payload = {
        type: "STUDENT_EMERGENCY",
        message: sosMessage.trim() || "Student requested immediate help from SOS button.",
        createdAt: new Date().toISOString(),
      };

      await api.post("/student/sos", payload);

      setSent(true);
      setHovered(true); // Show success tooltip
      setSosMessage(""); // Clear message
      setTimeout(() => {
        setSent(false);
        setHovered(false);
      }, 5000);
      setOpen(false);
    } catch (err) {
      console.error("SOS Error:", err);
      alert("System Error: Emergency alert could not be sent electronically. Please contact the warden immediately.");
    } finally {
      setSending(false);
    }
  };

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  const getBounds = () => {
    if (typeof window === "undefined") return { maxX: 0, maxY: 0 };
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      maxX: Math.max(mockData.edgeGap, width - mockData.fabSize - mockData.edgeGap),
      maxY: Math.max(mockData.edgeGap, height - mockData.fabSize - mockData.edgeGap),
    };
  };

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!hasCustomPosition) return;

    const handleResize = () => {
      const { maxX, maxY } = getBounds();
      setPosition((prev) => ({
        x: clamp(prev.x, mockData.edgeGap, maxX),
        y: clamp(prev.y, mockData.edgeGap, maxY),
      }));
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [hasCustomPosition]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined") return;
    
    // Prevent default touch/mouse behavior
    event.preventDefault();
    
    const pointerStart = { x: event.clientX, y: event.clientY };
    const initialPos = { ...position };
    let moved = false;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - pointerStart.x;
      const deltaY = moveEvent.clientY - pointerStart.y;
      
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        moved = true;
        setDragging(true);
      }

      const { maxX, maxY } = getBounds();
      setPosition({
        x: clamp(initialPos.x + deltaX, mockData.edgeGap, maxX),
        y: clamp(initialPos.y + deltaY, mockData.edgeGap, maxY),
      });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (moved) setHasCustomPosition(true);
      if (!moved) {
        setOpen(true);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <>
      <div
        className="sos-corner-shell"
        style={hasCustomPosition ? { 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          right: 'auto',
          bottom: 'auto'
        } : undefined}
      >
        <div className={`sos-tooltip${hovered && !dragging ? " sos-tooltip--visible" : ""}`}>
          {sent ? mockData.uiStrings.tooltipSuccess : mockData.uiStrings.tooltipDefault}
        </div>
        <button
          className={`sos-fab ${sent ? "sos-fab--sent" : ""} ${dragging ? "sos-fab--dragging" : ""}`}
          onPointerDown={startDrag}
          onMouseEnter={() => !sent && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => !sent && setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-label="Open emergency alert"
          disabled={sent}
        >
          <span className="sos-label-compact">{sent ? mockData.uiStrings.fabLabelSent : mockData.uiStrings.fabLabel}</span>
        </button>
      </div>

      {open && (
        <div className="sos-modal-overlay" onClick={() => setOpen(false)}>
          <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sos-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
            <p className="sos-eyebrow">{mockData.uiStrings.modalEyebrow}</p>
            <h3 className="sos-title">{mockData.uiStrings.modalTitle}</h3>
            <p className="sos-text">
              {mockData.uiStrings.modalText}
            </p>
            
            <textarea
              className="sos-message-input"
              placeholder="What's the emergency? (optional)"
              value={sosMessage}
              onChange={(e) => setSosMessage(e.target.value)}
              rows={3}
            />

            <button className="sos-confirm" onClick={triggerSOS} disabled={sending}>
              <AlertTriangle size={16} />
              {sending ? mockData.uiStrings.sendingBtn : mockData.uiStrings.confirmBtn}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
