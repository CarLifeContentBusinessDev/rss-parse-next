import { useId, useState } from 'react';
import { FolderCheck, FolderUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export const FileUploadZone = ({ file, onFile, onClear }: FileUploadZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFile(droppedFile);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative mb-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
        dragging
          ? 'border-teal-500 bg-teal-50'
          : file
            ? 'border-emerald-300 bg-emerald-50/70'
            : 'border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/70',
      )}
    >
      <input
        id={inputId}
        type='file'
        accept='.xlsx,.xls,.csv'
        className='hidden'
        onChange={(e) => {
          const nextFile = e.target.files?.[0];
          if (nextFile) onFile(nextFile);
        }}
      />
      {file ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className='absolute top-3 right-3 h-8 w-8 rounded-full p-0'
        >
          <X className='h-4 w-4' />
        </Button>
      ) : null}
      <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-current/10 bg-white text-zinc-500'>
        {file ? <FolderCheck className='h-6 w-6 text-emerald-600' /> : <FolderUp className='h-6 w-6' />}
      </div>
      <div className={cn('text-sm font-medium', file ? 'text-emerald-700' : 'text-zinc-700')}>
        {file ? file.name : '엑셀 파일을 끌어오거나 클릭해서 업로드하세요'}
      </div>
      <div className='mt-1 text-xs text-zinc-500'>.xlsx, .xls, .csv</div>
    </label>
  );
};
