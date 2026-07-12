"use client";

import { useState } from "react";
import { AlertTriangle, Ambulance, X } from "lucide-react";

const ADMIN_EMAIL = "admin@bwf.edu";

export default function SOSButton() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const triggerSOS = async () => {
    setSending(true);
    try {
      const payload = {
        type: "STUDENT_EMERGENCY",
        message: "Student requested immediate help from SOS button.",
        createdAt: new Date().toISOString(),
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      await fetch("/api/student/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }).catch(() => null);

      const subject = encodeURIComponent("URGENT SOS ALERT - Student needs immediate help");
      const body = encodeURIComponent(
        "This is an emergency SOS alert from a student.\nPlease respond immediately."
      );
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className={`sos-fab${sent ? " sos-fab--sent" : ""}`} onClick={() => setOpen(true)}>
        <Ambulance size={17} />
        <span>{sent ? "Alert sent" : "Emergency? Click to Alert Warden"}</span>
      </button>

      {open && (
        <div className="sos-modal-overlay" onClick={() => setOpen(false)}>
          <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sos-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
            <p className="sos-eyebrow">Emergency Support</p>
            <h3 className="sos-title">Need urgent help right now?</h3>
            <p className="sos-text">
              Press confirm to immediately alert the admin team by email.
              Use this when you or someone else is unsafe.
            </p>
            <button className="sos-confirm" onClick={triggerSOS} disabled={sending}>
              <AlertTriangle size={16} />
              {sending ? "Sending alert..." : "Confirm SOS Alert"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
