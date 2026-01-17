import * as XLSX from 'xlsx';
import { prepareExcelData } from './generateHistoricalRankings';

/**
 * Export ranking data to Excel file
 * @param {Object} historicalData - Historical rankings data
 * @param {string} category - Category name
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
export const exportRankingsToExcel = (historicalData, category, startDate, endDate) => {
  try {
    // Prepare data
    const data = prepareExcelData(historicalData, category, startDate, endDate);

    if (data.length === 0) {
      alert('선택한 기간에 데이터가 없습니다.');
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 10 }, // Rank column
      ...data[0].slice(1).map(() => ({ wch: 50 })) // Date columns (wide for product names)
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    const sheetName = category.substring(0, 31); // Excel sheet names max 31 chars
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename
    const filename = `${category}_Rankings_${startDate}_to_${endDate}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);

    console.log(`✅ Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Excel 파일 다운로드 중 오류가 발생했습니다.');
  }
};

/**
 * Export multiple categories to Excel (separate sheets)
 * @param {Object} historicalData - Historical rankings data
 * @param {string[]} categories - Array of category names
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
export const exportMultipleCategoriesToExcel = (historicalData, categories, startDate, endDate) => {
  try {
    const wb = XLSX.utils.book_new();

    categories.forEach(category => {
      const data = prepareExcelData(historicalData, category, startDate, endDate);

      if (data.length === 0) return;

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      const colWidths = [
        { wch: 10 },
        ...data[0].slice(1).map(() => ({ wch: 50 }))
      ];
      ws['!cols'] = colWidths;

      const sheetName = category.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    if (wb.SheetNames.length === 0) {
      alert('선택한 기간에 데이터가 없습니다.');
      return;
    }

    const filename = `Amazon_Rankings_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log(`✅ Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Excel 파일 다운로드 중 오류가 발생했습니다.');
  }
};
