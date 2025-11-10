import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, AnalysisResponseSchema, DataSet } from "../types";

// Helper to calculate full dataset statistics to prevent hallucination on samples
const calculateDatasetStats = (data: DataSet) => {
  const totalRows = data.length;
  const headers = Object.keys(data[0] || {});
  
  const columnStats = headers.map(header => {
    const values = data.map(row => row[header]);
    const definedValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(definedValues.map(v => String(v))).size;
    
    // Check if column is primarily numeric
    // We check a sample of up to 500 non-empty values for better accuracy
    const sampleSize = Math.min(definedValues.length, 500);
    const sample = definedValues.slice(0, sampleSize);
    const numericCount = sample.filter(v => {
        if (typeof v === 'number') return true;
        if (typeof v === 'string') return !isNaN(parseFloat(v.replace(/[^0-9.-]/g, '')));
        return false;
    }).length;

    const isNumeric = sampleSize > 0 && (numericCount / sampleSize) > 0.8;
    
    let detailedStats = "";

    if (isNumeric) {
        // Calculate min, max, average for numeric columns using all data
        const nums = definedValues.map(v => {
             if (typeof v === 'number') return v;
             return parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        }).filter(n => !isNaN(n));

        if (nums.length > 0) {
             const min = Math.min(...nums);
             const max = Math.max(...nums);
             const sum = nums.reduce((a, b) => a + b, 0);
             const avg = sum / nums.length;
             detailedStats = `Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(2)}`;
        }
    } else {
        // Calculate frequency for categorical columns
        const valueCounts: Record<string, number> = {};
        definedValues.forEach(v => {
            const key = String(v);
            valueCounts[key] = (valueCounts[key] || 0) + 1;
        });
        
        // Sort by frequency desc and take top 20
        const sortedValues = Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); 

        detailedStats = `Top Values: ${sortedValues.map(([val, count]) => `"${val}" (${count})`).join(', ')}`;
    }

    return {
      name: header,
      type: isNumeric ? 'Numeric' : 'Categorical',
      uniqueCount: uniqueValues,
      details: detailedStats
    };
  });

  return { totalRows, columnStats };
};

export const analyzeDataset = async (data: DataSet): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Calculate Stats for the FULL dataset
  const stats = calculateDatasetStats(data);

  // 2. Prepare Sample (First 50 rows)
  const sampleRows = data.slice(0, 50);
  const sampleJson = JSON.stringify(sampleRows, null, 2);

  // 3. Construct Prompt
  // We explicitly instruct the model to use the detailed stats for deep insights.
  const prompt = `
    You are an expert Senior Data Analyst. I will provide you with a dataset sample and DETAILED STATISTICAL METADATA about the full dataset.
    
    DATASET STATS (Calculated from all ${stats.totalRows} rows):
    - Total Rows: ${stats.totalRows}
    - Columns:
    ${stats.columnStats.map(c => `  - "${c.name}": ${c.type}, ${c.uniqueCount} unique. Stats: [${c.details}]`).join('\n')}

    YOUR TASK:
    1. Analyze the data structure and content using the Stats and Sample.
    2. Provide a concise executive summary.
    3. **DEEP DIVE INSIGHTS (CRITICAL):**
       - Provide 8-10 detailed, specific, and actionable insights.
       - Do NOT provide generic observations like "There are many products". 
       - INSTREAD, say "The product 'X' is the top seller with 500 orders, followed by 'Y' (300 orders)."
       - Look for distributions: Which categories are heavily represented? (Use the 'Top Values' stats provided).
       - Look for anomalies: Are there specific outliers in numeric data?
       - Mention specific item names, regions, or categories that stand out.
    4. Define 3-4 Key Performance Indicators (KPIs). 
       - Use the 'DATASET STATS' provided above for accurate counts (e.g., "Total Orders", "Unique Customers"). 
       - Do NOT calculate totals based only on the 50-row sample.
    5. Suggest 3-4 distinct visualizations (Charts).
       - If the dataset is CATEGORICAL (e.g., Status, Region, Product), visualization of FREQUENCY is best.
       - **To show frequency/counts, use 'Record_Count' as the dataKey.** 
         Example: { title: "Top 10 Products by Order Volume", xAxisKey: "Product Name", dataKeys: ["Record_Count"], type: "bar" }
       - Choose from chart types: 'bar', 'line', 'pie', 'area', 'scatter'.

    Dataset Sample (First 50 rows):
    ${sampleJson}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: AnalysisResponseSchema,
        temperature: 0.2,
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    const analysis = JSON.parse(resultText) as AnalysisResult;
    return analysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};