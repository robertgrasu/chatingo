import React from 'react';

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-shimmer ${className}`}
      style={{
        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="w-12 h-12 rounded-xl" />
      </div>
      <SkeletonBlock className="h-8 w-20 mb-2" />
      <SkeletonBlock className="h-4 w-24 mb-1" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-gray-50 dark:border-gray-700/50 items-center">
      <div className="col-span-4 flex items-center gap-3">
        <SkeletonBlock className="w-8 h-8 rounded-lg flex-shrink-0" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="col-span-2"><SkeletonBlock className="h-4 w-16" /></div>
      <div className="col-span-2"><SkeletonBlock className="h-5 w-16 rounded-full" /></div>
      <div className="col-span-1 flex justify-center"><SkeletonBlock className="h-4 w-6" /></div>
      <div className="col-span-2"><SkeletonBlock className="h-4 w-20" /></div>
      <div className="col-span-1" />
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="p-4 border-b border-gray-50 dark:border-gray-700/50">
      <div className="flex items-start justify-between mb-2">
        <SkeletonBlock className="h-3 w-12" />
        <SkeletonBlock className="h-3 w-14 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-3/4 mb-1.5" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

export function MessageSkeleton({ align = 'left' }) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[60%] px-4 py-3 rounded-2xl ${
        align === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'
      }`}>
        <SkeletonBlock className="h-3 w-40 mb-2" />
        <SkeletonBlock className="h-3 w-28" />
      </div>
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <SkeletonBlock className="h-5 w-32 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-12 w-full mb-3 last:mb-0" />
      ))}
    </div>
  );
}
