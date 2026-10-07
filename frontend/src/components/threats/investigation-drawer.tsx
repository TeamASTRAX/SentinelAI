"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function InvestigationDrawer({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={label} className="investigation-dialog" onCancel={event => { event.preventDefault(); router.push("/threats"); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left) router.push("/threats"); } }}>{children}</dialog>;
}
