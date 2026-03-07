import Link from "next/link";

const TABS = [
  { key: "overview",  label: "Overview" },
  { key: "profile",   label: "Business Profile" },
  { key: "brand",     label: "Brand" },
  { key: "offerings", label: "Offerings" },
  { key: "team",      label: "Team" },
  { key: "media",     label: "Media" },
];

interface ClientTabsProps {
  clientId: string;
  activeTab: string;
}

export function ClientTabs({ clientId, activeTab }: ClientTabsProps) {
  return (
    <nav className="flex gap-0 border-b border-zinc-800 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/dashboard/clients/${clientId}?tab=${tab.key}`}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
