import $ from 'jquery';
// ************ //
/* UI Layout Tweaks */
// ************ //

export function setCardHeights() {
    
    /** Calc Window Height **/
    var windowHeight = $('#ironRadarUI').height(); 
    
    // Convert 2rem to pixels (assuming the root font size is 16px)
    var remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    var heightAdjustment = 2 * remInPixels;

    // Calculate the new height
    var totalViewHeight = windowHeight - heightAdjustment;
    /** END Window Calc **/
    
    /** Set Heights for various cards **/

    // Left Pane
    var totalIndHeight = $('#totalInd').height();
    var availableHeight = totalViewHeight - totalIndHeight;
    $('#frameworkChange').css('height', availableHeight);

    // Center Pane
    $('#centerPane #header').css('height', totalIndHeight);
    var evenSplit = availableHeight/2;
    $('#map').css('height', evenSplit);
    //var listWidth = $('#frameworkList').outerWidth();
    $('#frameworkList').css({
        'height': evenSplit
    });
    
}

// ************ //
/* Print Screen Button */
// ************ //
export function printScreen() {
    html2canvas(document.getElementById('ironRadarUI')).then(function(canvas) {
        // Create an image from the canvas
        var img = canvas.toDataURL('image/png');

        // Create a link to download the image
        var link = $('<a></a>')
            .attr('href', img)
            .attr('download', 'screenshot.png')
            .appendTo('body');

        // Trigger the download
        link[0].click();

        // Remove the link from the document
        link.remove();
    });
}


// ************ //
/* Export data to CSV file */
export function flattenData(nestedData) {
    const flattenedArray = [];

    for (const ipOrDomain in nestedData) {
        for (const port in nestedData[ipOrDomain]) {
            const objectsArray = nestedData[ipOrDomain][port];
            objectsArray.forEach(obj => {
                flattenedArray.push({
                    ...obj,
                    ipOrDomain,
                    port
                });
            });
        }
    }

    return flattenedArray;
}
export function exportData(data) {
    const flattenedData = flattenData(data);

    // Generate a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format the timestamp

    $.ajax({
        url: '/convert-json',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(flattenedData),
        success: function(blob) {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `IronRadar-${timestamp}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error converting JSON to CSV:', textStatus, errorThrown);
            console.error('Response text:', jqXHR.responseText);
        }
    });
}
/* END Export */
// ************ //