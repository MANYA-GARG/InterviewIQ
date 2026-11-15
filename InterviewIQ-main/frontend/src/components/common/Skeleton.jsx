export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="pt-2">
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);

export default Skeleton;
