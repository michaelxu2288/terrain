/**
 * @typedef {{vertices: WebGLBuffer, colors: WebGLBuffer, indices: WebGLBuffer, nvert: number, normals: WebGLBuffer}} Mesh
 * @typedef {{program: WebGLProgram, attribute: Object<string, GLint>, uniform: Object<string, GLint>}} ProgramInfo
 * @typedef {{attribute: [string], uniform: [string]}} AttributeUniform
 */

console.log("gl util loaded");
const glUtil = {
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vsource 
     * @param {string} fsource 
     * 
     * @returns {WebGlProgram}
     */
    createProgram(gl, vsource, fsource) {

        const vShader = this.createShader(gl, vsource, gl.VERTEX_SHADER);
        const fShader = this.createShader(gl, fsource, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Could not link shaders.", gl.getProgramInfoLog(program), vsource, fsource);
            gl.deleteProgram(program);
            return null;
        }

        return program;
    },

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} source 
     * @param {*} type
     * 
     * @returns {WebGLShader|null}
     */
    createShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Could not compile the shader.\n", gl.getShaderInfoLog(shader), source);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    },
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vsource 
     * @param {string} fsource 
     * @param {AttributeUniform} attUni 
     * 
     * @returns {ProgramInfo}
     */
    createProgramInfo(gl, vsource, fsource, attUni) {
        const program = this.createProgram(gl, vsource, fsource);
        const att = {};
        attUni.attribute.forEach(
            (attribute) => {
                att[attribute] = gl.getAttribLocation(program, attribute);
            });
        const uni = {};
        attUni.uniform.map(
            (uniform) => {
                uni[uniform] = gl.getUniformLocation(program, uniform);
            });
        return {
            program: program,
            attribute: att,
            uniform: uni,
        };
    },

    axisPos: null,
    axisInd: null,

    init(gl) {
        const pos = [
            0, 0, 0,
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
        const ind = [0, 1, 0, 2, 0, 3];

        this.axisPos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.axisPos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

        this.axisInd = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.axisInd);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Float32Array(ind), gl.STATIC_DRAW);
    },

    drawAxis(gl, program) {
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.axisPos);
            gl.vertexAttribPointer(program.attribute.vPos, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(program.attribute.vPos);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.axisInd);
        } {
            gl.drawElements(gl.LINES, 3, gl.UNSIGNED_SHORT, 0);
        }
    }

}


