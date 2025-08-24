import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export dashboard chart and details as PDF
 * @param {Object} options - Export options
 * @param {HTMLElement} options.chartElement - Chart DOM element to capture
 * @param {Array} options.chartData - Chart data for details
 * @param {string} options.period - Selected time period
 * @param {string} options.chartType - Chart type (area/bar)
 * @param {Object} options.stats - Dashboard statistics
 */
export const exportDashboardPDF = async ({
    chartElement,
    chartData,
    period,
    chartType,
    stats
}) => {
    try {
        // Create new PDF document
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Set initial Y position
        let yPosition = margin;

        // Add header
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Unify Admin Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Add subtitle with date and period
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
        // Convert API period to display format
        const displayPeriodMap = {
            '7days': 'This Week',
            '30days': 'This Month',
            '12months': '12 Months'
        };
        const displayPeriod = displayPeriodMap[period] || period;
        pdf.text(`Period: ${displayPeriod} | Chart Type: ${chartType}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // Add statistics summary
        if (stats) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Dashboard Statistics', margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            const statsData = [
                { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || 0 },
                { label: 'Total Posts', value: stats.totalPosts?.toLocaleString() || 0 },
                { label: 'Pending Reports', value: stats.totalPendingReports || 0 },
                { label: 'Active Users', value: stats.activeUsers?.toLocaleString() || 0 }
            ];

            statsData.forEach((stat, index) => {
                const x = margin + (index % 2) * (contentWidth / 2);
                const y = yPosition + Math.floor(index / 2) * 8;
                pdf.text(`${stat.label}: ${stat.value}`, x, y);
            });

            yPosition += 20;
        }

        // Capture chart as image
        if (chartElement) {
            try {
                // Wait a bit for chart to render properly
                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(chartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: chartElement.offsetWidth,
                    height: chartElement.offsetHeight,
                    logging: false,
                    removeContainer: true
                });

                const imgData = canvas.toDataURL('image/png');

                // Calculate chart dimensions to fit on page
                const chartAspectRatio = canvas.width / canvas.height;
                const maxChartWidth = contentWidth;
                const maxChartHeight = 120; // Leave space for details

                let chartWidth = maxChartWidth;
                let chartHeight = chartWidth / chartAspectRatio;

                if (chartHeight > maxChartHeight) {
                    chartHeight = maxChartHeight;
                    chartWidth = chartHeight * chartAspectRatio;
                }

                // Center the chart
                const chartX = margin + (contentWidth - chartWidth) / 2;

                // Add chart to PDF
                pdf.addImage(imgData, 'PNG', chartX, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 15;
            } catch (chartError) {
                console.error('Error capturing chart:', chartError);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'italic');
                pdf.text('Chart could not be captured', margin, yPosition);
                yPosition += 10;

                // Add a note about the chart data
                pdf.setFontSize(10);
                pdf.text('Chart data is available in the table below', margin, yPosition);
                yPosition += 8;
            }
        }

        // Add chart data details
        if (chartData && chartData.length > 0) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Chart Data Details', margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');

            // Create table headers
            const headers = ['Date', 'New Users', 'Active Users'];
            const colWidths = [40, 35, 35];
            let xPos = margin;

            // Draw header row
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');

            headers.forEach((header, index) => {
                pdf.setFont('helvetica', 'bold');
                pdf.text(header, xPos, yPosition);
                xPos += colWidths[index];
            });

            yPosition += 8;

            // Draw data rows
            chartData.forEach((row, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 30) {
                    pdf.addPage();
                    yPosition = margin;
                }

                xPos = margin;
                pdf.setFont('helvetica', 'normal');

                const dataKey = period === '12 Months' ? 'month' : 'day';
                pdf.text(row[dataKey] || '', xPos, yPosition);
                xPos += colWidths[0];

                pdf.text((row.newUsers || 0).toString(), xPos, yPosition);
                xPos += colWidths[1];

                pdf.text((row.activeUsers || 0).toString(), xPos, yPosition);

                yPosition += 6;
            });
        }

        // Add footer
        yPosition = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Generated by Unify Admin Dashboard', pageWidth / 2, yPosition, { align: 'center' });

        // Save the PDF
        const fileName = `unify-dashboard-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        return { success: true, fileName };
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF export');
    }
};

/**
 * Export simple data as CSV
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 */
export const exportAsCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) {
        throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
