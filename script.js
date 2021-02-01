var cubeRotation = 0.0;
const mat4 = glMatrix.mat4
main();

//
// Start here
//
function main() {
    const canvas = document.querySelector('#gl-terrain');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Vertex shader program

    const vsSource = `
    attribute vec4 vPos;
    attribute vec3 norm;
    uniform mat4 MVMat;
    uniform mat4 PMat;
    uniform mat4 NMat;

    varying highp vec3 normal;
    
    void main(void) {
        gl_Position = PMat * MVMat * vPos;
        gl_PointSize = 10.0;
        normal = (NMat * vec4(norm, 1.0)).xyz;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying highp vec3 normal;
    void main(void) {
        gl_FragColor = vec4(vec3(1.0,1.0,1.0)*(dot(normalize(vec3(1.0,1.0,1.0)), normal)) + vec3(1.0,1.0,1.0) * 0.3, 1.0);
        //gl_FragColor = normal;
        //gl_FragColor = vec4(1.0,1.0,1.0,1.0);
    }
  `;

    const programInfo = glUtil.createProgramInfo(gl, vsSource, fsSource, { attribute: ["vPos", "norm"], uniform: ["MVMat", "PMat", "NMat"] });

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl, -2, -2, 2, 2);
    console.log(programInfo);
    console.log(buffers);

    var then = 0;

    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001; // convert to seconds
        const dt = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, dt);

        if (yee)
            requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initBuffers(gl, minx = 0, miny = 0, maxx = 1, maxy = 1, stepx = 1, stepy = 1) {
    var bruh = [];
    for (var i = 0; i < 5; i++) {
        bruh.push(new SimplexNoise());
    }
    var out = []

    var width = 200 * 0.005;
    var height = 200 * (Math.sqrt(3) / 2) * 0.005;

    for (var xi = minx; xi < maxx; xi += stepx) {
        for (var yi = miny; yi < maxy; yi += stepy) {
            out.push(Mesh.isoplane(gl, 0.005, 200, 200, xi * width, yi * height, (x, y) => {
                var out = 0;
                var i = 1;
                var j = 1;
                const lac = 2;
                const per = 0.3;
                bruh.forEach(
                    (noise) => {
                        out += j * noise.noise2D(x * i, y * i);
                        i *= lac;
                        j *= per;
                    }
                )
                return out;
                //return Math.random();
                //return 0.1 * (Math.sin(10 * x) + Math.sin(10 * y));
            }));
        }
    }
    return out;
}

var theta = 0;

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {*} programInfo 
 * @param {*} buffers 
 * @param {*} dt 
 */
function drawScene(gl, programInfo, buffers, dt) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta += dt;

    const view = mat4.create();
    const proj = mat4.create();

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(proj,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    mat4.translate(view, // destination matrix
        view, // matrix to translate
        [-0.0, 0.0, -10.0]);

    mat4.rotateX(view, view, -Math.PI / 3);
    mat4.rotateZ(view, view, theta / 3);


    gl.useProgram(programInfo.program);

    buffers.forEach(
        (buffer) => {
            const mv_mat = mat4.create();

            mat4.multiply(mv_mat, view, buffer.model_mat);

            const norm_mat = mat4.create();

            mat4.invert(norm_mat, mv_mat);
            mat4.transpose(norm_mat, norm_mat); {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
                gl.vertexAttribPointer(programInfo.attribute.vPos, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(programInfo.attribute.vPos);
            }

            {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
                gl.vertexAttribPointer(programInfo.attribute.norm, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(programInfo.attribute.norm);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);

            gl.uniformMatrix4fv(programInfo.uniform.MVMat, false, mv_mat);
            gl.uniformMatrix4fv(programInfo.uniform.PMat, false, proj);
            gl.uniformMatrix4fv(programInfo.uniform.NMat, false, norm_mat);

            {
                gl.drawElements(gl.TRIANGLES, buffer.nvert, gl.UNSIGNED_SHORT, 0);
            }
        }
    )
}

var yee = true;

function bruh() {
    yee = false;
}

window.onblur = () => {
    bruh();
}

function mouse_move() {

}