import { X } from "lucide-react";

export const Input = ({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  const handleClear = () => {
    const event = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    props.onChange?.(event);
  };

  return (
    <div className="relative">
      <input
        {...props}
        className="w-full border border-gray-500 rounded-lg px-3 py-2 text-m text-slate-200 outline-none focus:border-key-color/70 focus:bg-white/8 transition-all placeholder:text-gray-400 pr-"
      />
      {props.value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-all cursor-pointer text-xs "
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};


