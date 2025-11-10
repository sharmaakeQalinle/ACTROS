import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ChartConfig, ChartType, DataSet } from '../types';
import { formatDataForChart } from '../utils/aggregation';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';

interface ChartWidgetProps {
  config: ChartConfig;
  data: DataSet;
}

const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export const ChartWidget: React.FC<ChartWidgetProps> = ({ config, data }) => {
  // State for the slicer (number of items to show)
  const [itemCount, setItemCount] = useState(10);

  const fullChartData = useMemo(() => {
    return formatDataForChart(data, config.xAxisKey, config.dataKeys, config.type);
  }, [data, config]);

  // Slice the data based on the slider value
  const visibleData = useMemo(() => {
    if (!fullChartData) return [];
    return fullChartData.slice(0, itemCount);
  }, [fullChartData, itemCount]);

  if (!fullChartData || fullChartData.length === 0) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-96 items-center justify-center text-slate-400">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No data available for "{config.title}"</p>
            <p className="text-xs mt-1">Check if columns match: {config.xAxisKey}, {config.dataKeys.join(', ')}</p>
        </div>
    );
  }

  const renderChart = () => {
    switch (config.type.toLowerCase()) {
      case ChartType.BAR:
        return (
          <BarChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey={config.xAxisKey} 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
            />
            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{paddingTop: '20px'}} />
            {config.dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case ChartType.LINE:
        return (
          <LineChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey={config.xAxisKey} 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                angle={-15}
                textAnchor="end"
                height={60}
            />
            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{paddingTop: '20px'}} />
            {config.dataKeys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
            ))}
          </LineChart>
        );
      case ChartType.AREA:
        return (
          <AreaChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey={config.xAxisKey} 
                tick={{fill: '#64748b', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                angle={-15}
                textAnchor="end"
                height={60}
            />
            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{paddingTop: '20px'}} />
            {config.dataKeys.map((key, index) => (
              <Area key={key} type="monotone" dataKey={key} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} fillOpacity={0.2} />
            ))}
          </AreaChart>
        );
      case ChartType.PIE:
        const pieKey = config.dataKeys[0];
        return (
          <PieChart>
            <Pie
              data={visibleData}
              dataKey={pieKey}
              nameKey={config.xAxisKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
            >
              {visibleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{paddingTop: '20px'}} />
          </PieChart>
        );
        case ChartType.SCATTER:
            return (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis type="category" dataKey={config.xAxisKey} name={config.xAxisKey} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} height={60} />
                <YAxis type="number" dataKey={config.dataKeys[0]} name={config.dataKeys[0]} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Scatter name={config.title} data={visibleData} fill="#8884d8">
                    {visibleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Scatter>
              </ScatterChart>
            );
      default:
        return <div className="flex items-center justify-center h-full text-slate-400">Chart type not supported</div>;
    }
  };

  // Determine max slider value
  const maxItems = fullChartData.length;
  const showSlider = maxItems > 3; 

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-96">
      <div className="flex flex-row justify-between items-start mb-4 gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 leading-tight truncate" title={config.title}>{config.title}</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={config.description}>{config.description}</p>
        </div>

        {showSlider && (
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex-shrink-0">
             <SlidersHorizontal className="w-3 h-3 text-slate-400" />
             <div className="flex flex-col w-24">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                   <span>Top {itemCount}</span>
                   <span>{maxItems}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max={maxItems}
                  step="1"
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
             </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};