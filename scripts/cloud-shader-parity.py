from pathlib import Path
import re,json
# Generate a local-only WebGL comparison page; serve its output for browser QA.
s=(Path(__file__).resolve().parent.parent/'src/components/originkit/cloud-sky.tsx').read_text()
c=dict(re.findall(r'const (\w+) = ([\d.]+)',s))
def shader(name):
 x=re.search(r'const '+name+r' = `([\s\S]*?)`',s).group(1)
 return re.sub(r'\$\{(\w+)\.toFixed\((\d+)\)\}',lambda m:format(float(c[m[1]]),'.'+m[2]+'f'),x)
vert=shader('VERT_SRC');new=shader('FRAG_SRC');old=new.replace('  if (b.x <= 0.0) return b;','')
js='const sources='+json.dumps([vert,old,new])+''';
const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl',{antialias:false,alpha:false,depth:false,preserveDrawingBuffer:true});
function program(src){function shader(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}let p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,sources[0]));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,src));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
const programs=[program(sources[1]),program(sources[2])];let buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
function draw(p,state){gl.useProgram(p);let a=gl.getAttribLocation(p,'a_pos');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);let u=n=>gl.getUniformLocation(p,n);for(const [n,v] of Object.entries({uRes:[192,128],uNearX:state[0],uFarX:state[0]*.4,uCirrusX:state[0]*.2,uCoverage:state[1],uSize:state[2],uSoftness:12,uShadow:.5,uCirrus:.3,uZenith:[0,.46,1],uHorizon:[.706,.824,.941],uCloud:[1,1,1],uGlow:[.91,.953,1,.9],uSun:[.9,.92],uParallax:[state[3],-.04]})){if(Array.isArray(v))gl['uniform'+v.length+'f'](u(n),...v);else gl.uniform1f(u(n),v);}gl.drawArrays(gl.TRIANGLES,0,3);let pixels=new Uint8Array(192*128*4);gl.readPixels(0,0,192,128,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;}
let report={states:0,channels:0,differing:0,maxDifference:0};for(const state of [[0,.6,1.3,0],[.7,.6,1.3,.07],[-2,.2,.2,0],[4,1,3,-.1],[9,.8,2,.2],[.2,0,1,0]]){let a=draw(programs[0],state),b=draw(programs[1],state);report.states++;for(let i=0;i<a.length;i++){let d=Math.abs(a[i]-b[i]);report.channels++;if(d)report.differing++;report.maxDifference=Math.max(report.maxDifference,d);}}
report.pass=report.differing===0;document.querySelector('pre').textContent=JSON.stringify(report,null,2);
'''
output=Path('/tmp/showonce-gpu-parity');output.mkdir(parents=True,exist_ok=True)
(output/'index.html').write_text('<html><body><h1>Cloud shader pixel parity</h1><canvas width="192" height="128"></canvas><pre>Running</pre><script>'+js+'</script></body></html>')
