/**
 * @typedef {{vertices: WebGLBuffer, colors: WebGLBuffer, indices: WebGLBuffer, nvert: number, normals: WebGLBuffer}} Mesh
 * @typedef {{program: WebGLProgram, attribute: Object<string, GLint>, uniform: Object<string, GLint>}} ProgramInfo
 * @typedef {{attribute: [string], uniform: [string]}} AttributeUniform
 */


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
        console.log(points);

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
        const mat = mat4.create();
        mat4.translate(mat, mat, pos);

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
}