'use strict';

/**
 * @class
 * @classdesc Wykonuje cały proces algorytmu PSO
*/
class PSO {
    /**
     * @constructor
     * @param {object} config Obiekt zawierający konfigurację algorytmu.
    */
    constructor(config) {

        // Zmiana znaku przy obliczaniu
        this.NEGATIVES = config.negatives;
        
        // Min i Max na osiach X, Y {object}
        this.RANGES = config.ranges;

        if (this.RANGES == null) {
            throw new Error('Nie otrzymano obiektu zasięgów na osiach.');
        }
        
        // Funkcja obliczająca Z {function}
        this.CALCULATE_ERROR = config.calculateError;

        if (this.CALCULATE_ERROR == null) {
            throw new Error('Funkcja do optymalizacji nie została podana.');
        }

        // Prędkość cząśteczki
        this.PARTICLE_SPEED = config.particleSpeed || 0.1;
        
        // Bezwładność cząsteczki
        this.PARTICLE_INTERIA = config.particleInteria || 0.729;
        
        // Wpływ globalny na pozycję
        this.G_INFLUENCE = config.lglobalcceleration || 1.49445;
        
        // Wpływ lokalny na pozycję
        this.L_INFLUENCE = config.localAcceleration || 1.49445; // 1.49445 from literatire
        this.EPOCHES_LIMIT = config.epochesLimit || 100;
        this.SWARM_SIZE = config.swarmSize || 10;
        
        // Callback-i
        this.onIterationStarted = config.onIterationStarted;
        this.onParticleComputed = config.onParticleComputed;
        this.onIterationFinished = config.onIterationFinished;

        // Obiekt roju
        this.SwarmObject = [];
    }

    /**
     * Tworzy obiekt rozwiązania.
     * @returns {object} Obiekt rozwiązania.
    */
    createSolution() {

        let buffer = [];

        // Uzupełianie wartości bufora
        for (let i = 0; i < this.RANGES.length; ++i) {
            buffer.push(Math.random());
        }

        // Tworzenie obiektu rozwiązania
        let result = {
            buffer: buffer,
            position: null,
            error: Number.POSITIVE_INFINITY
        };

        return result;
    }

    /**
     * Korekta prędkości.
     * @returns {number} Poprawiona pozycja.
    */
    correctPosition(position) {
        if (position < 0.0) {
            return 0.0;
        }

        if (position > 1.0) {
            return 1.0;
        }

        return position;
    }

    /**
     * Korekcja pozycji do dopuszczalnego obszaru na osiach.
     * @returns {object} Tablica z poprawioną pozycją.
    */
    denormalizePosition(position) {
        let result = [];

        for (let i = 0; i < this.RANGES.length; ++i) {
            let range = this.RANGES[i];
            let scope = range.maximum - range.minimum;

            result.push(position[i] * scope + range.minimum);
        }

        return result;
    }

    /**
     * Tworzy nową cząsteczkę.
     * @returns {object} Obiekt roju.
    */
    createParticle() {

        // Zmienne pomocnicze
        let actualBuffer = [];
        let actualVelocity = [];

        // Przetwarzanie danych
        for (let i = 0; i < this.RANGES.length; ++i) {
            let position = Math.random();
            let velocity = this.PARTICLE_SPEED * Math.random();

            actualVelocity.push(velocity);
            actualBuffer.push(position);
        }

        // Tworzenie obiektucząsteczki
        let particle = {
            bestSolution: this.createSolution(),
            actualSolution: {
                velocity: actualVelocity,
                buffer: actualBuffer,
                position: null,
                error: Number.POSITIVE_INFINITY
            }
        };

        return particle;
    }

    /**
     * Tworzenie obiektu roju.
     * @see createParticle() Tworzenie cząsteczki.
    */
    createSwarm() {

        // Na wszelki wypadel obiekt roju zostanie usunięty
        this.SwarmObject = [];

        // Dodawanie cząsteczek do obiektu roju
        for (let i = 0; i < this.SWARM_SIZE; ++i) {
            this.SwarmObject.push(this.createParticle());
        }

    }

