"use client";

import { useEffect, useRef } from "react";
import api from "@/app/lib/api";
import { useToast } from "@/app/teacher/Template/hooks/use-toast";

interface UnreadRequest {
  _id: string;
  studentName: string;
  message: string;
  createdAt: string;
}

export function CounsellingAlerts() {
  const { toast } = useToast();
  // Keep track of which requests we've already popped up in this session to prevent spam
  const notifiedRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const checkAlerts = async () => {
      try {
        const res = await api.get("/teacher/counselling/unread");
        const requests = res.data?.requests || [];

        for (const req of requests) {
          if (!notifiedRefs.current.has(req._id)) {
            notifiedRefs.current.add(req._id);

            // Pop up the toast
            toast({
              title: `Need to Talk: ${req.studentName}`,
              description: req.message || "Student has requested counselling/support.",
              variant: "destructive", // Red alert color for urgency
              duration: 20000, // Show for 20 seconds
            });

            // Mark as read in the backend so it doesn't pop up again on refresh
            await api.put(`/teacher/counselling/${req._id}/read`);
          }
        }
      } catch (err) {
        console.error("Failed to check counselling alerts", err);
      } finally {
        // Poll every 30 seconds
        timeoutId = setTimeout(checkAlerts, 30000);
      }
    };

    // Initial check after a short delay to let layout mount
    timeoutId = setTimeout(checkAlerts, 2000);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  // This component doesn't render anything visible directly
  return null;
}
