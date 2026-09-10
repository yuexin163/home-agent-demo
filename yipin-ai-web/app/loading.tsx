export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-stone-50" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto block size-9 animate-pulse rounded-full bg-emerald-800" />
        <p className="mt-4 text-sm text-stone-500">正在载入装修资料…</p>
      </div>
    </div>
  );
}
