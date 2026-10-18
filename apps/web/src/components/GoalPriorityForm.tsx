import { useId, useState } from 'react';

export default function GoalPriorityForm({
  initialPriority,
  isPending,
  onSubmit,
  onCancel,
}: {
  initialPriority: number;
  isPending: boolean;
  onSubmit: (priority: number) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [priority, setPriority] = useState(initialPriority);
  return (
    <form
      className="my-4 space-y-4 rounded-xl border border-indigo-400/30 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(priority);
      }}
    >
      <p className="text-sm">
        Only priority changes. The stored target, range and talent slot stay as recorded.
      </p>
      <label className="block text-sm" htmlFor={`${id}-priority`}>
        Priority (1 first, 5 last)
        <select
          id={`${id}-priority`}
          className="w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={priority}
          disabled={isPending}
          onChange={(event) => setPriority(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Saving…' : 'Save priority'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/20 px-4 py-2"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
