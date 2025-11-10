import * as XLSX from 'xlsx';
import { DataSet } from '../types';

export const parseExcelFile = (file: File): Promise<DataSet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet) as DataSet;
        
        // Clean and Trim Keys
        // This helps prevent mismatches if headers have accidental leading/trailing spaces
        const cleanData = rawData.map(row => {
          const newRow: Record<string, any> = {};
          Object.keys(row).forEach(key => {
            newRow[key.trim()] = row[key];
          });
          return newRow;
        });

        resolve(cleanData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};