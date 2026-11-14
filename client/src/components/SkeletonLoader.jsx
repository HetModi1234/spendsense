import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'metric') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((_, i) => (
          <div key={i} className="card-glass p-5 rounded-2xl animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-9 w-9 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-32 bg-slate-800 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="card-glass p-6 rounded-2xl animate-pulse space-y-3">
        <div className="h-5 w-40 bg-slate-800 rounded mb-4" />
        {items.map((_, i) => (
          <div key={i} className="h-10 w-full bg-slate-800/60 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="card-glass p-6 rounded-2xl animate-pulse space-y-4">
      <div className="h-5 w-48 bg-slate-800 rounded" />
      <div className="h-32 w-full bg-slate-800/50 rounded-xl" />
    </div>
  );
}
