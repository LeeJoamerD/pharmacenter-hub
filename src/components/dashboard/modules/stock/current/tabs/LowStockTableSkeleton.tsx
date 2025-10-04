import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LowStockTableSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card className="p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>

      {/* Quick Actions Skeleton */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </Card>

      {/* Table Skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 pb-3 border-b">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="grid grid-cols-12 gap-2 py-3 border-b">
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-2" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
              <Skeleton className="h-8 col-span-1" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