    /**
     * Przeprowadzanie obliczeń dla algorytmu jednej cząsteczki.
     * @param {object} particle Obiekt cząsteczki.
     * @param {object} bestGlobalBuffer Obiekt z globalną wartością.
     * @returns {object} Obiekt rozwiązania.
    */
    computeParticle(particle, bestGlobalBuffer) {

        // Zmienne pomocnicze
        let bestSolution = particle.bestSolution;
        let actualSolution = particle.actualSolution;
        let bestLocalBuffer = bestSolution.buffer;
        let actualVelocity = actualSolution.velocity;
        let actualBuffer = actualSolution.buffer;

        // Obliczanie prędkości i pozycji
        for (let i = 0; i < actualBuffer.length; ++i) {
            let globalDifference = bestGlobalBuffer[i] - actualBuffer[i];
            let globalInfluance = this.G_INFLUENCE * globalDifference * Math.random();

            let localDifference = bestLocalBuffer[i] - actualBuffer[i];
            let localInfluance = this.L_INFLUENCE * localDifference * Math.random();

            actualVelocity[i] = this.PARTICLE_INTERIA * actualVelocity[i] + globalInfluance + localInfluance;
            actualBuffer[i] = this.correctPosition(actualBuffer[i] + actualVelocity[i]);
        }

        // Dodatkowe obliczenia
        let computedPosition = this.denormalizePosition(actualBuffer);
        let err = this.CALCULATE_ERROR(computedPosition[0] , computedPosition[1]);
        let computedError = this.NEGATIVES === false ? err : -err;

        actualSolution.error = computedError;
        actualSolution.position = computedPosition;

        // Zapisywanie lepszego rozwiązania
        if (computedError < bestSolution.error) {
            bestSolution = particle.bestSolution = {
                position: computedPosition,
                buffer: actualBuffer.slice(),
                error: computedError
            };
        }
        
        return bestSolution;
    };

    /**
     * Uruchamia cały proces algorytmu
     * @returns {object} Obiekt rozwiązania.
     * @throws {Error} Jeżęli nie utworzono wcześniej obiektu roju.
     * @see createSolution() Tworzenie obiektu rozwiązania.
    */
    computeEpoch(bestGlobalBuffer) {

        if (this.SwarmObject === null) {
            throw new Error("Nie utworzono obiektu roju.");
        }

        // Obiektu rozwiązania
        let bestEpochSolution = { error: Number.POSITIVE_INFINITY };

        for (let i = 0; i < this.SwarmObject.length; ++i) {

            // Pobieranie obiektu cząsteczki
            let particle = this.SwarmObject[i];

            // Obliczanie epoki
            let bestLocalSolution = this.computeParticle(particle, bestGlobalBuffer);

            // Zapis lepszego wyniku
            if (bestLocalSolution.error < bestEpochSolution.error) {
                bestEpochSolution = bestLocalSolution;
            }

            // Callback
            if (this.onParticleComputed) {
                this.onParticleComputed(i, particle.actualSolution, bestLocalSolution);
            }
        }

        return bestEpochSolution;
    };

    /**
     * Uruchamia cały proces algorytmu
     * @returns {object} Obiekt rozwiązania.
     * @see createSolution() Tworzenie obiektu rozwiązania
     * @see createSwarm() Tworzenie obiektu roju.
     * @see computeEpoch() Przeliczanie jednej epoki.
    */
    start() {

        // Wywołanie funkcji tworzącej obiekt roju cząsteczek
        this.createSwarm();

        if (this.SwarmObject.length == 0) {
            throw new Error("Particles have not been defined.");
        }

        // Tworzenie obiektu rezultatu
        let bestGlobalSolution = this.createSolution();

        // Pętla przetwarzajaca epoki
        for (let i = 0; i < this.EPOCHES_LIMIT; ++i) {
            
            // Callback
            if (this.onIterationStarted) { this.onIterationStarted(i , this.SwarmObject); }
            
            // Przeliczanie epoki
            let bestEpochSolution = this.computeEpoch( bestGlobalSolution.buffer);
            
            // Zapisywanie lepszego wyniku
            if (bestEpochSolution.error < bestGlobalSolution.error) {
                bestGlobalSolution = bestEpochSolution;
            }
            
            // Callback
            if (this.onIterationFinished) { this.onIterationFinished(i, bestGlobalSolution); }

        }

        return bestGlobalSolution;
    };
}
