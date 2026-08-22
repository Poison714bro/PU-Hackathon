export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center bg-[#030711]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-500" />
        <p className="text-sm font-medium tracking-widest text-cyan-500/80 uppercase">
          Initializing Intel Data...
        </p>
      </div>
    </div>
  );
}
