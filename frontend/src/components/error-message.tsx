type Props = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
