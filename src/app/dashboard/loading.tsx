export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
