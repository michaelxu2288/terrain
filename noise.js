/**
 * @typedef {{off_x: number?, off_y: number?, sca_x: number?, sca_y: number?}} Dimen
 */
class FractalNoise {

    /**
     * 
     * @param {{seed: [number|string]?, noise_level_count: number?, lacunarity: number?, persistence: number?, amplitude: number?, dimension: Dimen}} settings 
     */
    constructor(settings) {
        settings = defaults(settings, {
            noise_level_count: 1,
            lacunarity: 2,
            persistence: 0.3,
            dimension: {
                off_x: 0,
                off_y: 0,
                sca_x: 1,
                sca_y: 1,
            },
            amplitude: 1,
        });

        if (settings.seed === undefined) {
            settings.seed = [];
            for (var i = 0; i < settings.noise_level_count; i++) {
                settings.seed.push(Math.random());
            }
        }

        this.settings = settings;

        this.noise_fcns = settings.seed.map(seed => new SimplexNoise(seed));
        console.log(this);

    }

    /**
     * 
     * @param {number} x 
     * @param {number} y
     * 
     * @returns {number} 
     */
    noise2D(x, y) {
        var l = 1;
        var p = 1;
        var out = 0;
        this.noise_fcns.forEach(
            (fcn) => {
                out += p * fcn.noise2D((x * l * this.settings.dimension.sca_x) + this.settings.dimension.off_x, (y * l * this.settings.dimension.sca_y) + this.settings.dimension.off_y);
                l *= this.settings.lacunarity;
                p *= this.settings.persistence;
            }
        );
        return this.settings.amplitude * out;
    }
}

class WhirlNoise {
    /**
     * 
     * @param {Noise} noise_base 
     * @param {Noise} noise_sample_x 
     * @param {Noise} noise_sample_y 
     * @param {{amplitude: number?, dimension: Dimen}} settings 
     */
    constructor(noise_base, noise_sample_x, noise_sample_y, settings) {
        if (settings === undefined) {
            settings = {};
        }
        settings = defaults(settings, {
            dimension: {
                off_x: 0,
                off_y: 0,
                sca_x: 1,
                sca_y: 1,
            },
            amplitude: 1,
        });

        this.settings = settings;
        this.noise_base = noise_base;
        this.noise_sample_x = noise_sample_x;
        this.noise_sample_y = noise_sample_y;
    }

    noise2D(x, y) {
        return this.settings.amplitude * this.noise_base.noise2D(this.noise_sample_x.noise2D(x, y) * this.settings.dimension.sca_x + this.settings.dimension.off_x, this.noise_sample_y.noise2D(x, y) * this.settings.dimension.sca_y + this.settings.dimension.off_y);
    }
}