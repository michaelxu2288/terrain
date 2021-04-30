function loadMainShader() {
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
uniform highp float snowline;
uniform highp float steepnessCutoff;

varying highp float height;
varying highp vec3 normal;
void main(void) {

    highp vec3 col = vec3(0.3,0.3, 0.3);

    highp float steepness = dot(vec3(0.0,0.0,1.0), normal);

    if(steepness > steepnessCutoff){
        if (height < snowline){
            col = vec3(0.1, 0.7, 0.3);
        }else{
            col = vec3(1.0, 1.0, 1.0);
        }
    }

    highp float light = dot(normalize(vec3(1.0,1.0,1.0)), normal) + 0.2;

    gl_FragColor = vec4(col*light, 1.0);
    //gl_FragColor = vec4(normal,1.0);
    //gl_FragColor = vec4(steepness,steepness,steepness,1.0);
}
`;

    const programInfo = glUtil.createProgramInfo(gl, vsSource, fsSource, { attribute: ["vPos", "norm"], uniform: ["MVMat", "PMat", "NMat", "snowline", "steepnessCutoff"] });

    return programInfo;
}

function loadWireframeShader() {
    // Vertex shader program

    const vsSource = `
attribute vec4 vPos;
uniform mat4 MVMat;
uniform mat4 PMat;

void main(void) {
    gl_Position = PMat * MVMat * vPos;
    gl_PointSize = 10.0;
}
`;

    // Fragment shader program

    const fsSource = `
void main(void) {
    gl_FragColor = vec4(1.0,1.0,1.0,1.0);
}
`;

    const programInfo = glUtil.createProgramInfo(gl, vsSource, fsSource, { attribute: ["vPos"], uniform: ["MVMat", "PMat"] });

    return programInfo;
}