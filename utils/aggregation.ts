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

// A stricter check to see if a value is genuinely numeric.
// This is used to differentiate between categorical data and data for histograms.
const isActuallyNumeric = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'number') return isFinite(val);
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') return false;
        
        // Remove currency symbols and thousands separators for a better check
        const cleanedForCheck = trimmed.replace(/[$€£,]/g, '');
        
        // The value is numeric if it's not an empty string after cleaning
        // and JavaScript's Number() conversion results in a finite number.
        // Number() is stricter than parseFloat() (e.g., Number("123a") is NaN).
        return cleanedForCheck !== '' && !isNaN(Number(cleanedForCheck)) && isFinite(Number(cleanedForCheck));
    }
    return false;
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

// New function for histogram binning
const createHistogramData = (data: DataSet, valueKey: string, numBins: number = 12): DataSet => {
    const values = data.map(row => parseValue(row[valueKey])).filter(v => !isNaN(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
        return [{ [valueKey]: min.toLocaleString(), 'Record_Count': values.length }];
    }

    const binWidth = (max - min) / numBins;
    if (binWidth === 0) {
        // Fallback for extremely close min/max values
        return aggregateDataForChart(data.slice(0, 500), valueKey, ['Record_Count']);
    }

    const bins = new Array(numBins).fill(0);
    
    const binRanges = Array.from({ length: numBins }, (_, i) => {
        const lowerBound = min + i * binWidth;
        const upperBound = min + (i + 1) * binWidth;
        return { lowerBound, upperBound };
    });

    for (const value of values) {
        let binIndex = Math.floor((value - min) / binWidth);
        if (value === max) { // Include max value in the last bin
            binIndex = numBins - 1;
        }
        if (binIndex >= 0 && binIndex < numBins) {
            bins[binIndex]++;
        }
    }

    return bins.map((count, i) => {
        const { lowerBound, upperBound } = binRanges[i];
        const format = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return {
            [valueKey]: `${format(lowerBound)} - ${format(upperBound)}`,
            'Record_Count': count
        };
    }).filter(bin => bin['Record_Count'] > 0);
};

export const formatDataForChart = (data: DataSet, xAxisKey: string, dataKeys: string[], chartType: string): DataSet => {
  if (!data || data.length === 0) return [];

  const firstRow = data[0];
  if (firstRow && firstRow[xAxisKey] === undefined) {
      console.warn(`Chart xAxisKey "${xAxisKey}" not found in dataset.`);
      return [];
  }
  
  // A "distribution chart" is one that counts occurrences of values.
  // Our AI prompt is specifically designed to request these.
  const isDistributionChart = dataKeys.length === 1 && dataKeys[0] === 'Record_Count';
  
  if (isDistributionChart) {
    let isXAxisNumeric = false;
    // Check a sample of up to 50 non-empty values
    const sampleValues = data.slice(0, 50).map(r => r[xAxisKey]).filter(v => v !== null && v !== undefined && v !== '');
    if (sampleValues.length > 0) {
      const numericCount = sampleValues.filter(v => isActuallyNumeric(v)).length;
      // If over 80% of sample values are numeric, treat it as a numeric column
      isXAxisNumeric = (numericCount / sampleValues.length) > 0.8;
    }

    if (isXAxisNumeric) {
      // For numeric distributions, we create histogram bins.
      return createHistogramData(data, xAxisKey, 12);
    } else {
      // For categorical distributions, we MUST aggregate to get counts.
      const aggregatedData = aggregateDataForChart(data, xAxisKey, dataKeys);
      // Sort by count descending to show the most frequent items first, which is most insightful.
      aggregatedData.sort((a, b) => b[dataKeys[0]] - a[dataKeys[0]]);
      return aggregatedData.slice(0, 150);
    }
  }

  // --- Fallback for other chart types (not currently generated by AI, but good practice) ---
  if (chartType === 'scatter') {
     return data.slice(0, 500).map(row => {
         const newRow: any = {};
         // Ensure both X and Y axis values are numeric for scatter plots
         newRow[xAxisKey] = parseValue(row[xAxisKey]);
         dataKeys.forEach(k => {
            newRow[k] = parseValue(row[k]);
         });
         return newRow;
     });
  }

  // For other chart types like time series, we might aggregate or use raw data.
  const xValues = new Set(data.map(r => String(r[xAxisKey])));
  const allUnique = xValues.size === data.length;

  let processedData: DataSet;
  if (allUnique && data.length <= 50) {
    // If X-axis is unique and dataset is small, use values as-is.
    processedData = data.map(row => {
         const newRow: any = { [xAxisKey]: row[xAxisKey] };
         dataKeys.forEach(k => { newRow[k] = parseValue(row[k]); });
         return newRow;
    });
  } else {
    // Otherwise, aggregate.
    processedData = aggregateDataForChart(data, xAxisKey, dataKeys);
  }

  // Generic sorting for non-distribution charts
  const sampleX = processedData[0]?.[xAxisKey];
  const isDateLike = typeof sampleX === 'string' && !/^\d{4}$/.test(sampleX) && !isNaN(Date.parse(sampleX)) && String(sampleX).length >= 4; 

  if (isDateLike) {
      // Sort time series by date
      processedData.sort((a, b) => (new Date(a[xAxisKey]).getTime() - new Date(b[xAxisKey]).getTime()));
  } else if (chartType === 'line') {
      // Sort line charts by x-axis label
      processedData.sort((a, b) => String(a[xAxisKey]).localeCompare(String(b[xAxisKey])));
  } else if (chartType === 'bar' || chartType === 'area') {
      // Sort other bar charts by value
      const sortKey = dataKeys[0];
      processedData.sort((a, b) => b[sortKey] - a[sortKey]);
  }

  return processedData.slice(0, 150); 
};