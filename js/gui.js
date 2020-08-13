/* Funkcje muszą być wczytane przed GUI ! */
'use strict';

/**
 * Obiekt zawierający elementy GUI, na któych wykonywane są operacje w kodzie.
*/
const GUI = {

    // Modal
    popup_result: document.getElementById("popup_result") ,
    modal_content: document.getElementById("modal_content") ,
    modal_close: document.getElementById("modal_close") ,

    // Pole z przyciskami
    btn_state: document.getElementById("gui-btn_state") ,
    btn_refresh: document.getElementById("gui-btn_refresh") ,
    
    // Pola funkcji
    select_fun: document.getElementById("gui-select_fun") ,
    check_negatives: document.getElementById("gui-check_negatives") ,
    nof_iterations: document.getElementById("gui-nof_iterations") ,
    nof_series: document.getElementById("gui-nof_series") ,
    check_3d: document.getElementById("gui-check_3d") ,

    // Osie
    nof_minx: document.getElementById("gui-nof_minx") ,
    nof_maxx: document.getElementById("gui-nof_maxx") ,
    nof_miny: document.getElementById("gui-nof_miny") ,
    nof_maxy: document.getElementById("gui-nof_maxy") ,
    nof_speed: document.getElementById("gui-nof_speed") ,

    // Pola algorytmów
    nof_particles: document.getElementById("gui-nof_particles") ,
    nof_interia: document.getElementById("gui-nof_interia") ,
    nof_ginfl: document.getElementById("gui-nof_ginfl") ,
    nof_linfl: document.getElementById("gui-nof_linfl") ,

    // Inne opcje
    select_theme: document.getElementById("gui-select_theme") ,
    btn_png: document.getElementById("gui-btn_png") ,
    btn_jpeg: document.getElementById("gui-btn_jpeg") ,

    // Kontener wykresu
    cont_plot: document.getElementById("gui-cont_plot") ,
};

/**
 * Obiekt layout-u wykresu
*/
const PLOT_LAY = {
    autosize: true ,
    hovermode: false ,
    showlegend: false ,
    margin: { l: 0 ,  r: 0 , t: 0 , b: 0 } ,
    paper_bgcolor: "black" ,
    font: {
        color: "rgb(199 , 199 , 199)"
    } ,
    scene: {
        xaxis: {
            showspikes: false ,
            backgroundcolor: "rgb(17 , 17 , 17)" ,
            gridcolor: "rgb(47 , 47 , 47)"
        } ,
        yaxis: {
            showspikes: false ,
            backgroundcolor: "rgb(17 , 17 , 17)" ,
            gridcolor: "rgb(47 , 47 , 47)"
        } ,
        zaxis: {
            showspikes: false ,
            backgroundcolor: "rgb(17 , 17 , 17)" ,
            gridcolor: "rgb(47 , 47 , 47)"
        }
    }
};

/**
 * Obiekt danych wykresu (szablon).
*/
const PLOT_DAT = {
    type: "surface" ,
    showscale: false ,
    contours: {
        x: { highlight: false } ,
        y: { highlight: false } ,
        z: { highlight: false }
    }
};

/**
 * Obiekt konfiguracji wykresu.
*/
const PLOT_CFG = {
    displayModeBar: false ,
    responsive: true
};

/**
 * Referencja do aktualnie wybranej funkcji.
*/
let CurrentFun = null;

/**
 * Pole odwracania wartości funkcji.
*/
let ReverseFunction = false;

let UpdateRequired = false;
let ModalVisible = false;
let LineData = [];

///////////////////////////////////////////////////////////////////////////////////////////////////

GUI.modal_close.addEventListener("click" , () => {

    // Ukrywanie okna
    GUI.popup_result.style.display = "none";
    // EReset flagi widoczności
    ModalVisible = false;
    // Niszczenie wygresu
    Plotly.purge(GUI.modal_content);

});