const Mesh = {
    /**
     * 
     * @param {WebGL2RenderingContext} gl
     * @param {number} width 
     * @param {number} height 
     * @param {number} nwidth 
     * @param {number} nheight 
     * @returns {Mesh}
     */
    plane(gl, width, height, nwidth, nheight) {

        var points = [];

        for (var j = 0; j < nheight; j++) {
            for (var i = 0; i < nwidth; i++) {
                points.push(width * j / nheight, height * i / nwidth, 0.0);
            }
        }

        var indices = [];

        for (var j = 0; j < nheight - 1; j++) {
            for (var i = 0; i < nwidth - 1; i++) {
                indices.push(i + j * nwidth, i + 1 + j * nwidth, i + 1 + (j + 1) * nwidth);
                indices.push(i + j * nwidth, i + (j + 1) * nwidth, i + 1 + (j + 1) * nwidth);
            }
        }

        const posbuf = gl.createBuffer();
        const indbuf = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            vertices: posbuf,
            indices: indbuf,
            nvert: indices.length,
        };

    },

    isoplane(gl, side, nwidth, nheight, xi, yi, height = () => { return 0; }) {
        var points = [];
        var width = nwidth * side;
        //var height = nheight * (Math.sqrt(3) / 2) * side;
        var half_sqr3 = Math.sqrt(3) / 2;

        for (var row = 0; row <= nheight; row++) {
            if (row % 2 == 0) {
                for (var i = 0; i <= nwidth; i++) {
                    points.push(i * side, row * half_sqr3 * side, height(i * side + xi, row * half_sqr3 * side + yi));
                }
            } else {
                points.push(0, row * half_sqr3 * side, height(0 + xi, row * half_sqr3 * side + yi));
                for (var i = 0; i < nwidth; i++) {
                    points.push(i * side + side / 2, row * half_sqr3 * side, height(i * side + side / 2 + xi, row * half_sqr3 * side + yi));
                }
                points.push(width, row * half_sqr3 * side, height(width + xi, row * half_sqr3 * side + yi));
            }
        }

        // Even row: nwidth + 1 points
        // Odd row: nwidth + 2 points

        var indices = [];
        for (var row = 0; row < nheight; row += 2) {
            var first_ind_even = (row / 2) * (2 * nwidth + 3);
            var first_ind_odd = first_ind_even + nwidth + 1;
            var second_ind_even = (row / 2 + 1) * (2 * nwidth + 3);

            var j = 0;
            for (var i = 0; i < nwidth * 2 + 1; i++) {
                if (i % 2 == 0) {
                    indices.push(first_ind_even + j, first_ind_odd + j + 1, first_ind_odd + j);
                } else {
                    indices.push(first_ind_even + j, first_ind_even + j + 1, first_ind_odd + j + 1);
                    j++;
                }
            }

            j = 0;
            for (var i = 0; i < nwidth * 2 + 1; i++) {
                if (i % 2 == 0) {
                    indices.push(first_ind_odd + j, first_ind_odd + j + 1, second_ind_even + j);
                } else {
                    indices.push(first_ind_odd + j + 1, second_ind_even + j + 1, second_ind_even + j);
                    j++;
                }
            }
        }

        var normals = new Array(points.length);
        for (var i = 0; i < normals.length; i++) { normals[i] = 0; }
        var ntris = new Array(points.length / 3);
        for (var i = 0; i < indices.length; i += 3) {
            const norm = [0, 0, 0];
            const a = indices[i] * 3;
            const b = indices[i + 1] * 3;
            const c = indices[i + 2] * 3;
            glMatrix.vec3.cross(norm, [points[b] - points[a], points[b + 1] - points[a + 1], points[b + 2] - points[a + 2]], [points[c] - points[a], points[c + 1] - points[a + 1], points[c + 2] - points[a + 2]]);

            normals[a] += norm[0];
            normals[a + 1] += norm[1];
            normals[a + 2] += norm[2];
            normals[b] += norm[0];
            normals[b + 1] += norm[1];
            normals[b + 2] += norm[2];
            normals[c] += norm[0];
            normals[c + 1] += norm[1];
            normals[c + 2] += norm[2];
            ntris[indices[i]]++;
            ntris[indices[i + 1]]++;
            ntris[indices[i + 2]]++;
        }

        for (var i = 0; i < normals.length; i += 3) {
            const a = [0, 0, 0];
            glMatrix.vec3.normalize(a, [normals[i], normals[i + 1], normals[i + 2]]);
            normals[i] = a[0];
            normals[i + 1] = a[1];
            normals[i + 2] = a[2];
        }


        const posbuf = gl.createBuffer();
        const indbuf = gl.createBuffer();
        const norbuf = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const pos = [xi, yi, 0];
        const mat = glMatrix.mat4.create();
        glMatrix.mat4.translate(mat, mat, pos);

        return {
            vertices: posbuf,
            indices: indbuf,
            normals: norbuf,
            nvert: indices.length,
            model_mat: mat,
        };

    },
    cube(gl, size) {

    },
    recalculateNormals(points, indices) {
        var normals = new Array(points.length);
        for (var i = 0; i < normals.length; i++) { normals[i] = 0; }
        for (var i = 0; i < indices.length; i += 3) {
            const norm = [0, 0, 0];
            const a = indices[i] * 3;
            const b = indices[i + 1] * 3;
            const c = indices[i + 2] * 3;
            glMatrix.vec3.cross(norm, [points[b] - points[a], points[b + 1] - points[a + 1], points[b + 2] - points[a + 2]], [points[c] - points[a], points[c + 1] - points[a + 1], points[c + 2] - points[a + 2]]);

            normals[a] += norm[0];
            normals[a + 1] += norm[1];
            normals[a + 2] += norm[2];
            normals[b] += norm[0];
            normals[b + 1] += norm[1];
            normals[b + 2] += norm[2];
            normals[c] += norm[0];
            normals[c + 1] += norm[1];
            normals[c + 2] += norm[2];
        }

        for (var i = 0; i < normals.length; i += 3) {
            const a = [0, 0, 0];
            glMatrix.vec3.normalize(a, [normals[i], normals[i + 1], normals[i + 2]]);
            normals[i] = a[0];
            normals[i + 1] = a[1];
            normals[i + 2] = a[2];
        }

        return normals
    },

    diamondSquare(gl, n, x = 0, y = 0, width = 10, height = 10) {
        var points = [];

        var heights = [];
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                heights.push(0);
            }
        }
        const random = () => {
            return Math.random() * 2 - 1;
        }

        const index = (x, y) => {
            return (n * y + x);
        }
        heights[index(0, 0)] = random() * 100;
        heights[index(n - 1, 0)] = random() * 100;
        heights[index(0, n - 1)] = random() * 100;
        heights[index(n - 1, n - 1)] = random() * 100;


        var radius = Math.floor(n / 2);
        const initial = radius;
        const diamond = (x, y, radius) => {
            heights[index(x, y)] = random() * radius / initial + (heights[index(x + radius, y + radius)] + heights[index(x + radius, y - radius)] + heights[index(x - radius, y + radius)] + heights[index(x - radius, y - radius)]) / 4;
        }

        const square = (x, y, radius) => {
            var sum = 0,
                a = 0;
            if (x - radius >= 0) {
                a++;
                sum += heights[index(x - radius, y)];
            }
            if (x + radius < n) {
                a++;
                sum += heights[index(x + radius, y)];
            }
            if (y - radius >= 0) {
                a++;
                sum += heights[index(x, y - radius)];
            }
            if (y + radius < n) {
                a++;
                sum += heights[index(x, y + radius)];
            }

            heights[index(x, y)] = sum / a + random() * radius / initial;

            //heights[index(x,y)] = (heights[index(x+radius,y+radius)] + heights[index(x+radius,y-radius)] + heights[index(x-radius,y+radius)] + heights[index(x-radius,y-radius)]) / 4;
        }

        while (radius >= 1) {
            for (var x = radius; x < n; x += 2 * radius) {
                for (var y = radius; y < n; y += 2 * radius) {
                    diamond(x, y, radius);
                }
            }

            var i = 0;

            while (i * radius < n) {
                var y = i * radius;
                var x = radius * ((i + 1) % 2);
                while (x < n) {
                    square(x, y, radius);
                    x += 2 * radius;
                }

                i++;
            }

            radius /= 2;
        }


        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                points.push(width * j / n, height * i / n, heights[index(j, i)]);
            }
        }



        var indices = [];

        for (var j = 0; j < n - 1; j++) {
            for (var i = 0; i < n - 1; i++) {
                indices.push(i + 1 + j * n, i + j * n, i + 1 + (j + 1) * n);
                indices.push(i + j * n, i + (j + 1) * n, i + 1 + (j + 1) * n);
            }
        }

        const posbuf = gl.createBuffer();
        const indbuf = gl.createBuffer();
        const norbuf = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Mesh.recalculateNormals(points, indices)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


        const pos = [x, y, 0];
        const mat = glMatrix.mat4.create();
        glMatrix.mat4.translate(mat, mat, pos);

        return {
            vertices: posbuf,
            indices: indbuf,
            normals: norbuf,
            nvert: indices.length,
            model_mat: mat,
        };
    },

    diamondSquareTilable(gl, n, noise, xi = 0, yi = 0, width = 10, height = 10) {
        var points = [];

        var heights = [];
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                heights.push(0);
            }
        }
        const random = () => {
            return Math.random() * 2 - 1;
        }

        const index = (x, y) => {
            return (n * y + x);
        }
        console.log(xi, yi);
        for (var i = 0; i < n; i++) {
            heights[index(i, 0)] = noise(i * width / (n - 1) + xi, yi);
            heights[index(0, i)] = noise(xi, i * height / (n - 1) + yi);
            heights[index(i, n - 1)] = noise(i * width / (n - 1) + xi, height + yi);
            heights[index(n - 1, i)] = noise(width + xi, i * height / (n - 1) + yi);
        }


        var radius = Math.floor(n / 2);
        const initial = radius;
        const diamond = (x, y, radius) => {
            heights[index(x, y)] = random() * radius / initial + (heights[index(x + radius, y + radius)] + heights[index(x + radius, y - radius)] + heights[index(x - radius, y + radius)] + heights[index(x - radius, y - radius)]) / 4;
        }

        const square = (x, y, radius) => {
            var sum = 0,
                a = 0;
            if (x - radius >= 0) {
                a++;
                sum += heights[index(x - radius, y)];
            }
            if (x + radius < n) {
                a++;
                sum += heights[index(x + radius, y)];
            }
            if (y - radius >= 0) {
                a++;
                sum += heights[index(x, y - radius)];
            }
            if (y + radius < n) {
                a++;
                sum += heights[index(x, y + radius)];
            }

            heights[index(x, y)] = sum / a + random() * radius / initial;

            //heights[index(x,y)] = (heights[index(x+radius,y+radius)] + heights[index(x+radius,y-radius)] + heights[index(x-radius,y+radius)] + heights[index(x-radius,y-radius)]) / 4;
        }

        while (radius >= 1) {
            for (var x = radius; x < n; x += 2 * radius) {
                for (var y = radius; y < n; y += 2 * radius) {
                    diamond(x, y, radius);
                    console.log(x, y);
                }
            }

            var i = 0;

            while (i * radius < n) {
                var y = i * radius;
                var x = radius * ((i + 1) % 2);
                if (y != 0 && y != n - 1) {
                    while (x < n) {
                        if (x != 0 && x != n - 1) {
                            square(x, y, radius);
                        }
                        x += 2 * radius;
                    }
                }

                i++;
            }

            radius /= 2;
        }


        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                points.push(width * j / (n - 1), height * i / (n - 1), heights[index(j, i)]);
            }
        }



        var indices = [];

        for (var j = 0; j < n - 1; j++) {
            for (var i = 0; i < n - 1; i++) {
                indices.push(i + 1 + j * n, i + j * n, i + 1 + (j + 1) * n);
                indices.push(i + j * n, i + (j + 1) * n, i + 1 + (j + 1) * n);
            }
        }

        const posbuf = gl.createBuffer();
        const indbuf = gl.createBuffer();
        const norbuf = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Mesh.recalculateNormals(points, indices)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


        const pos = [xi, yi, 0];
        const mat = glMatrix.mat4.create();
        glMatrix.mat4.translate(mat, mat, pos);

        return {
            vertices: posbuf,
            indices: indbuf,
            normals: norbuf,
            nvert: indices.length,
            model_mat: mat,
        };
    }
}

