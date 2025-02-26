export function ModernAppleCardVariant1() {
  return (
    <div className="content-box z-10 flex cursor-pointer gap-3 bg-neutral-400/5 transition hover:bg-white/5 active:scale-[.975] overflow-hidden">
      <div className="flex flex-col gap-2.5 bg-white/10 p-2.5 dark:bg-neutral-400/5">
        <h6 className="mb-2 origin-left transform-gpu font-semibold text-gray-600 text-xl tracking-tighter transition-all group-hover:scale-90 dark:text-gray-300">
          Damn good card
        </h6>
        <p className="text-sm tracking-tight dark:text-gray-400">
          {`This card is better in dark mode. It has a nice inner shadow and a nice
        border. It's a good modern card.`}
        </p>
      </div>
    </div>
  );
}
