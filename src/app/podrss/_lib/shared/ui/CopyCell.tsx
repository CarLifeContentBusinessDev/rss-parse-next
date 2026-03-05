import { useState } from "react";
import { Check, Copy } from "lucide-react";
interface CopyCellProps {
  value: string;
}

export const CopyCell = ({ value }: CopyCellProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-center gap-2 group">
      <span className={"text-gray-300 font-medium truncate max-w-60"}>
        {value}
      </span>
      <button
        onClick={handleCopy}
        className={`opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded transition-all cursor-pointer shrink-0 ${
          copied
            ? "text-secondary-color"
            : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200"
        }`}
      >
        {value && (copied ? <Check size={14} /> : <Copy size={14} />)}
      </button>
    </div>
  );
};


