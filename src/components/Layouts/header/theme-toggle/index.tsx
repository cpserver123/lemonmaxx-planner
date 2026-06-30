"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IoMoonOutline } from "react-icons/io5";
import { GoSun } from "react-icons/go";

export function ThemeToggleSwitch() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="
        group
        rounded-full
        bg-gray-200
        dark:bg-[#0a0f1a]
        p-1
        flex
        items-center
        relative
        w-[70px] h-[32px]
        sm:w-[90px] sm:h-[38px]
        transition-all
      "
    >
      {/* Sliding indicator */}
      <span
        className="
          absolute
          rounded-full
          bg-white
          dark:bg-gray-800
          shadow-md
          transition-all
          size-[28px]
          translate-x-[0px]
          dark:translate-x-[38px]
          sm:size-[34px]
          sm:translate-x-[0px]
          sm:dark:translate-x-[52px]
        "
      />

      {/* Icons */}
      <div className="flex justify-between w-full px-1 z-10">
        <GoSun className="text-[16px] sm:text-[18px]" />
        <IoMoonOutline className="text-[16px] sm:text-[18px]" />
      </div>
    </button>
  );
}
