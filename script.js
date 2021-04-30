function loadDepedencies() {
    /**
     * 
    <script src="gl-matrix.js"></script>
    <script src="simplex-noise.js"></script>
    <script src="ui.js"></script>
    <script src="utils.js"></script>
    <script src="noise.js"></script>
    <script src="gl-utils.js"></script>
    <script src="input.js"></script>
     */
    const needed_scripts = ["shaders.js", "gl-matrix.js", "simplex-noise.js", "ui.js", "utils.js", "noise.js", "gl-utils.js", "input.js"];
    const promises = [];
    needed_scripts.forEach((script) => {
        promises.push(new Promise((res, rej) => {
            var element = document.createElement("script");
            element.src = script;
            document.body.appendChild(element);
            element.onload = () => {
                res();
            }
        }));
    });

    Promise.all(promises).then(() => {
        //document.getElementById("main-loading").remove();
        createUI().then(() => {
            setTimeout(() => {
                main()
            }, 5);
        })
    });

}

loadDepedencies();

var cubeRotation = 0.0;

var Settings = {
    height_map_size: 11,
    noise_scale: 14,
    tiles: 8,
    trisPerTile: 50,
    tileSize: 1,
    tileSkip: 1,
    snowLine: 0,
    steepnessCutoff: 0.6,
    blurRadius: 0,
    wireframe: false,
    heightScale: 1,
}

const logistic = (x) => {
    return 1 / (1 + Math.exp(-x / 1000)) + 0.01;
}

var mouse_dragging = false;
const Camera = {
    rot: { x: -1.0750000000000002, y: 0, z: 0 },
    sca: 10,
}

var regenerateBuffers = false;
var changed = false;

var idle = true;
var n;
var map;

var gl;
var buffers;

function main() {

    const canvas = document.querySelector('#gl-terrain');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }


    canvas.addEventListener("mousedown", () => {
        mouse_dragging = true;
        change = true;
    });
    canvas.addEventListener("mouseup", () => {
        mouse_dragging = false;
    });
    canvas.addEventListener("mousemove", (e) => {
        if (mouse_dragging) {
            change = true;
            mouse_dragged(e);
        }
    });
    canvas.addEventListener("wheel", (e) => {
        wheel_scroll(e);
        change = true;
    })

    const programs = {
        main: loadMainShader(),
        wireframe: loadWireframeShader(),
    }

    if (!map) {
        generateMap();
    }

    var then = 0;

    glUtil.init(gl);

    change = true;
    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001; // convert to seconds
        const dt = now - then;
        then = now;
        if (buffers && yee && change) {
            drawScene(gl, programs, buffers, dt);
            change = false
        }
        //if (yee)
        Input.text("fps", Math.round(1 / dt) + " frames per second");
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function generateMap() {
    idle = false;
    Input.text("status", "Generating map using diamond-square");
    var promise = new Promise(
        (res, rej) => {
            setTimeout(() => {
                n = Math.pow(2, Settings.height_map_size) + 1;
                map = DiamondSquare.map(n, Settings.noise_scale);

                HeightMap.averageBlur(map, n, Settings.blurRadius)
                res();
            }, 10);

        }
    ).then(() => {
        initBuffers()
    });
}

function initBuffers() {

    idle = false;
    Input.text("status", "Generating Tiles");
    const promise = new Promise(
        (res, rej) => {
            setTimeout(() => {

                if (buffers != null) {
                    const deleting = buffers;
                    buffers = [];
                    deleting.forEach((buffer) => {
                        gl.deleteBuffer(buffer.vertices);
                        gl.deleteBuffer(buffer.indices);
                        gl.deleteBuffer(buffer.normals);
                        gl.deleteBuffer(buffer.wireframe);
                    });
                }


                const out = []
                const z = Settings.tiles;
                const nTris = Settings.trisPerTile;
                const tileSize = Settings.tileSize;
                const skip = Settings.tileSkip;
                const scale = Settings.heightScale
                for (var i = -z; i < z; i++) {
                    for (var j = -z; j < z; j++) {
                        out.push(DiamondSquare.getTile(gl, map, n, i * tileSize, j * tileSize, (i + z) * nTris * skip, (j + z) * nTris * skip, nTris, nTris, tileSize, tileSize, skip, scale));
                    }
                }
                buffers = out;
                res();
            }, 5)
        }
    ).then(() => {
        idle = true;
        change = true;
        Input.text("status", "Finished and Rendering");
    });
}

