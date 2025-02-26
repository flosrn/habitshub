import { ModernAppleCardVariant1 } from "@/components/cuicui/ModernAppleCardVariant1";

export function ModernAppleCardVariant2() {
  return (
    <div className="card flex cursor-pointer gap-3 bg-neutral-400/5 transition hover:bg-white/5 active:scale-[.975] overflow-hidden">
      <div className="flex flex-col gap-2.5 bg-white/10 p-2.5 dark:bg-neutral-400/5">
        <h6 className="mb-2 origin-left transform-gpu font-semibold text-gray-600 text-xl tracking-tighter transition-all group-hover:scale-90 dark:text-gray-300">
          Damn good card
        </h6>
        <ModernAppleCardVariant1 />
      </div>
    </div>
  );
}
