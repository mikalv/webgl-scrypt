precision mediump float;

/* Defines */
#define Ox10000 65536.0
#define Ox8000  32768.0

#define Ox5c5c 23644.0
#define Ox3636 13878.0

#define POW_2_01 2.0
#define POW_2_02 4.0
#define POW_2_03 8.0
#define POW_2_04 16.0
#define POW_2_05 32.0
#define POW_2_06 64.0
#define POW_2_07 128.0
#define POW_2_08 256.0
#define POW_2_09 512.0
#define POW_2_10 1024.0
#define POW_2_11 2048.0
#define POW_2_12 4096.0
#define POW_2_13 8192.0

/* Common functions */
vec4 toRGBA(in vec2 arg) {
    float V = float(arg.x);
    float R = floor(V / POW_2_08);
    V -= R * POW_2_08;
    float G = V;
    V = float(arg.y);
    float B = floor(V / POW_2_08);
    V -= B * POW_2_08;
    float A = V;
    return vec4(R/255., G/255., B/255., A/255.);
}

/* Math functions */

/* Note: shift should be a power of two, e.g. to shift 3 steps, use 2^3. */
vec2 sftr (in vec2 a, in float shift)
{
    vec2 ret = a / shift;
    ret = vec2(floor (ret.x), floor(ret.y) + fract(ret.x) * float(Ox10000));
    return ret;
}

/* Note: shift should be a power of two, e.g. to rotate 3 steps, use 2^3. */
vec2 rotr (in vec2 a, in float shift)
{
    vec2 ret = a / shift;
    ret = floor(ret) + fract(ret.yx) * float(Ox10000);
    return ret;
}

float xor16 (in float a, in float b)
{
    float ret = float(0);
    float fact = float(Ox8000);
    const int maxi = 16;

    for (int i=0; i < maxi; i++)
    {
        if ((max(a,b) >= fact) && (min(a,b) < fact))
            ret += fact;

        if (a >= fact) a -= fact;
            if (b >= fact) b -= fact;

                fact /= 2.0;
    }
    return ret;
}

vec2 xor (in vec2 a, in vec2 b)
{
        return vec2 (xor16 (a.x, b.x), xor16 (a.y, b.y));
}

vec2 safe_add (in vec2 a, in vec2 b)
{
    vec2 ret = a + b;
    if (ret.y >= float(Ox10000)) {
        ret += vec2(1.0, -1.*float(Ox10000));
    }
    if (ret.x >= float(Ox10000)) {
        ret.x -= float(Ox10000);
    }
    return ret;
}

vec2 blend (in vec2 m16, in vec2 m15, in vec2 m07, in vec2 m02)
{
    vec2 s0 = xor (rotr (m15   , POW_2_07), xor (rotr (m15.yx, POW_2_02), sftr (m15, POW_2_03)));
    vec2 s1 = xor (rotr (m02.yx, POW_2_01), xor (rotr (m02.yx, POW_2_03), sftr (m02, POW_2_10)));
    return safe_add (safe_add (m16, s0), safe_add (m07, s1));
}

/* Variables */
uniform sampler2D uSampler;
varying vec2 vTextCoord;

uniform float round;
uniform vec2 K[64];

//Start position for whole block
float start;

vec4 _(in float offset) {
    vec2 coordinate = vec2(mod(start + offset, 1024.), floor((start + offset)/1024.));
    return texture2D(uSampler, coordinate / 1024.);
}

vec2 _2(in float offset) {
    vec4 rgba = _(offset)*255.;
    float x = ((rgba.r * 256.) + rgba.g);
    float y = ((rgba.b * 256.) + rgba.a);
    return vec2(x, y);
}

void main () {
    vec4 c = gl_FragCoord - 0.5;
    float position = (c.y * 1024.) + c.x;
    float offset = mod(position, 65984.);
    float block = floor(position / 65984.);

    if ( offset >= 24. && offset < 72.) {
        vec2 w[64];
        for (int i = 0; i < 16; i++ ) {
            w[i] = _2(float(i) + 8.);
        }

        start = block * 65984.;

        for (int i = 16; i < 24; i++ ) {
            w[i] = blend(w[i-16], w[i-15], w[i-7], w[i-2]);
            if ( offset == (8. + float(i))) {
                gl_FragColor = toRGBA(w[i]);
            }
        }
    } else {
        gl_FragColor = texture2D(uSampler, vTextCoord.st);
    }
}
