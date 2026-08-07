export default function ShipDetailLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-muted rounded animate-pulse" />
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
