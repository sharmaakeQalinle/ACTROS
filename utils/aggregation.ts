import { DataSet } from '../types';

// Robust number parser for Excel data which often contains formatted strings
const parseValue = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Remove currency symbols ($, €, £, etc), commas, and spaces.
    // Retain dots for decimals and minus signs for negatives.
    const cleaned = val.replace(/[^0-9.-]/g, ''); 
    if (cleaned === '') return 0;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const aggregateDataForChart = (data: DataSet, xAxisKey: string, dataKeys: string[]): DataSet => {
  if (!data || data.length === 0) return [];

  const grouped: Record<string, any> = {};

  data.forEach(row => {
    const xVal = row[xAxisKey];
    // If x-axis key is missing/null, we treat it as "Unknown" to safely aggregate
    const key = (xVal !== undefined && xVal !== null) ? String(xVal) : "Unknown";

    if (!grouped[key]) {
      grouped[key] = { [xAxisKey]: key, _count: 0 };
      // Initialize data keys
      dataKeys.forEach(dk => {
        grouped[key][dk] = 0;
      });
    }

    grouped[key]._count += 1;
    
    // Sum up values using robust parsing
    dataKeys.forEach(dk => {
      if (dk === 'Record_Count') {
        // Special handling for counting rows
        grouped[key][dk] += 1;
      } else {
        const val = row[dk];
        grouped[key][dk] += parseValue(val);
      }
    });
  });

  return Object.values(grouped);
};

export const formatDataForChart = (data: DataSet, xAxisKey: string, dataKeys: string[], chartType: string): DataSet => {
  if (!data || data.length === 0) return [];

  // Ensure keys exist in the first row to avoid mapping issues
  // Note: We allow 'Record_Count' even if it's not in the dataset
  const firstRow = data[0];
  if (firstRow && firstRow[xAxisKey] === undefined) {
      console.warn(`Chart xAxisKey "${xAxisKey}" not found in dataset.`);
      return [];
  }

  // Special handling for Scatter: return raw numeric data
  if (chartType === 'scatter') {
     return data.slice(0, 500).map(row => {
         const newRow: any = { ...row };
         dataKeys.forEach(k => {
            if (k === 'Record_Count') newRow[k] = 1;
            else newRow[k] = parseValue(row[k]);
         });
         return newRow;
     });
  }

  // Check uniqueness of X-axis
  const xValues = new Set();
  let allUnique = true;
  for(const row of data) {
      const val = row[xAxisKey];
      const sVal = String(val);
      if(xValues.has(sVal)) {
          allUnique = false;
          break;
      }
      xValues.add(sVal);
  }

  let processedData: DataSet;

  // Decision: Aggregate or Use Raw?
  if (allUnique && data.length <= 50) {
    processedData = data.map(row => {
         const newRow: any = { ...row };
         dataKeys.forEach(k => {
            if (k === 'Record_Count') {
                newRow[k] = 1;
            } else {
                newRow[k] = parseValue(row[k]);
            }
         });
         return newRow;
    });
  } else {
    processedData = aggregateDataForChart(data, xAxisKey, dataKeys);
  }

  // Sorting Logic
  const sampleX = processedData[0]?.[xAxisKey];
  const isDateLike = !isNaN(Date.parse(String(sampleX))) && String(sampleX).length >= 4; 

  if (isDateLike) {
      processedData.sort((a, b) => {
        return (new Date(a[xAxisKey]).getTime() - new Date(b[xAxisKey]).getTime());
     });
  } else {
     // For categorical bar/pie charts, sort by value (descending) to show biggest categories first
     if (chartType === 'bar' || chartType === 'pie' || chartType === 'area') {
         const sortKey = dataKeys[0];
         processedData.sort((a, b) => b[sortKey] - a[sortKey]);
     }
     // For line charts, usually sort by X axis (alphabetical/time)
     else if (chartType === 'line') {
         processedData.sort((a, b) => String(a[xAxisKey]).localeCompare(String(b[xAxisKey])));
     }
  }

  // Limit data points for readability, but allow UI to slice further.
  // Increased limit to 150 to support slicer UI.
  return processedData.slice(0, 150); 
};