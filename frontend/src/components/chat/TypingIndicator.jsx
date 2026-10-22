export default function TypingIndicator({ names }) {
  if (!names?.length) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "120ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "240ms" }} />
      </span>
      {names.join(", ")} {names.length === 1 ? "is" : "are"} typing…
    </div>
  );
}