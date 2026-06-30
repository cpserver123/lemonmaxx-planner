"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    onClick?: () => void;
  } & ({ as?: "button"; onClick?: () => void } | { as: "link"; href: string })
) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  const baseStyles = cn(
    "rounded-lg px-1.5 font-medium transition-all duration-200 ease-in-out",
    "text-[#4B5563] dark:text-[#9CA3AF]",
    props.isActive
      ? "bg-[rgba(87,80,241,0.07)] text-[#5750F1] hover:bg-[rgba(87,80,241,0.07)] dark:bg-[#FFFFFF1A] dark:text-white"
      : "hover:bg-gray-100 hover:text-[#111928] hover:dark:bg-[#FFFFFF1A] hover:dark:text-white"
  );

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        onClick={() => isMobile && toggleSidebar()}
        className={cn(baseStyles, "relative block py-2", props.className)}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={cn(baseStyles, "flex w-full items-center gap-3 py-3", props.className)}
    >
      {props.children}
    </button>
  );
}
