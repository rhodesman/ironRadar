import $ from 'jquery';
import Chart from 'chart.js';

// Build the plugin needed to display text in the center of the donut.
Chart.plugins.register({
    beforeDraw: function(chart) {
        if (chart.config.options.elements.center) {
            // Get ctx from the chart
            var ctx = chart.chart.ctx;

            // Get options from the center object in options
            var centerConfig = chart.config.options.elements.center;
            var txt = centerConfig.text;
            var color = centerConfig.color || '#000';
            var fontStyle = centerConfig.fontStyle || 'Arial';
            var fontSizeToUse = centerConfig.fontSize || 12;
            var fontWeight = centerConfig.fontWeight || 400;
            var maxTextWidth = chart.innerRadius * 2 - (centerConfig.sidePadding || 20) * 2;

            // Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = color;
            ctx.font = `${fontWeight} ${fontSizeToUse}px ${fontStyle}`;

            // Split the text into lines that fit within the donut
            var lines = [];
            var words = txt.split(' ');
            var line = '';

            for (var i = 0; i < words.length; i++) {
                var testLine = line + words[i] + ' ';
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;

                if (testWidth > maxTextWidth && i > 0) {
                    lines.push(line.trim());
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line.trim());

            // Calculate the center point for text placement
            var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            var centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            // Determine line height and total height of all lines
            var lineHeight = fontSizeToUse * 1.2; // 1.2 is the line-height multiplier
            var totalHeight = lineHeight * lines.length;

            // Start drawing the lines, vertically centered
            lines.forEach(function(line, index) {
                ctx.fillText(line, centerX, centerY - (totalHeight / 2) + (index * lineHeight));
            });
        }
    }
});

// Define an array of background colors for the chart
const backgroundColors = [
    'rgba(255, 99, 132,1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(40, 159, 64, 1)',
    'rgba(255, 99, 132, 1)'
];

export function renderPieChart(labels, data) {
    const canvas = document.getElementById('threatChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const threatChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Threat Distribution',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                legend: {
                    display: false,
                },
                cutoutPercentage: 75,
                elements: {
                    center: {
                        text: 'Top 10 C2 Frameworks',
                        color: '#ffffff', 
                        fontStyle: 'Arial', 
                        fontSize: 12,
                        fontWeight: 400,
                        sidePadding: 20 
                    }
                }
            }
        });
        updateLabelTable(labels, data, '#threatList1', '#threatList2');  
    } else {
        console.error('Canvas element not found!');
    }
}

export function renderPortChart(portsData) {
    const labels = portsData.map(item => `Port ${item.port}`);
    const dataPoints = portsData.map(item => item.count);

    const ctx = document.getElementById('portChart').getContext('2d');
    
    if (ctx) {
        const portChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Threat Distribution',
                    data: dataPoints,
                    backgroundColor: backgroundColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                legend: {
                    display: false,
                },
                cutoutPercentage: 75,
                elements: {
                    center: {
                        text: 'Top 10 Ports',
                        color: '#ffffff', 
                        fontStyle: 'Arial', 
                        fontSize: 12,
                        fontWeight: 400,
                        sidePadding: 20 
                    }
                }
            }
        });
        updateLabelTable(labels, dataPoints, '#portList1', '#portList2');  
    } else {
        console.error('Canvas element not found!');
    }
}

function updateLabelTable(labels, dataPoints, listOne, listTwo) {
    // Clear existing content
    $(listOne).empty();
    $(listTwo).empty();

    // Calculate the total of data points for percentage calculation
    const total = dataPoints.reduce((sum, current) => sum + current, 0);

    labels.forEach((label, index) => {
        // Calculate the percentage for each data point
        const percentage = ((dataPoints[index] / total) * 100).toFixed(2); // round to two decimal places

        // Create list items with label and percentage
        const $listItem = $('<li>');
        // Add color box
        const $colorBox = $('<span>').addClass('label-color').css({
            'background-color': backgroundColors[index]   
        });
        // Create spans for label and percentage
        const $labelSpan = $('<span>').addClass('label-span').text(label);
        const $percentageSpan = $('<span>').addClass('percentage-span').text(`${percentage}%`);

        // Append color box, label span, and percentage span to the list item
        $listItem.append($colorBox).append($labelSpan).append($percentageSpan);

        // Determine which column to append to
        if (index < 5) {
            $(listOne).append($listItem);
        } else {
            $(listTwo).append($listItem);
        }
    });
}