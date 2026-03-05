import { FolderCheck, FolderUp, X } from "lucide-react";
import { useState } from "react";

interface FileUploadZoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export const FileUploadZone = ({
  file,
  onFile,
  onClear,
}: FileUploadZoneProps) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${
        dragging
          ? "border-key-color"
          : file
            ? "border-secondary-color"
            : "border-white/30 hover:border-gray-500"
      }`}
    >
      <input
        id="fileInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 text-gray-200 hover:text-red-500 transition-all text-xs flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="text-2xl mb-2 flex justify-center">
        {file ? (
          <FolderCheck className="w-6 h-6 text-green-500" />
        ) : (
          <FolderUp className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <div
        className={`text-sm font-medium ${file ? "text-secondary-color" : "text-gray-400"}`}
      >
        {file ? file.name : "엑셀 파일을 드래그하거나 클릭해서 업로드"}
      </div>
      <div className="text-m text-gray-400 mt-1">.xlsx, .xls, .csv</div>
    </div>
  );
};



