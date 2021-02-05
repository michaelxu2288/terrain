var cubeRotation = 0.0;
const mat4 = glMatrix.mat4
main();

var mouse_dragging = false;
const Camera = {
    rot: { x: -Math.PI / 2, y: 0, z: 0 },
    sca: 1,
}


function main() {
    const canvas = document.querySelector('#gl-terrain');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }


    canvas.addEventListener("mousedown", () => {
        mouse_dragging = true;
    });
    canvas.addEventListener("mouseup", () => {
        mouse_dragging = false;
    });
    canvas.addEventListener("mousemove", (e) => {
        if (mouse_dragging) {
            mouse_dragged(e);
        }
    });
    canvas.addEventListener("wheel", (e) => {
        wheel_scroll(e);
    })

    // Vertex shader program

    const vsSource = `
    attribute vec4 vPos;
    attribute vec3 norm;
    uniform mat4 MVMat;
    uniform mat4 PMat;
    uniform mat4 NMat;

    varying highp float height;
    varying highp vec3 normal;
    
    void main(void) {
        gl_Position = PMat * MVMat * vPos;
        gl_PointSize = 10.0;
        normal = (NMat * vec4(norm, 1.0)).xyz;
        height = vPos.z;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying highp float height;
    varying highp vec3 normal;
    void main(void) {

        highp vec3 col = vec3(1.0,1.0,1.0);

        highp float steepness = dot(vec3(0.0,0.0,1.0), normal);

        if(height > 0.4){
            if(steepness < 0.6){
                col = vec3(0.5, 0.5, 0.5);
            }
        }else{ 
            if(steepness > 0.9){
                col = vec3(0.4,0.7,0.4);
            }else if(steepness < 0.8){
                col = vec3(0.5, 0.5, 0.5);
            }else {
                col = vec3(0.2, 0.5, 0.2);
            }
        }

        highp float light = dot(normalize(vec3(1.0,1.0,1.0)), normal) + 0.1;

        gl_FragColor = vec4(col*light, 1.0);
        //gl_FragColor = normal;
        //gl_FragColor = vec4(1.0,1.0,1.0,1.0);
    }
  `;

    const programInfo = glUtil.createProgramInfo(gl, vsSource, fsSource, { attribute: ["vPos", "norm"], uniform: ["MVMat", "PMat", "NMat"] });

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl, -5, -5, 5, 5);

    var then = 0;

    glUtil.init(gl);

    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001; // convert to seconds
        const dt = now - then;
        then = now;

        if (yee)
            drawScene(gl, programInfo, buffers, dt);

        //if (yee)
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initBuffers(gl, minx = 0, miny = 0, maxx = 1, maxy = 1, stepx = 1, stepy = 1) {
    const noise = new FractalNoise({
        noise_level_count: 10,
        persistence: 0.3,
        lacunarity: 2,
        dimension: {
            sca_x: 0.5,
            sca_y: 0.5,
        }
    });

    const noise2 = new SimplexNoise();

    var out = []

    var width = 200 * 0.005;
    var height = 200 * (Math.sqrt(3) / 2) * 0.005;

    for (var xi = minx; xi < maxx; xi += stepx) {
        for (var yi = miny; yi < maxy; yi += stepy) {
            out.push(Mesh.isoplane(gl, 0.005, 200, 200, xi * width, yi * height, (x, y) => {
                return noise.noise2D(x, y) * 2 * noise2.noise2D(x * 0.1, y * 0.1);
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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

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
        [0.0, 0.0, -Camera.sca]);

    //mat4.rotate(view, view, theta * .7, [0, 1, 0]);
    mat4.rotateX(view, view, Camera.rot.x);
    mat4.rotateZ(view, view, Camera.rot.z);

    gl.useProgram(programInfo.program);

    buffers.forEach(
            (buffer) => {
                const mv_mat = mat4.create();

                mat4.multiply(mv_mat, view, buffer.model_mat);

                const norm_mat = mat4.create();

                mat4.invert(norm_mat, buffer.model_mat);
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
    Camera.sca += e.deltaY * 0.1;
    Camera.sca = Math.max(Math.min(Camera.sca, 10), 0.1);
}