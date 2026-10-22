"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PageBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="secondary-button page-back-button"
      data-tooltip="Go back to the previous page"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.replace("/");
      }}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      Back
    </button>
  );
}
