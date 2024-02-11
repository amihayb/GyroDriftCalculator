// Define a global variable to store parsed CSV data
var csvData = {};
var pX = [];
var pY = [];
var pZ = [];

function polynomialFit(xValues, yValues) {
    // Prepare the data in the format expected by regression-js
    var data = [];
    for (var i = 0; i < xValues.length; i++) {
        data.push([xValues[i], yValues[i]]);
    }

    // Perform polynomial fitting
    var result = regression.polynomial(data, { order: 3, precision: 16 });



    // Extract the coefficients from the result
    var coefficients = result.equation;

    return coefficients;
}


function handleDrop(event) {
    event.preventDefault();
    var file = event.dataTransfer.files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        var contents = e.target.result;
        var lines = contents.split('\n');

        var headers = lines[0].split(',');
        for (var i = 0; i < headers.length; i++) {
            csvData[headers[i]] = [];
        }

        // Parse rows
        for (var j = 1; j < lines.length; j++) {
            var row = lines[j].split(',');
            for (var k = 0; k < headers.length; k++) {
                var value = parseFloat(row[k]);
                csvData[headers[k]].push(isNaN(value) ? null : value);
            }
        }
        console.log(csvData);

        pX = polynomialFit(csvData.Temperature, csvData.GRAWX);
        pY = polynomialFit(csvData.Temperature, csvData.GRAWY);
        pZ = polynomialFit(csvData.Temperature, csvData.GRAWZ);

        console.log('pY');
        console.log(pY);

        plotMe(pX, pY, pZ);
        updateRes(pX, pY, pZ)
        //displayData();
    };

    reader.readAsText(file);
}

function updateRes(pX, pY, pZ) {
    document.getElementById('p1Span').textContent = pX;
    document.getElementById('p2Span').textContent = pY;
    document.getElementById('p3Span').textContent = pZ;
}

function plotMe(pX, pY, pZ) {

    T = createVector(-20, 60);
    D = [];
    D.push(calculateY(T, pX));
    D.push(calculateY(T, pY));
    D.push(calculateY(T, pZ));
    console.log('T');
    console.log(T);
    console.log('D');
    console.log(D);
    plotSubplots(T, D);
}


function plotSubplots(xVector, yVectors) {
    var traces = [];

    // Create traces for each y vector

    traces.push({
        x: csvData.Temperature,
        y: csvData.GRAWX,
        yaxis: 'y1',
        type: 'scatter',
        name: 'X'
    });

    traces.push({
        x: csvData.Temperature,
        y: csvData.GRAWY,
        yaxis: 'y2',
        type: 'scatter',
        name: 'Y'
    });

    traces.push({
        x: csvData.Temperature,
        y: csvData.GRAWZ,
        yaxis: 'y3',
        type: 'scatter',
        name: 'Z'
    });


    for (var i = 0; i < yVectors.length; i++) {
        traces.push({
            x: xVector,
            y: yVectors[i],
            yaxis: 'y' + (i + 1),
            row: i,
            col: 1,
            type: 'scatter',
            mode: 'lines',
            name: 'Fit ' + (i + 1)
        });
    }

    // Define layout for subplots
    var layout = {
        title: 'Gyro Drift vs Temperature',
        grid: { rows: 3, columns: 1 },
        height: 600,
        xaxis: { title: 'Temp. [C]' },
        yaxis: { title: 'Drift [deg/s]' }
    };

    // Create subplots
    Plotly.newPlot('plot', traces, layout);
}


function handleDragOver(event) {
    event.preventDefault();
}


// Function to display parsed CSV data
function displayData() {
    var table = '<table border="1">';
    table += '<thead>';
    table += '<tr>';

    // Display headers
    var headers = Object.keys(csvData);
    for (var i = 0; i < headers.length; i++) {
        table += '<th>' + headers[i] + '</th>';
    }

    table += '</tr>';
    table += '</thead>';
    table += '<tbody>';

    // Determine the maximum number of rows
    var maxRows = 0;
    for (var key in csvData) {
        if (csvData.hasOwnProperty(key) && csvData[key].length > maxRows) {
            maxRows = csvData[key].length;
        }
    }

    // Display rows
    for (var j = 0; j < maxRows; j++) {
        table += '<tr>';
        for (var k = 0; k < headers.length; k++) {
            table += '<td>' + (csvData[headers[k]][j] || '') + '</td>';
        }
        table += '</tr>';
    }

    table += '</tbody>';
    table += '</table>';

    document.getElementById('csv_content').innerHTML = table;
}

function calculateY(xVector, coefficients) {

    coefficients = coefficients.reverse();
    var yVector = [];
    for (var i = 0; i < xVector.length; i++) {
        var x = xVector[i];
        var y = 0;
        for (var j = 0; j < coefficients.length; j++) {
            y += coefficients[j] * Math.pow(x, j);
        }
        yVector.push(y);
    }
    return yVector;
}

function postScript() {
    alert('	XAXIS=1	//Azimuth\ndisable\nXAXIS=0 //Elevation\ndisable //Disable both axis \nlog "Time,Temperature,GRAWX,GRAWY,GRAWZ", 0\nset TIME=0 //Set time to 0\nV0 = GTMP\nV1 = GRAWX\nV2 = GRAWY\nV3 = GRAWZ\nV11 = 0.001  // filter coefficient \nV12 = TIME\nwhile GTMP< 60.5\n	V0 = V11* GTMP + (1-V11)*V0\n	V1 = V11* GRAWX + (1-V11)*V1\n	V2 = V11* GRAWY + (1-V11)*V2\n	V3 = V11* GRAWZ + (1-V11)*V3\n	if TIME – V12 > 5000\n		log "{0},{1},{2},{3},{4}",TIME,GTMP,GRAWX,GRAWY,GRAWZ //Record log\n		V12 = TIME\nend\nend\n');
}

function downloadExampleCsv() {

    var csvUrl = 'https://raw.githubusercontent.com/amihayb/GyroDriftCalculator/main/example-measurement.csv';
    
    fetch(csvUrl)
        .then(response => response.blob())
        .then(blob => {
            // Create a temporary anchor element
            var link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = 'example-measurement.csv'; // Filename when downloaded
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
}


const createVector = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
// const calculateY = (xValues, coefficients) => xValues.map(x => coefficients.reduce((acc, coeff, index) => acc + coeff * Math.pow(x, index), 0));
