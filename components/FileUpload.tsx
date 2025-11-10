import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, error }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-indigo-50 rounded-full">
             <FileSpreadsheet className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload your Dataset</h2>
        <p className="text-slate-500 mb-8">
          Upload an Excel (.xlsx) file to generate an instant AI-powered dashboard.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="relative group">
          <label
            htmlFor="file-upload"
            className={`
              flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-200 ease-in-out
              ${isProcessing 
                ? 'bg-slate-50 border-slate-300 cursor-wait' 
                : 'bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isProcessing ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-indigo-600 font-medium">Analyzing data...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <p className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">XLSX files only</p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard icon="⚡" title="Instant Analysis" desc="Get insights in seconds using Gemini 2.5 Flash." />
          <FeatureCard icon="📊" title="Smart Charts" desc="Automatically generated visualizations based on your data." />
          <FeatureCard icon="🔒" title="Secure Processing" desc="Your data is processed locally and only samples are sent for analysis." />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div className="bg-white/50 p-4 rounded-xl border border-slate-200/60 shadow-sm text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);