import $ from 'jquery';

import { updateFrameworkTable } from './frameworkTable.js';
import { fetchData } from './queryData.js';
import { performSearch } from './search.js';

export function processData(data) {
    const dataArray = [];
    const threatCounts = {};
    const ipCounts = {};
    const pieThreatCounts = {};

    // Process each IP address block
    $.each(data, function(ip, ports) {
        processIPBlock(ip, ports, dataArray, threatCounts, ipCounts);
    });

    fetchData(data);
    
    const combinedCountArray = createCombinedCountArray(threatCounts, ipCounts);
    const totalUniqueThreats = Object.keys(threatCounts).length;
    const totalUniqueIPs = Object.keys(ipCounts).length;

    return {
        dataArray,
        threatCounts,
        ipCounts,
        pieThreatCounts,
        combinedCountArray,
        totalUniqueThreats,
        totalUniqueIPs
    };
}

export function processIPBlock(ip, ports, dataArray, threatCounts, ipCounts) {
    if (!ipCounts[ip]) {
        ipCounts[ip] = 1;
    } else {
        ipCounts[ip]++;
    }
    $.each(ports, function(port, details) {
        details.forEach(function(detail) {
            const record = createRecord(ip, port, detail);
            dataArray.push(record);
            updateThreatCounts(detail.threat, threatCounts);
        });
    });
}

export function createRecord(ip, port, detail) {
    return {
        ip: ip,
        port: port,
        last_seen: detail.last_seen,
        threat: detail.threat,
        threat_type: detail.threat_type,
        confidence: detail.confidence,
        tlp: detail.tlp,
        type: detail.type
    };
}

export function updateThreatCounts(threat, threatCounts) {
    if (!threatCounts[threat]) {
        threatCounts[threat] = 1;
    } else {
        threatCounts[threat]++;
    }
}

export function createCombinedCountArray(threatCounts, ipCounts) {
    // Convert the threatCounts and ipCounts objects to arrays and sort them
    var combinedCountArray = Object.keys(threatCounts).map(function(key) {
        return { type: 'threat', indicator: key, count: threatCounts[key] };
    }).concat(Object.keys(ipCounts).map(function(key) {
        return { type: 'ip', indicator: key, count: ipCounts[key] };
    })).sort(function(a, b) {
        return b.count - a.count; // Sort by count in descending order
    });

    var totalUniqueThreats = Object.keys(threatCounts).length;
    var totalUniqueIPs = Object.keys(ipCounts).length;

    // Add total unique counts to the array
    combinedCountArray.push({ type: 'total', indicator: 'Total Unique Threats', count: totalUniqueThreats });
    combinedCountArray.push({ type: 'total', indicator: 'Total Unique IPs', count: totalUniqueIPs });

    return combinedCountArray;

}

export function updateUI(processedData, renderPieChartCallback, renderPortChartCallback) {
    updateTotalIndicators(processedData.totalUniqueThreats + processedData.totalUniqueIPs);
    updateFrameworkCounters(processedData.combinedCountArray);
    const pieChartData = updatePieChart(processedData.dataArray, processedData.pieThreatCounts);
    renderPieChartCallback(pieChartData.labels, pieChartData.dataPoints);
    const topPorts = processPorts(processedData.dataArray);
    renderPortChartCallback(topPorts);
    updateFrameworkTable(processedData.dataArray);
    //fetchData(processedData.dataArray);
}

export function updateTotalIndicators(totalIndicators) {
    const formattedTotalIndicators = totalIndicators.toLocaleString();
    $('#totalInd .total').empty().append(formattedTotalIndicators);
}

export function updateFrameworkCounters(combinedCountArray) {
    // Clear previous contents
    var $dataTotals = $('#frameworkChange .data-totals');
    $dataTotals.empty();

    // Calculate the total count of all threats
    var totalCount = combinedCountArray.reduce(function(acc, item) {
        if (item.type === 'threat') {
            return acc + item.count;
        }
        return acc;
    }, 0);

    combinedCountArray.forEach(function(item) {
        // Populate Framework Indicators
        if (item.type === 'threat') {
            var formattedCount = item.count.toLocaleString();
            var percentage = ((item.count / totalCount) * 100).toFixed(2); // Calculate percentage

            var $dataSum = $('<div/>', { 'class': 'data-sum' });
            var $indicatorSpan = $('<span/>', {
                'class': 'indicator',
                text: item.indicator
            });
            var $countSpan = $('<span/>', {
                'class': 'total',
                text: percentage + '%' 
            });

            // Append spans to the div
            $dataSum.append($countSpan).append($indicatorSpan);
            
            // Append the div to .data-totals
            $dataTotals.append($dataSum);
        }
    });
}

export function updatePieChart(dataArray, pieThreatCounts) {
    const sortedThreats = preparePieChartData(dataArray, pieThreatCounts);
    const labels = sortedThreats.map(item => item.threat);
    const dataPoints = sortedThreats.map(item => item.count);
    return { labels, dataPoints };
}

export function preparePieChartData(dataArray, pieThreatCounts) {
    // Clear existing pieThreatCounts
    for (let key in pieThreatCounts) {
        delete pieThreatCounts[key];
    }

    // Collect and Build PieChart Data
    dataArray.forEach(function(item) {
        const threat = item.threat;
        if (pieThreatCounts[threat]) {
            pieThreatCounts[threat]++;
        } else {
            pieThreatCounts[threat] = 1;
        }
    });

    // Convert threatCounts to an array and sort
    var sortedThreats = Object.entries(pieThreatCounts).map(function([key, value]) {
        return { threat: key, count: value };
    });

    // Sort threats by count in descending order
    sortedThreats.sort(function(a, b) {
        return b.count - a.count;
    });

    // Slice to get only the top 10 threats
    return sortedThreats.slice(0, 10);
}

export function processPorts(data) {
    const portCounts = {};

    // Loop through each record in the data and count ports
    data.forEach(function(item) {
        const port = item.port;
        if (portCounts[port]) {
            portCounts[port]++;
        } else {
            portCounts[port] = 1;
        }
    });

    // Convert to an array, sort, and get the top 10 ports
    const topPorts = Object.entries(portCounts)
        .map(([port, count]) => ({ port, count }))
        .sort((a, b) => b.count - a.count) // Sort in descending order
        .slice(0, 10); // Get the top 10

    return topPorts;
}

export function setupEventListeners(data) {
    $('#upload-json-button').on("click", function(event) {
        event.preventDefault();
        exportData(data);
    });

    $('#searchButton').on('click', performSearch);
    
    $('#search').on('keypress', function(event) {
        if (event.which == 13) {
            event.preventDefault();
            performSearch();
        }
    });
}