const DiamondSquare = {
    map(n, noise_scale = 0.9) {
        var heights = [];
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                heights.push(0);
            }
        }
        const random = () => {
            return Math.random() * 2 - 1;
        }

        const index = (x, y) => {
            return (n * y + x);
        }
        heights[index(0, 0)] = random() * 10;
        heights[index(n - 1, 0)] = random() * 10;
        heights[index(0, n - 1)] = random() * 10;
        heights[index(n - 1, n - 1)] = random() * 10;


        var radius = Math.floor(n / 2);
        var initial = radius;
        const diamond = (x, y, radius) => {
            const avg = (heights[index(x + radius, y + radius)] + heights[index(x + radius, y - radius)] + heights[index(x - radius, y + radius)] + heights[index(x - radius, y - radius)]) / 4;
            const a = logistic(avg);
            heights[index(x, y)] = a * random() * noise_scale * radius / initial + avg;
        }

        const square = (x, y, radius) => {
            var sum = 0,
                a = 0;
            if (x - radius >= 0) {
                a++;
                sum += heights[index(x - radius, y)];
            }
            if (x + radius < n) {
                a++;
                sum += heights[index(x + radius, y)];
            }
            if (y - radius >= 0) {
                a++;
                sum += heights[index(x, y - radius)];
            }
            if (y + radius < n) {
                a++;
                sum += heights[index(x, y + radius)];
            }

            const avg = sum / a;
            const b = logistic(avg);

            heights[index(x, y)] = avg + b * random() * noise_scale * radius / initial;

            //heights[index(x,y)] = (heights[index(x+radius,y+radius)] + heights[index(x+radius,y-radius)] + heights[index(x-radius,y+radius)] + heights[index(x-radius,y-radius)]) / 4;
        }

        while (radius >= 1) {
            for (var x = radius; x < n; x += 2 * radius) {
                for (var y = radius; y < n; y += 2 * radius) {
                    diamond(x, y, radius);
                }
            }

            var i = 0;

            while (i * radius < n) {
                var y = i * radius;
                var x = radius * ((i + 1) % 2);
                while (x < n) {
                    square(x, y, radius);
                    x += 2 * radius;
                }

                i++;
            }

            radius /= 2;
        }

        return heights;
    },
    getTile(gl, map, n, x, y, tx, ty, nx, ny, width = 10, height = 10, skip = 1, height_scale = 1) {

        const random = () => {
            return Math.random() * 2 - 1;
        }

        const index = (x, y) => {
            return (n * y + x);
        }
        var points = [];
        nx++;
        ny++;
        const x_sca = width / (nx - 1);
        const y_sca = height / (ny - 1);

        for (var j = 0; j < nx; j++) {
            for (var i = 0; i < ny; i++) {
                var noise_x = random() * 0.5;
                var noise_y = random() * 0.5;

                if (j == 0 || j == nx - 1 || i == 0 || i == ny - 1) {
                    noise_x = noise_y = 0;
                }

                points.push(x_sca * (j + noise_x), y_sca * (i + noise_y), height_scale * map[index(j * skip + tx, i * skip + ty)]);
            }
        }



        var indices = [];
        var wireframe = [];

        for (var j = 0; j < nx - 1; j++) {
            for (var i = 0; i < ny - 1; i++) {
                indices.push(i + 1 + j * nx, i + j * nx, i + 1 + (j + 1) * nx);
                indices.push(i + j * nx, i + (j + 1) * nx, i + 1 + (j + 1) * nx);
                wireframe.push(i + 1 + j * nx, i + j * nx, i + j * nx, i + 1 + (j + 1) * nx, i + 1 + (j + 1) * nx, i + 1 + j * nx, );
                wireframe.push(i + j * nx, i + (j + 1) * nx, i + (j + 1) * nx, i + 1 + (j + 1) * nx, i + 1 + (j + 1) * nx, i + j * nx);
            }
        }

        const posbuf = gl.createBuffer();
        const indbuf = gl.createBuffer();
        const norbuf = gl.createBuffer();
        const wirbuf = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Mesh.recalculateNormals(points, indices)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wirbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireframe), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


        const pos = [x, y, 0];
        const mat = glMatrix.mat4.create();
        glMatrix.mat4.translate(mat, mat, pos);

        return {
            vertices: posbuf,
            indices: indbuf,
            normals: norbuf,
            nvert: indices.length,
            model_mat: mat,
            wireframe: wirbuf
        };
    }
}