var theta = 0;

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {*} programInfo 
 * @param {*} buffers 
 * @param {*} dt 
 */
function drawScene(gl, programs, buffers, dt) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    theta += dt;

    const view = glMatrix.mat4.create();
    const proj = glMatrix.mat4.create();

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000.0;

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    glMatrix.mat4.perspective(proj,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    glMatrix.mat4.translate(view, // destination matrix
        view, // matrix to translate
        [0.0, 0.0, -Camera.sca]);

    //glMatrix.mat4.rotate(view, view, theta * .7, [0, 1, 0]);
    glMatrix.mat4.rotateX(view, view, Camera.rot.x);
    glMatrix.mat4.rotateZ(view, view, Camera.rot.z);

    var program = programs.main
    if (Settings.wireframe) {
        program = programs.wireframe;
    }

    gl.useProgram(program.program);
    buffers.forEach(
            (buffer) => {

                if (!buffer.vertices || !buffer.normals || !buffer.indices) {
                    return;
                }
                if (Settings.wireframe && !buffer.wireframe) {
                    return;
                }

                const mv_mat = glMatrix.mat4.create();

                glMatrix.mat4.multiply(mv_mat, view, buffer.model_mat);

                const norm_mat = glMatrix.mat4.create();

                glMatrix.mat4.invert(norm_mat, buffer.model_mat);
                glMatrix.mat4.transpose(norm_mat, norm_mat); {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
                    gl.vertexAttribPointer(program.attribute.vPos, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(program.attribute.vPos);
                }

                if (!Settings.wireframe && buffer.normals) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normals);
                    gl.vertexAttribPointer(program.attribute.norm, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(program.attribute.norm);
                }

                if (Settings.wireframe) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.wireframe);
                } else {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
                }

                gl.uniformMatrix4fv(program.uniform.MVMat, false, mv_mat);
                gl.uniformMatrix4fv(program.uniform.PMat, false, proj);

                if (!Settings.wireframe) {
                    gl.uniformMatrix4fv(program.uniform.NMat, false, norm_mat);
                    gl.uniform1f(program.uniform.snowline, Settings.snowLine);
                    gl.uniform1f(program.uniform.steepnessCutoff, Settings.steepnessCutoff);
                }

                {
                    if (Settings.wireframe) {
                        gl.drawElements(gl.LINES, 2 * buffer.nvert, gl.UNSIGNED_SHORT, 0);
                    } else {
                        gl.drawElements(gl.TRIANGLES, buffer.nvert, gl.UNSIGNED_SHORT, 0);
                    }
                } {
                    gl.disableVertexAttribArray(program.attribute.vPos);
                    if (!Settings.wireframe) {
                        gl.disableVertexAttribArray(program.attribute.norm);
                    }
                }
            }
        )
        //gl.uniformMatrix4fv(programInfo.uniform.MVMat, false, view);
        //glUtil.drawAxis(gl, programInfo);
}

var yee = true;


window.onblur = () => {
    yee = false;
}

window.onfocus = () => {
    yee = true;
}

function mouse_dragged(e) {
    Camera.rot.z += e.movementX * 0.005;
    Camera.rot.x += e.movementY * 0.005;
    Camera.rot.x = Math.max(Math.min(Camera.rot.x, 0), -Math.PI);
}

/**
 * 
 * @param {WheelEvent} e 
 */
function wheel_scroll(e) {
    Camera.sca += e.deltaY * 0.01;
    Camera.sca = Math.max(Math.min(Camera.sca, 1000), 0.1);
}