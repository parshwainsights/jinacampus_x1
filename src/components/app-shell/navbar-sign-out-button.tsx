"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

export function NavbarSignOutButton({ mobile = false }: { mobile?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold transition premium-focus ${
        mobile ? "text-red-700 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50 hover:text-red-700"
      }`}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