window.addEventListener("load" , () => {

    // Reset
    GUI.nof_series.value = 1;
    GUI.nof_iterations.value = 25;
    GUI.check_3d.checked = true;
    GUI.check_negatives.checked = false;
    GUI.nof_particles.value = 10;
    GUI.nof_interia.value = 0.5;
    GUI.nof_ginfl.value = 1.5;
    GUI.nof_linfl.value = 1.0;

    // Tworzenie listy funkcji
    for (let k in FUNCTIONS) {
        
        // Zabezpieczenie przed sprawdzaniem prymitywów
        if (!FUNCTIONS.hasOwnProperty(k) || FUNCTIONS[k].name === null) {
            continue;
        } else {

            // Dodawanie nowego elementu
            let item = document.createElement("option");
            item.innerHTML = FUNCTIONS[k].name;
            GUI.select_fun.appendChild(item);
        }
    }

    // Wybieranie funkcji z listy
    GUI.select_fun.selectedIndex = 0;
    CurrentFun = getFunctionFromName(GUI.select_fun.value);
    applySelectedFunction();

});

GUI.select_fun.addEventListener("change" , () => {
    CurrentFun = getFunctionFromName(GUI.select_fun.value);
    applySelectedFunction();
});

GUI.check_negatives.addEventListener("change" , () => {

    ReverseFunction = GUI.check_negatives.checked ? true : false ;
    generatePlot();

});

GUI.check_3d.addEventListener("click" , () => {

    PLOT_DAT.type = GUI.check_3d.checked ? "surface" : "contour"; 
    generatePlot();

});

GUI.select_theme.addEventListener("change" , () => {
    generatePlot();
});

GUI.btn_refresh.addEventListener("click" , () => {

    generatePlot();

});

GUI.btn_png.addEventListener("click" , () => savePlotAsImage("png"));
GUI.btn_jpeg.addEventListener("click" , () => savePlotAsImage("jpeg"));

GUI.btn_state.addEventListener("click" , () => {

    // Sprawdzanie liczby wykonywanych serii
    let NumberOfSeries = GUI.nof_series.valueAsNumber;

    if (NumberOfSeries < 1 || NumberOfSeries > 25) {
        window.alert(`Wartość '${NumberOfSeries}' jest nieprawidłową ilością serii.\r\n. D0zwolona wartość to: 1-10.`);
    }

    //Resetowanie tablicy przechowującej dane jednej serii
    LineData = [];

    let Range = [];

    let Lines = [];

    // Obiekt konfiguracji algorytmu (jednakowy dla każdej serii)
    let AlgorithmConfig = {
    
        swarmSize:          GUI.nof_particles.valueAsNumber ,
        epochesLimit:       GUI.nof_iterations.valueAsNumber ,
        calculateError:     CurrentFun.calculate ,
        negatives:          GUI.check_negatives.checked ,

        ranges: [
            { minimum: GUI.nof_minx.valueAsNumber , maximum: GUI.nof_maxx.valueAsNumber } ,
            { minimum: GUI.nof_miny.valueAsNumber , maximum: GUI.nof_maxy.valueAsNumber }
        ],
        particleSpeed: GUI.nof_speed.valueAsNumber ,

        particleInteria: GUI.nof_interia.valueAsNumber ,
        globalAcceleration: GUI.nof_ginfl.valueAsNumber ,
        localAcceleration: GUI.nof_linfl.valueAsNumber ,
        
        onIterationFinished: (epochIndex, bestGlobalSolution) => {
            let error = bestGlobalSolution.error;
            let position = bestGlobalSolution.position;
            LineData.push(error);
            Range.push(epochIndex);
            //console.log(epochIndex + '\t' + error + '\t[' + position + ']');

            // Aktualizacja pozycji cząsteczek
            // ...
        }
    };

    let series_min = {
        i: null ,
        v: null
    };

    for (let i = 0 ; i < NumberOfSeries ; i++) {
        LineData = [];
        let algorithm = new PSO(AlgorithmConfig);

        //console.log('[epoch]\t[error]\t\t\t[position]\n');

        let result = algorithm.start();
        
        let min = Math.min(...LineData);
        let it = LineData.findIndex(e => e == min);
        Lines.push({
            x: [...Range] ,
            y: [...LineData] ,
            name: `Seria ${i + 1} (iter: ${it + 1}, min: ${min})`
        });

        // Aktualizacja wartości globalnej
        if (series_min.v == null || series_min.v > min) {
            series_min.v = min;
            series_min.i = it;
        }

        //console.log('-------------------------------');
        //console.log('Solution:');
        //console.log('  error: ' + result.error);
        //console.log('  position: ' + result.position);
    }
    
    GUI.popup_result.style.display = "block";
    ModalVisible = true;
    Plotly.react(GUI.modal_content , Lines , {
        margin: { t: 40 , b: 40 , l: 40 , r: 40 } ,
        showlegend: true ,
        height: GUI.modal_content.offsetHeight ,
        autosize: true ,
        plot_bgcolor: "rgb(23 , 23 , 23)" ,
        paper_bgcolor: "rgb(23 , 23 , 23)" ,
        xaxis: {
            title: "Numer iteracji [ x ]" ,
            color: "#444" ,
            tickfont: {
                family: 'Arial',
                size: 10,
                color: 'rgb(150, 150, 150)'
            }
        } ,
        yaxis: {
            title: "Wartość funkcji [y]" ,
            color: "#444" ,
            tickfont: {
                family: 'Arial',
                size: 10,
                color: 'rgb(150, 150, 150)'
            } ,
        } ,
        /*
        legend: {
            x: 1 ,
            y: 1 ,
            xanchor: "right"
        } ,
        */
        annotations: [ {
            x: series_min.i ,
            y: series_min.v ,
            text: `${series_min.v}` ,
            showarrow: true ,
            arrowhead: 2 ,
            arrowcolor: "white" ,
            font: { color: "white" } ,
            ay: -70
        } ]
    } , { responsive: true });

});


