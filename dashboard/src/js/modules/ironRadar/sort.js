import $ from 'jquery';

export function initializeSorting() {
    $('table.sortable th').on("click", function() {
        // Add the class at the start of the click event
        $('#detectedFrameworks tbody').addClass('pleaseHold');
        $('.dual-ring').addClass('pleaseHold');
    
        // Use setTimeout to allow the DOM to update before continuing with the sorting
        setTimeout(() => {
            var table = $(this).parents('table').eq(0);
            var column_index = get_column_index(this);
            var rows = table.find('tbody tr').toArray().sort(comparer(column_index));

            this.asc = !this.asc;

            if (!this.asc) {
                rows = rows.reverse();
                $('.headerSort').removeClass('arrow-down arrow-up')
                $(this).addClass('arrow-up');
            } else {
                $('.headerSort').removeClass('arrow-down arrow-up')
                $(this).addClass('arrow-down');
            }

            // Append the sorted rows to the table
            for (var i = 0; i < rows.length; i++) {
                table.append(rows[i]);
            }

            // Remove the class after the sorting is complete
            $('#detectedFrameworks tbody').removeClass('pleaseHold');
            $('.dual-ring').removeClass('pleaseHold');
        }, 0); // 0ms delay to allow the DOM update to happen
    });
}

function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index);
        return isNumber(valA) && isNumber(valB) ? valA - valB : valA.localeCompare(valB);
    }
}

function getCellValue(row, index) { 
    return $(row).children('td').eq(index).html() 
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function get_column_index(element) {
    var clickedEl = $(element);
    var myCol = clickedEl.closest("th").index();
    var myRow = clickedEl.closest("tr").index();
    var rowspans = $("th[rowspan]");
    rowspans.each(function () {
        var rs = $(this);
        var rsIndex = rs.closest("tr").index();
        var rsQuantity = parseInt(rs.attr("rowspan"));
        if (myRow > rsIndex && myRow <= rsIndex + rsQuantity - 1) {
            myCol++;
        }
    });
    return myCol;
}