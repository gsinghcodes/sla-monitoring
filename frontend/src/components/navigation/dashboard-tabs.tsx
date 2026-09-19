"use client";

type DashboardTab = "overview" | "logs";

type DashboardTabsProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

export default function DashboardTabs({
  activeTab,
  onTabChange,
}: DashboardTabsProps) {
  return (
    <div className="flex border-b transition-all duration-200 border-slate-800">
      <TabButton
        active={activeTab === "overview"}
        onClick={() => onTabChange("overview")}
      >
        Overview
      </TabButton>

      <TabButton
        active={activeTab === "logs"}
        onClick={() => onTabChange("logs")}
      >
        Logs
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative active:scale-105 px-5 py-3 text-sm transition ${
        active
          ? "text-slate-800 font-bold"
          : "text-slate-500 hover:text-slate-700 font-medium  "
      }`}
    >
      {children}

    </button>
  );
}