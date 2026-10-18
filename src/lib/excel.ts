function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function downloadExcel(
  fileName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const headerXml = headers
    .map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = headers.map((_, index) => {
        const value = row[index];
        if (typeof value === "number" && Number.isFinite(value)) {
          return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
        }
        return `<Cell><Data ss:Type="String">${escapeXml(value == null ? "" : String(value))}</Data></Cell>`;
      });
      return `<Row>${cells.join("")}</Row>`;
    })
    .join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#E8F3F7" ss:Pattern="Solid"/></Style>
</Styles>
<Worksheet ss:Name="iBanga">
<Table>
<Row ss:StyleID="header">${headerXml}</Row>
${body}
</Table>
</Worksheet>
</Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".xls") ? fileName : `${fileName}.xls`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
