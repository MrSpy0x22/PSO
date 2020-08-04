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
        
        // WPływ lokalny na pozycję
        this.L_INFLUENCE = config.localAcceleration || 1.49445; // 1.49445 from literatire
        this.EPOCHES_LIMIT = config.epochesLimit || 100;
        this.SWARM_SIZE = config.swarmSize || 10;
        
        this.onIterationStarted = config.onIterationStarted;
        this.onParticleComputed = config.onParticleComputed;
        this.onIterationFinished = config.onIterationFinished;

        this.SwarmObject = [];
    }

    createSolution() {
        let buffer = [];

        for (let i = 0; i < this.RANGES.length; ++i) {
            buffer.push(Math.random());
        }

        let result = {
            buffer: buffer,
            position: null,
            error: Number.POSITIVE_INFINITY
        };

        return result;
    }

    correctPosition(position) {
        if (position < 0.0) {
            return 0.0;
        }

        if (position > 1.0) {
            return 1.0;
        }

        return position;
    }

    denormalizePosition(position) {
        let result = [];

        for (let i = 0; i < this.RANGES.length; ++i) {
            let range = this.RANGES[i];
            let scope = range.maximum - range.minimum;

            result.push(position[i] * scope + range.minimum);
        }

        return result;
    }

    createParticle() {
        let actualBuffer = [];
        let actualVelocity = [];

        for (let i = 0; i < this.RANGES.length; ++i) {
            let position = Math.random();
            let velocity = this.PARTICLE_SPEED * Math.random();

            actualVelocity.push(velocity);
            actualBuffer.push(position);
        }

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

    createSwarm() {

        // Na wszelki wypadel obiekt roju zostanie usunięty
        this.SwarmObject = [];

        // Dodawanie cząsteczek do obiektu roju
        for (let i = 0; i < this.SWARM_SIZE; ++i) {
            this.SwarmObject.push(this.createParticle());
        }

    }

    computeParticle(particle, bestGlobalBuffer) {
        let bestSolution = particle.bestSolution;
        let actualSolution = particle.actualSolution;

        let bestLocalBuffer = bestSolution.buffer;

        let actualVelocity = actualSolution.velocity;
        let actualBuffer = actualSolution.buffer;

        for (let i = 0; i < actualBuffer.length; ++i) {
            let globalDifference = bestGlobalBuffer[i] - actualBuffer[i];
            let globalInfluance = this.G_INFLUENCE * globalDifference * Math.random();

            let localDifference = bestLocalBuffer[i] - actualBuffer[i];
            let localInfluance = this.L_INFLUENCE * localDifference * Math.random();

            actualVelocity[i] = this.PARTICLE_INTERIA * actualVelocity[i] + globalInfluance + localInfluance;
            actualBuffer[i] = this.correctPosition(actualBuffer[i] + actualVelocity[i]);
        }

        let computedPosition = this.denormalizePosition(actualBuffer);
        let err = this.CALCULATE_ERROR(computedPosition[0] , computedPosition[1]);
        let computedError = this.NEGATIVES === false ? err : -err;

        actualSolution.error = computedError;
        actualSolution.position = computedPosition;

        if (computedError < bestSolution.error) {
            bestSolution = particle.bestSolution = {
                position: computedPosition,
                buffer: actualBuffer.slice(),
                error: computedError
            };
        }
        
        return bestSolution;
    };

    computeEpoch(particles, bestGlobalBuffer) {
        let bestEpochSolution = {
            error: Number.POSITIVE_INFINITY
        };

        for (let i = 0; i < particles.length; ++i) {
            let particle = particles[i];

            let bestLocalSolution = this.computeParticle(particle, bestGlobalBuffer);

            if (bestLocalSolution.error < bestEpochSolution.error) {
                bestEpochSolution = bestLocalSolution;
            }

            if (this.onParticleComputed) {
                this.onParticleComputed(i, particle.actualSolution, bestLocalSolution);
            }
        }

        return bestEpochSolution;
    };

    start() {

        // Wywołanie funkcji tworzącej obiekt roju cząsteczek
        this.createSwarm();

        if (this.SwarmObject.length == 0) {
            throw new Error("Particles have not been defined.");
        }

        let bestGlobalSolution = this.createSolution();

        for (let i = 0; i < this.EPOCHES_LIMIT; ++i) {
            if (this.onIterationStarted) {
                this.onIterationStarted(i , this.SwarmObject);
            }

            let bestEpochSolution = this.computeEpoch(this.SwarmObject, bestGlobalSolution.buffer);

            if (bestEpochSolution.error < bestGlobalSolution.error) {
                bestGlobalSolution = bestEpochSolution;
            }

            if (this.onIterationFinished) {
                this.onIterationFinished(i, bestGlobalSolution);
            }

        }

        return bestGlobalSolution;
    };
}
