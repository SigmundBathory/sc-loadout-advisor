export default function ShipsLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
