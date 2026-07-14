"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_DATA } from "./data";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        onMouseOver={handleMouseEnter}
        onMouseOut={handleMouseLeave}
        className={cn(
          "border-r border-gray-200 bg-white dark:border-[#1d2a3a] dark:bg-[#020d1a]",
          "scrollbar-thin overflow-y-auto",
          "transition-[width,transform,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "will-change-[width,transform]",
          isMobile ? "fixed inset-y-0 left-0 z-50" : "sticky top-0 h-screen",
          isOpen
            ? "w-[250px] translate-x-0 opacity-100"
            : isMobile
              ? "w-[250px] -translate-x-full opacity-0"
              : "w-[88px] opacity-100"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          {/* Logo */}
          <div className="relative pr-4.5 flex-shrink-0">
            {isOpen ? (
              <Link
                href="/dashboard"
                onClick={() => isMobile && toggleSidebar()}
                className="flex items-center gap-2 px-0 py-2.5 min-[850px]:py-0"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-yellow-400 text-white font-bold shrink-0">
                  <span className="text-sm">L</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  Lemonmaxx Planner
                </span>
              </Link>
            ) : (
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-yellow-400 text-white font-bold"
                aria-label="Toggle sidebar"
              >
                <span className="text-sm">L</span>
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex-1 pr-3 min-[850px]:mt-10 overflow-y-auto scrollbar-thin pb-4 min-h-0">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <MenuItem
                          className="flex items-center gap-3 py-3"
                          as="link"
                          href={item.url || "#"}
                          isActive={pathname === item.url}
                        >
                          {item.icon && (
                            <item.icon
                              className="size-6 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className="ml-3"
                            style={{
                              display: isOpen ? "block" : "none",
                            }}
                          >
                            {item.title}
                          </span>
                        </MenuItem>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