///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wykonuje czynności z wybieraniem funkcji z listy.
 * @throws {Error} Jeżeli nie odnaleziono funkcji.
*/
function applySelectedFunction() {
    
    if (CurrentFun === null) {
        throw new Error("Nie wybrano funkcji.");
    }

    // Ustawianie zakresów
    GUI.nof_minx.value = CurrentFun.x[0];
    GUI.nof_maxx.value = CurrentFun.x[1];
    GUI.nof_miny.value = CurrentFun.y[0];
    GUI.nof_maxy.value = CurrentFun.y[1];
    GUI.nof_speed.value = CurrentFun.inc;

    generatePlot();
}

async function generatePlot() {

    // Obiekt, który zawiera dane wykresu
    let ret = { x_arr: [] , y_arr: [] , z_mat: [] };

    // Obiekt, który zawiera wartści zasięgów podane w GUI
    let fields = {
        xmin: GUI.nof_minx.valueAsNumber , 
        xmax: GUI.nof_maxx.valueAsNumber , 
        ymin: GUI.nof_miny.valueAsNumber , 
        ymax: GUI.nof_maxy.valueAsNumber , 
    };

    // Walidacja pól
    if (fields.xmin >= fields.xmax || (fields.xmin + CurrentFun.inc * 2) >= fields.xmax ) {
        throw new Error("Różnica między Xmin i Xmax jest nieprawidłowa lub za mała");
    } else if (fields.ymin >= fields.ymax || (fields.ymin + CurrentFun.inc * 2) >= fields.ymax ) {
        throw new Error("Różnica między Ymin i Ymax jest nieprawidłowa lub za mała");
    }

    // Generowanie X-ów
    let curr = fields.xmin;
    while (curr <= fields.xmax) {
        ret.x_arr.push(curr);
        curr += CurrentFun.inc;
    }
    
    // Generowanie Y-ów
    curr = fields.ymin;
    while (curr <= fields.ymax) {
        ret.y_arr.push(curr);
        curr += CurrentFun.inc;
    }

    // Generowanie powierzchni
    for (let i = 0 ; i < ret.x_arr.length ; i++) {
        
        let row = [];

        for (let j = 0 , v = null ; j < ret.y_arr.length ; j++) {
            v = CurrentFun.calculate(ret.x_arr[i] , ret.y_arr[j]);
            row.push(ReverseFunction ? -v : v);
        }

        ret.z_mat.push(row);

    }

    // Ustawienie danych
    PLOT_DAT.x = ret.x_arr;
    PLOT_DAT.y = ret.y_arr;
    PLOT_DAT.z = ret.z_mat;

    // Ustawienie kolorów
    PLOT_DAT.colorscale = GUI.select_theme.value;

    // Generowanie
    Plotly.react(GUI.cont_plot , [ PLOT_DAT ] , PLOT_LAY , PLOT_CFG);
}

function savePlotAsImage(format) {

    let D3 = Plotly.d3;
    let image = null;

    if (format === "png") {
        Plotly.downloadImage(GUI.cont_plot , { format: "png" });
    } else if (format === "jpeg") {
        Plotly.downloadImage(GUI.cont_plot , { format: "jpeg" });
    } else {
        throw new Error(`Nie można zapisać obrazu do formatu "${format}".`);
    }

}