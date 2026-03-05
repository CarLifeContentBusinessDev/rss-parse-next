import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
}

export const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-1.5 py-0.5 rounded transition-all cursor-pointer ${
        copied
          ? "text-secondary-color"
          : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200"
      }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};


