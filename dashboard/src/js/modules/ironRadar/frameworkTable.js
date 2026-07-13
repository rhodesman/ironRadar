import $ from 'jquery';

export function SortByThreat(a, b) {
    if (a.threat < b.threat) return -1;
    if (a.threat > b.threat) return 1;
    return 0;
}

// ************ //
/* Add Data to Detailed Framework Table */
// ************ //
export function populateTable(threatData) {
    var $tableBody = $('#detectedFrameworks tbody');

    // Clear existing table rows
    $tableBody.empty();
    
    // Iterate through each item in the threatData array
    $.each(threatData, function(index, item) {
        var $row = $('<tr>');

        // Creating and inserting cells for each piece of data
        $row.append($('<td>').text(item.ip));
        $row.append($('<td>').text(item.port));
        $row.append($('<td>').text(item.threat));
        $row.append($('<td>').text(item.type));
        $row.append($('<td>').text(item.confidence));

        // Append the new row to the table body
        $tableBody.append($row);
    });
}

export function updateFrameworkTable(dataArray) {
    dataArray.sort(SortByThreat);
    populateTable(dataArray);
}