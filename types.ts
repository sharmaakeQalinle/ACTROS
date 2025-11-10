import { Type } from "@google/genai";

// Data types
export type DataRow = Record<string, any>;
export type DataSet = DataRow[];

// Analysis Result Types
export interface KPI {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter'
}

export interface ChartConfig {
  title: string;
  description: string;
  type: ChartType;
  xAxisKey: string;
  dataKeys: string[];
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  kpis: KPI[];
  charts: ChartConfig[];
}

// Schema definitions for Gemini
export const KPISchema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING },
    value: { type: Type.STRING }, // Using string to handle formatting like "$50k" easily
    trend: { type: Type.STRING, description: "Optional trend indicator like '+5%' or 'up'" }
  },
  required: ["label", "value"]
};

export const ChartConfigSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["bar", "line", "pie", "area", "scatter"] },
    xAxisKey: { type: Type.STRING, description: "The column name to use for the X-axis" },
    dataKeys: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The column name(s) to plot values for" }
  },
  required: ["title", "type", "xAxisKey", "dataKeys"]
};

export const AnalysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A brief executive summary of the dataset." },
    insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "8-10 detailed, comprehensive, and specific insights derived from the data. Focus on naming specific items, categories, trends, and anomalies." },
    kpis: { type: Type.ARRAY, items: KPISchema, description: "3-4 key performance indicators." },
    charts: { type: Type.ARRAY, items: ChartConfigSchema, description: "3-4 suggested visualizations." }
  },
  required: ["summary", "insights", "kpis", "charts"]
};