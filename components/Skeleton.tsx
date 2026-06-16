import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  width?: string;
  height?: string;
}

export const Skeleton = ({ className = '', variant = 'text', width, height }: SkeletonProps) => {
  const base = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  const shape = variant === 'circle' ? 'rounded-full' : variant === 'rect' ? 'rounded-lg' : 'rounded h-4';
  return (
    <div
      className={`${base} ${shape} ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circle" width="40px" height="40px" />
      <Skeleton width="120px" />
    </div>
    <Skeleton variant="rect" width="80px" height="32px" className="mb-2" />
    <Skeleton width="60px" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
      <Skeleton width="160px" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <Skeleton variant="circle" width="32px" height="32px" />
        <div className="flex-1 space-y-2">
          <Skeleton width={`${60 + Math.random() * 30}%`} />
          <Skeleton width={`${40 + Math.random() * 20}%`} />
        </div>
        <Skeleton width="80px" />
      </div>
    ))}
  </div>
);

export const StatsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
