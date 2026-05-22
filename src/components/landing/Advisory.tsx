export default function Advisory() {
  return (
    <div className="bg-secondary-container/20 border-y border-secondary/20 py-4 overflow-hidden relative group">
      <div className="flex whitespace-nowrap animate-pulse">
        <div className="flex items-center gap-4 px-margin-desktop text-secondary font-label-sm text-label-sm uppercase tracking-widest">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Travel Advisory: Global entry requirements updated for Q3 2024. Please check current health protocols for your destination.
        </div>
        <div className="flex items-center gap-4 px-margin-desktop text-secondary font-label-sm text-label-sm uppercase tracking-widest">
          <span className="material-symbols-outlined text-[20px]">info</span>
          Direct flights to Tokyo Haneda (HND) now available daily from London.
        </div>
      </div>
    </div>
  );
}
