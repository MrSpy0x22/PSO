'use strict';

/*
 * OBIEKT Z DANYMI WSZYSTKICH FUNKCJI
 *  Aby dopisać nową funkcję należy stworzyć dodatkowy obiekt wewnątrz:
 * 
 *      Nazwa: {
 *          name: "nazwa funkcji",
 *          x: [od , do] ,
 *          y: [od , do] ,
 *          inc: 0.2,
 *          calculate: (x,y) =? { ... tutaj wzór w wersji JS ... }
 *      }
 * 
 *  Program przy otwieraniu automatycznie odczyta nową funkcję i będzie
 *  zdolny do optymalizacji i rysowania wykresu.
*/

const FUNCTIONS = {

    Ackley: {
        name: "Ackley" ,
        x: [ -5 , 5 ] ,
        y: [ -5 , 5] ,
        inc: 0.2 ,
        calculate: (x , y) => -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + y * y))) - Math.exp(0.5 * (Math.cos(3.1415 * 2 * x) + Math.cos(3.1415 * 2 * y))) + Math.E + 20
    } ,
    Booth: {
        name: "Booth" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.2 ,
        calculate: (x , y) => Math.pow(x + 2 * y - 7 , 2) + Math.pow(2 * x + y - 5 , 2)
    } ,
    CrossInTray: {
        name: "Cross-in-tray" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.2 ,
        calculate: (x , y) => -0.0001 * Math.pow(Math.abs(Math.sin(x) * Math.sin(y) * Math.exp(Math.abs(100 - ((Math.sqrt(x * x + y * y)) / Math.PI)))) + 1 , 0.1)
    } ,
    Himmelblau: {
        name: "Himmelblau" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.5 ,
        calculate: (x , y) => Math.pow(x * x + y - 11 , 2) + Math.pow(x + y * y - 7 , 2)
    } ,
    Matyas: {
        name: "Matyas" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.50 ,
        calculate: (x , y) => 0.26 * (Math.pow(x , 2) + Math.pow(y , 2)) - 0.48 * x * y
    } ,
    Schaffer2: {
        name: "Schaffer N. 2" ,
        x: [ -100 , 100 ] ,
        y: [ -100 , 100 ] ,
        inc: 2.5 ,
        calculate: (x , y) => 0.5 + ((Math.pow(Math.sin(x * x - y * y)  , 2) - 0.5) / Math.pow(1 + 0.001 * (x * x + y * y) , 2))
    } ,
    Schaffer4: {
        name: "Schaffer N. 4" ,
        x: [ -100 , 100 ] ,
        y: [ -100 , 100 ] ,
        inc: 2.5 ,
        calculate: (x , y) => 0.5 + ((Math.pow(Math.cos(Math.sin(Math.abs(x * x - y * y)))  , 2) - 0.5) / Math.pow(1 + 0.001 * (x * x + y * y) , 2))
    } ,
    HolderTable: {
        name: "Hölder Table" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.5 ,
        calculate: (x , y) => -Math.abs(Math.sin(x) * Math.cos(y) * Math.exp(Math.abs(1 - (Math.sqrt(x * x + y * y) / Math.PI))))
    } ,

    // Inne
    Paraboloid: {
        name: "Paraboloida" ,
        x: [ -10 , 10 ] ,
        y: [ -10 , 10 ] ,
        inc: 0.5 ,
        calculate: (x , y) => 1 - Math.pow(x , 2) - Math.pow(y , 2)
    } ,
    Test1: {
        name: "Test 1" ,
        x: [ -2 , 2 ] ,
        y: [ -2 , 2 ] ,
        inc: 0.1 ,
        calculate: (x , y) => Math.cos(x * x + y * y)
    } ,
    Test2: {
        name: "Test 2" ,
        x: [ -2 , 2 ] ,
        y: [ -2 , 2 ] ,
        inc: 0.1 ,
        calculate: (x , y) => Math.sin(x * x + y * y)
    }
};

/**
 * Szuka funkcji po podanej nazwie.
 * @param {string} name Nazwa szukanej funkcji (case insensitive).
 * @returns {object} Referencja do elementu funkcji z obiektu FUNCTIONS lub NULL w przypadku błędu.
*/
function getFunctionFromName(name) {

    for (let f in FUNCTIONS) {
        if (FUNCTIONS[f].name.toLowerCase() === name.toLowerCase()) {
            return FUNCTIONS[f];
        }
    }

    return null;
}