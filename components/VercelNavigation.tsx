"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const dataButtons = [
  { label: "Home", href: "/" },
  { label: "Hub", href: "/hub" },
  { label: "Contact", href: "#" },
  { label: "Terms & conditions", href: "#" },
];

export function VercelNavigationVariant1() {
  const [elementFocused, setElementFocused] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleHoverButton = (index: number | null) => {
    setElementFocused(index);
  };

  const handleClickButton = (href: string) => {
    router.push(href);
  };

  return (
    <nav
      className="flex flex-col sm:flex-row"
      onMouseLeave={() => {
        handleHoverButton(null);
      }}
    >
      {dataButtons.map((button, index) => (
        <button
          key={button.label}
          type="button"
          onMouseEnter={() => handleHoverButton(index)}
          onClick={() => handleClickButton(button.href)}
          className={cn(
            "relative inline-flex w-fit whitespace-nowrap rounded px-2 py-1 font-medium text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 text-sm",
            {
              "text-primary-500 dark:text-primary-400":
                pathname === button.href,
            }
          )}
        >
          {button.label}
          <AnimatePresence>
            {elementFocused === index && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.95 }}
                layout={true}
                layoutId="focused-element"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="-z-10 absolute top-0 right-0 bottom-0 left-0 rounded-md bg-neutral-200 dark:bg-neutral-800"
              />
            )}
          </AnimatePresence>
        </button>
      ))}
    </nav>
  );
}