const HeightMap = {
    computeNormal(map, n) {
        const index = (x, y) => {
            return (n * y + x);
        }

        var normals = [];

        for (var x = 0; x < n; x++) {
            for (var y = 0; y < n; y++) {
                var normal = [0, 0, 0];
                const points = [
                    [-1, -1],
                    [0, -1],
                    [1, -1],
                    [-1, 0],
                    [1, 0],
                    [-1, 1],
                    [0, 1],
                    [1, 1]
                ];
                const val = map[index(x, y)];
                for (var i = 1; i < 9; i++) {
                    const left = [x + points[i - 1][0], y + points[i - 1][1]];
                    const right = [x + points[i % 8][0], y + points[i % 8][1]];

                    if (left[0] >= 0 && right[0] >= 0 && left[0] < n && right[0] < n && left[1] >= 0 && right[1] >= 0 && left[1] < n && right[1] < n) {
                        var out = [0, 0, 0];
                        glMatrix.vec3.cross(out, [left[0] - x, left[1] - y, map[index(left[0], left[1])] - val], [right[0] - x, right[1] - y, map[index(right[0], right[1])] - val]);
                        normal[0] += out[0];
                        normal[1] += out[1];
                        normal[2] += out[2];
                        //console.log("Crossed: ", out, "Left: ", [left[0], left[1], map[index(left[0], left[1])]], "Right: ", [right[0], right[1], map[index(right[0], right[1])]], "Center", [x, y]);
                    }

                }

                var obama = [0, 0, 0];
                glMatrix.vec3.normalize(obama, normal);
                //console.log(obama, normal);
                normals.push(obama);
            }
        }

        return normals;
    },

    hydraulicErosion(map, n, normal) {
        console.log("I think its erosion time");
        const index = (x, y) => {
            return (n * y + x);
        }

        const lerp = (t, newStart, newEnd) => {
            return [
                newEnd[0] * t + (1 - t) * newStart[0],
                newEnd[1] * t + (1 - t) * newStart[1],
                newEnd[2] * t + (1 - t) * newStart[2]
            ];

        }

        const getNormal = (x, y) => {
            const lowerX = Math.floor(x) % n;
            const lowerY = Math.floor(y) % n;
            const upperX = Math.ceil(x) % n;
            const upperY = Math.ceil(y) % n;

            const normLL = normal[index(lowerX, lowerY)];
            const normUL = normal[index(upperX, lowerY)];
            const normLU = normal[index(lowerX, upperY)];
            const normUU = normal[index(upperX, upperY)];

            const coeffLL = (x - lowerX) * (y - lowerY);
            const coeffUL = (x - upperX) * (y - lowerY);
            const coeffLU = (x - lowerX) * (y - upperY);
            const coeffUU = (x - upperX) * (y - upperY);

            return [
                normLL[0] * coeffLL + normUL[0] * coeffUL + normLU[0] * coeffLU + normUU[0] * coeffUU,
                normLL[1] * coeffLL + normUL[1] * coeffUL + normLU[1] * coeffLU + normUU[1] * coeffUU,
                normLL[2] * coeffLL + normUL[2] * coeffUL + normLU[2] * coeffLU + normUU[2] * coeffUU,
            ];
        }

        const changeHeight = (x, y, amt) => {
            const lowerX = Math.floor(x) % n;
            const lowerY = Math.floor(y) % n;
            const upperX = Math.ceil(x) % n;
            const upperY = Math.ceil(y) % n;

            const coeffLL = (x - lowerX) * (y - lowerY);
            const coeffUL = (x - upperX) * (y - lowerY);
            const coeffLU = (x - lowerX) * (y - upperY);
            const coeffUU = (x - upperX) * (y - upperY);

            map[index(lowerX, lowerY)] += amt * coeffLL;
            map[index(upperX, lowerY)] += amt * coeffUL;
            map[index(lowerX, upperY)] += amt * coeffLU;
            map[index(upperX, upperY)] += amt * coeffUU;
        }

        const iterations = 10000;
        const dt = 1;
        const speed = 5;
        const depositionRate = 0.01;
        const erosionRate = 0.02;
        const friction = 0.01;

        const snowball = (x, y) => {

            var sediment = 0;

            var vx = 0,
                vy = 0;
            //const tracer = [];
            for (var i = 0; i < iterations; i++) {
                if (x < 0 || y < 0 || x >= n || y >= n) break;
                const surface = getNormal(x, y);

                if (surface[2] == 1) {
                    break;
                }

                const deposit = sediment * depositionRate * surface[2];
                const erosion = erosionRate * (1 - surface[2]);

                changeHeight(x, y, deposit - erosion);
                sediment -= deposit - erosion;
                //console.log(deposit, erosion, surface[2]);
                //tracer.push(x, y, height[index(x, y)]);
                vx = friction * vx + surface[0] * speed;
                vy = friction * vy + surface[1] * speed;
                x += vx * dt;
                y += vy * dt;
            }

            //console.log(tracer);
        }

        var next_callout = 1;

        for (var i = 0; i < 1; i++) {
            if (next_callout == i - 1) {
                console.log(i + "th particle simulated");
                next_callout *= 10;
            }
            snowball(Math.random() * n, Math.random() * n);
        }
    },
    averageBlur(map, n, radius) {
        const index = (x, y) => {
            return (n * y + x);
        }


        for (var x = 0; x < n; x++) {
            for (var y = 0; y < n; y++) {
                var a = 0;
                var sum = 0;
                for (var i = -radius; i <= radius; i++) {
                    for (var j = -radius; j <= radius; j++) {
                        if (x + i >= 0 && x + i < n & y + j >= 0 && y + j < n) {
                            a++;
                            sum += map[index(x + i, y + j)];
                        }
                    }
                }
                map[index(x, y)] = sum / a;
            }
        }
    }
}


const Cubemap = {
    //create
}