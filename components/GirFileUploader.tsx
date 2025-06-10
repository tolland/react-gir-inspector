
import React, { useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface GirFileUploaderProps {
  onFileLoad: (fileName: string, content: string) => void;
  disabled?: boolean;
}

const GirFileUploader: React.FC<GirFileUploaderProps> = ({ onFileLoad, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(file => {
        if (file.name.endsWith('.gir')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
              onFileLoad(file.name, e.target.result);
            }
          };
          reader.readAsText(file);
        } else {
          alert(`File "${file.name}" is not a .gir file and will be ignored.`);
        }
      });
      // Reset file input to allow uploading the same file again
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [onFileLoad]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-b border-slate-300">
      <input
        type="file"
        multiple
        accept=".gir"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <UploadIcon className="mr-2" />
        Upload GIR File(s)
      </button>
    </div>
  );
};

export default GirFileUploader;
