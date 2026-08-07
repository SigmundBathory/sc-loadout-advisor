export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}
