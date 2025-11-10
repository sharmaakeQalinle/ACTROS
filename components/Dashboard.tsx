import React from 'react';
import { DataSet, AnalysisResult } from '../types';
import { ChartWidget } from './ChartWidget';
import { ArrowUpRight, ArrowDownRight, FileText, Lightbulb, RefreshCw } from 'lucide-react';

interface DashboardProps {
  data: DataSet;
  analysis: AnalysisResult;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, analysis, onReset }) => {
  return (
    <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Analysis</h1>
                <p className="text-slate-500 mt-1">Generated from {data.length} rows of data</p>
            </div>
            <button 
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
                <RefreshCw className="w-4 h-4" />
                Upload New File
            </button>
        </div>

        {/* Executive Summary */}
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-indigo-200" />
                    <h2 className="font-semibold text-indigo-100 uppercase tracking-wide text-xs">Executive Summary</h2>
                </div>
                <p className="text-lg md:text-xl leading-relaxed font-medium text-white/95">
                    {analysis.summary}
                </p>
            </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {analysis.kpis.map((kpi, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm text-slate-500 font-medium mb-1">{kpi.label}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
                        {kpi.trend && (
                            <span className={`flex items-center text-xs font-medium ${kpi.trend.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                                {kpi.trend.includes('-') ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                                {kpi.trend}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Charts Grid */}
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Visual Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {analysis.charts.map((config, idx) => (
                <ChartWidget key={idx} config={config} data={data} />
            ))}
        </div>

        {/* Insights List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">Key Takeaways</h2>
            </div>
            <div className="space-y-4">
                {analysis.insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-slate-400 shadow-sm text-sm border border-slate-100">
                            {idx + 1}
                        </div>
                        <p className="text-slate-700 leading-relaxed">{insight}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};