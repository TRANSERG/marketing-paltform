import { Spinner } from "@/components/Spinner";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 min-w-0 p-4 sm:p-6 items-center justify-center min-h-[200px]">
      <Spinner size="md" aria-label="Loading" className="text-zinc-400" />
    </div>
  );
}
