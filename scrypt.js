function initializeGl() {
    canvas = document.createElement('canvas');
    if (debug || true) document.body.appendChild(canvas)
    canvas.height = textureSize;
    canvas.width = textureSize;

    var names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ],
        gl = null;

    for(var i in names) {
        try {
            gl = canvas.getContext(names[i], {preserveDrawingBuffer: true});
            if (gl) { break; }
        } catch (e) { }
    }

    if (!gl) {
        throw "Your browser doesn't support WebGL";
    }

    gl.clearColor ( 1.0, 1.0, 1.0, 1.0 );
    gl.clear ( gl.COLOR_BUFFER_BIT );
    gl.viewport(0, 0, canvas.width, canvas.height);

    return gl;
}

function loadResource(n) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", n, false);
    xhr.send(null);
    var x = xhr.responseText;
    return x;
};

function establishProgram(gl, vertex_shader, fragment_shader) {
    var program = gl.createProgram(),
        vShader = gl.createShader(gl.VERTEX_SHADER),
        vShaderSource = loadResource(vertex_shader),
        fShader = gl.createShader(gl.FRAGMENT_SHADER),
        fShaderSource = loadResource(fragment_shader);

    gl.shaderSource(vShader, vShaderSource);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(vShader);
    }
    gl.attachShader(program, vShader);

    gl.shaderSource(fShader, fShaderSource);
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(fShader);
    }
    gl.attachShader(program, fShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(program);
    }

    return program;
}

var h =  [0x6a09, 0xe667, 0xbb67, 0xae85,
          0x3c6e, 0xf372, 0xa54f, 0xf53a,
          0x510e, 0x527f, 0x9b05, 0x688c,
          0x1f83, 0xd9ab, 0x5be0, 0xcd19];

var k =  [0x428a, 0x2f98, 0x7137, 0x4491,
          0xb5c0, 0xfbcf, 0xe9b5, 0xdba5,
          0x3956, 0xc25b, 0x59f1, 0x11f1,
          0x923f, 0x82a4, 0xab1c, 0x5ed5,
          0xd807, 0xaa98, 0x1283, 0x5b01,
          0x2431, 0x85be, 0x550c, 0x7dc3,
          0x72be, 0x5d74, 0x80de, 0xb1fe,
          0x9bdc, 0x06a7, 0xc19b, 0xf174,
          0xe49b, 0x69c1, 0xefbe, 0x4786,
          0x0fc1, 0x9dc6, 0x240c, 0xa1cc,
          0x2de9, 0x2c6f, 0x4a74, 0x84aa,
          0x5cb0, 0xa9dc, 0x76f9, 0x88da,
          0x983e, 0x5152, 0xa831, 0xc66d,
          0xb003, 0x27c8, 0xbf59, 0x7fc7,
          0xc6e0, 0x0bf3, 0xd5a7, 0x9147,
          0x06ca, 0x6351, 0x1429, 0x2967,
          0x27b7, 0x0a85, 0x2e1b, 0x2138,
          0x4d2c, 0x6dfc, 0x5338, 0x0d13,
          0x650a, 0x7354, 0x766a, 0x0abb,
          0x81c2, 0xc92e, 0x9272, 0x2c85,
          0xa2bf, 0xe8a1, 0xa81a, 0x664b,
          0xc24b, 0x8b70, 0xc76c, 0x51a3,
          0xd192, 0xe819, 0xd699, 0x0624,
          0xf40e, 0x3585, 0x106a, 0xa070,
          0x19a4, 0xc116, 0x1e37, 0x6c08,
          0x2748, 0x774c, 0x34b0, 0xbcb5,
          0x391c, 0x0cb3, 0x4ed8, 0xaa4a,
          0x5b9c, 0xca4f, 0x682e, 0x6ff3,
          0x748f, 0x82ee, 0x78a5, 0x636f,
          0x84c8, 0x7814, 0x8cc7, 0x0208,
          0x90be, 0xfffa, 0xa450, 0x6ceb,
          0xbef9, 0xa3f7, 0xc671, 0x78f2];

function setupSquadMesh(gl) {
    //Convert pixel coordinate to vertex (-1, 1)
    var x = 32;
    var nX = x / textureSize;
    var vX = (nX * 2) - 1

    var y = 2;
    var nY = y / textureSize;
    var vY = (nY * 2) - 1;
//
    var vertices = new Float32Array([
        1,  1,
       -1,  1,
        1, -1,
       -1, -1
        //  vX, -1,
        // -1, -1,
        //  vX, vY,
        // -1, vY
    ]); //Square to cover whole canvas

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function initSHA256Program (gl) {
    var program = establishProgram(gl, "shaders/default-vs.js", "shaders/init-sha256-fs.js");

    var locations = {
        H:       gl.getUniformLocation(program, "H"),
        initial: gl.getUniformLocation(program, "initial")
    };
    var attributes = {
        position: gl.getAttribLocation(program, "aPosition")
    }


    return {
        P: program,
        L: locations,
        A: attributes,
        toRender: function(initial) {
            gl.useProgram(program);

            gl.uniform2fv(locations.initial, initial);
            gl.uniform2fv(locations.H, h);

            gl.enableVertexAttribArray(attributes.position);
            gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 0, 0);
        },
        postRender: function() {
            gl.disableVertexAttribArray(attributes.position);
        }
    };
}

$(function() {
    var gl = initializeGl();
    setupSquadMesh(gl);
    var programs = {
        "init-sha256": initSHA256Program(gl)
    }

    console.log("Headers is " + header);
    var header_bin = ___.hex_to_uint16_array(header);

    programs['init-sha256'].toRender(header_bin.slice(0, 32));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    programs['init-sha256'].postRender();

    var buf = new Uint8Array(80 * 1 * 4);
    gl.readPixels(0, 0, 80, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);

    var result = [];
    for(var i = 0; i < 80*4; i+=2) {
        result.push((buf[i]*256) + buf[i+1]);
    }
    console.log("Result is " + ___.uint16_array_to_hex(result));

});
