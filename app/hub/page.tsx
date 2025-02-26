import { ModernAppleCardVariant1 } from "@/components/cuicui/ModernAppleCardVariant1";
import { ModernAppleCardVariant2 } from "@/components/cuicui/ModernAppleCardVariant2";
import { ModernInnerShadowCard } from "@/components/cuicui/ModernInnerShadowCard";

export default async function HubPage() {
  return (
    <div className="relative z-10">
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto md:p-0">
        <ModernInnerShadowCard />
        <ModernAppleCardVariant1 />
        <ModernAppleCardVariant2 />
      </div>
    </div>
  );
}
