import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseExcelFile } from './services/excel';
import { analyzeDataset } from './services/gemini';
import { DataSet, AnalysisResult } from './types';
import { BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DataSet | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Parse Excel
      const jsonData = await parseExcelFile(file);
      
      if (jsonData.length === 0) {
        throw new Error("The uploaded file appears to be empty.");
      }

      setData(jsonData);

      // 2. Analyze with Gemini
      const analysisResult = await analyzeDataset(jsonData);
      setAnalysis(analysisResult);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while processing the file.");
      setData(null);
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = () => {
    setData(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              DataLens AI
            </span>
          </div>
          <div className="text-xs font-medium text-slate-400 border border-slate-200 px-3 py-1 rounded-full">
            Powered by Gemini 2.5
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!data || !analysis ? (
          <div className="animate-fade-in-up">
             <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                  Turn spreadsheets into <br/>
                  <span className="text-indigo-600">actionable insights</span>
                </h1>
                <p className="text-lg text-slate-600">
                  Upload your Excel file and let our AI analyst automatically discover trends, generate KPIs, and build a dashboard for you in seconds.
                </p>
             </div>
             <FileUpload 
                onFileSelect={handleFileSelect} 
                isProcessing={isProcessing} 
                error={error} 
             />
          </div>
        ) : (
          <Dashboard 
            data={data} 
            analysis={analysis} 
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
};

export default App;