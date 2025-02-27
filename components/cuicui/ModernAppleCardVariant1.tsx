import GitHubCalendar from "react-github-calendar";

const explicitTheme = {
  light: ["#f0f0f0", "#c4edde", "#7ac7c4", "#f73859", "#384259"],
  dark: ["#161b22", "#4D455D", "#7DB9B6", "#F5E9CF", "#E96479"],
};

export function ModernAppleCardVariant1() {
  return (
    <div className="content-box rounded-md z-10 flex cursor-pointer gap-3 bg-neutral-400/5 transition hover:bg-white/5 active:scale-[.975] overflow-hidden">
      <div className="flex flex-col gap-2.5 bg-white/10 p-2.5 dark:bg-neutral-400/5">
        <h6 className="mb-2 origin-left transform-gpu font-semibold text-gray-600 text-xl tracking-tighter transition-all group-hover:scale-90 dark:text-gray-300">
          Damn good card
        </h6>
        <p className="text-sm tracking-tight dark:text-gray-400">
          {`This card is better in dark mode. It has a nice inner shadow and a nice
        border. It's a good modern card.`}
        </p>
        <div className="bg-[#0d1117] p-2 rounded-md">
          <GitHubCalendar
            username="flosrn"
            blockMargin={3.5}
            blockSize={10}
            blockRadius={2}
            // theme={explicitTheme}
          />
        </div>
      </div>
    </div>
  );
}
