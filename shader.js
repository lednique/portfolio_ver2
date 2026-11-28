(() => {
function bootShader() {
const HEIGHT_DATA="./bg/height.webp";
const HDRI_DATA="./bg/hdri.jpg";
const ALU_DATA="./bg/aluminum.jpg";
// Настройки со скриншота
const P={normalScale:0.60,roughness:0.43,metalness:1.00,exposure:0.39,mouseInfluence:0.80,lightIntensity:0.80,hdriRot:1.26,flipY:1,autoRotate:false};
const canvas=document.getElementById('gl');
if(!canvas||!canvas.isConnected||canvas.dataset.shaderReady!=='1')return;
if(canvas.dataset.shaderInitialized==='1')return;
canvas.dataset.shaderInitialized='1';
// Mobile layout: the metal lighting is driven by the device accelerometer and
// painting is disabled entirely (touch is reserved for scrolling the page).
const isMobileLayout=()=>matchMedia('(max-width: 1000px)').matches;
const canPaint=()=>!isMobileLayout();
const gl=canvas.getContext('webgl2',{antialias:false,alpha:false})||canvas.getContext('webgl',{antialias:false,alpha:false});
if(!gl)return;
const VS=`attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=a_pos*0.5+0.5;gl_Position=vec4(a_pos,0.,1.);}`;
const FS=`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_height;uniform sampler2D u_paint;uniform sampler2D u_hdri;uniform sampler2D u_aluminum;
uniform vec2 u_resolution;uniform vec2 u_mouse;uniform float u_time;uniform vec2 u_texel;uniform float u_bgBoost;
uniform float u_normalScale;uniform float u_roughness;uniform float u_metalness;
uniform float u_exposure;uniform float u_hdriRot;uniform float u_mouseInfluence;
uniform float u_lightIntensity;uniform float u_flipY;uniform float u_rot90;
vec2 coverUV(vec2 uv,vec2 res,vec2 texRes){float sa=res.x/res.y;float ta=texRes.x/texRes.y;vec2 s=vec2(1.);if(sa>ta)s.y=ta/sa;else s.x=sa/ta;return uv*s+(1.-s)*.5;}
vec3 sampleHDRI(vec3 dir){float lon=atan(dir.x,dir.z);float lat=asin(clamp(dir.y,-1.,1.));vec2 uv=vec2(lon/6.28318530718+.5,.5-lat/3.14159265359);uv.x=fract(uv.x);uv.y=clamp(uv.y,.002,.998);vec3 c=texture2D(u_hdri,uv).rgb;return pow(max(c,vec3(0.)),vec3(2.2))*2.6+vec3(.055);}
vec3 sampleHDRIBlur(vec3 dir,float r){vec3 col=sampleHDRI(dir)*.66;col+=sampleHDRI(normalize(dir+vec3(r*.30,r*.20,0.)))*.17;col+=sampleHDRI(normalize(dir+vec3(-r*.30,-r*.20,0.)))*.17;return col;}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float getH(vec2 uv){return texture2D(u_height,uv).r*u_bgBoost+texture2D(u_paint,uv).r;}
void main(){
vec2 uv=v_uv;
vec2 res=u_resolution;
// Mobile: rotate the sampled metal 90° clockwise. Cover scaling follows the
// rotated axes, so desktop stretches vertically and mobile horizontally.
if(u_rot90>0.5){uv=vec2(1.0-uv.y,uv.x);res=res.yx;}
vec2 hUV=coverUV(uv,res,vec2(1800.,1350.));
vec2 aUV=coverUV(uv,res,vec2(1024.,1024.));
// --- Height -> Normal (Sobel) ---
vec2 t=u_texel;
float h00=getH(hUV+vec2(-t.x,-t.y));
float h10=getH(hUV+vec2(0.,-t.y));
float h20=getH(hUV+vec2(t.x,-t.y));
float h01=getH(hUV+vec2(-t.x,0.));
float h21=getH(hUV+vec2(t.x,0.));
float h02=getH(hUV+vec2(-t.x,t.y));
float h12=getH(hUV+vec2(0.,t.y));
float h22=getH(hUV+vec2(t.x,t.y));
float gx=((h20+2.*h21+h22)-(h00+2.*h01+h02))*.25;
float gy=((h02+2.*h12+h22)-(h00+2.*h10+h20))*.25;
float strength=u_normalScale*6.0;
vec3 N=normalize(vec3(-gx*strength,-gy*strength*u_flipY,1.0));
vec3 V=vec3(0.,0.,1.);vec3 R=reflect(-V,N);
float rotY=u_hdriRot+u_mouse.x*u_mouseInfluence*.85;
float rotX=-.28+u_mouse.y*u_mouseInfluence*.38;
vec3 Rr=R;float cy=cos(rotY),sy=sin(rotY);Rr.xz=mat2(cy,-sy,sy,cy)*Rr.xz;
float cx=cos(rotX),sx=sin(rotX);Rr.yz=mat2(cx,-sx,sx,cx)*Rr.yz;Rr=normalize(Rr);
vec3 alu=texture2D(u_aluminum,aUV).rgb;
float aluLum=dot(alu,vec3(.299,.587,.114));
vec3 baseColor=alu*vec3(1.03,1.01,.99);
float roughness=clamp(u_roughness+(aluLum-.78)*.38,.02,1.);
vec3 env=sampleHDRIBlur(Rr,roughness);
vec3 F0=mix(vec3(.04),vec3(.91,.92,.94),u_metalness);
float ndv=max(dot(N,V),0.);
vec3 F=F0+(1.-F0)*pow(1.-ndv,5.);
vec3 specIBL=env*F;
vec3 diffuse=baseColor*(1.-u_metalness)*env*.35;
vec3 ambient=baseColor*F*vec3(.30,.31,.33)*(.65+.35*aluLum);
vec3 L=normalize(vec3(u_mouse.x*1.25,u_mouse.y*1.25,1.45));
vec3 H=normalize(L+V);
float ndh=max(dot(N,H),0.);float ndl=max(dot(N,L),0.);
float shininess=mix(160.,10.,roughness);
float spec=pow(ndh,shininess)*u_lightIntensity;
vec3 directSpec=vec3(1.,.98,.94)*spec*F*2.4;
vec3 directDiff=baseColor*(1.-u_metalness)*ndl*vec3(1.,.98,.94)*.45;
vec3 color=specIBL+diffuse+ambient+directSpec+directDiff;
float vig=1.-.18*pow(length(uv-.5),2.)*2.2;color*=vig;
color*=u_exposure;color=aces(color);color=pow(color,vec3(1./2.2));
gl_FragColor=vec4(color,1.);
}`;
function compile(t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
const prog=gl.createProgram();gl.attachShader(prog,compile(gl.VERTEX_SHADER,VS));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(prog,'a_pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U={};['u_height','u_paint','u_bgBoost','u_hdri','u_aluminum','u_resolution','u_mouse','u_time','u_texel','u_normalScale','u_roughness','u_metalness','u_exposure','u_hdriRot','u_mouseInfluence','u_lightIntensity','u_flipY','u_rot90'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
function placeholder(r,g,b){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([r,g,b,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;}
const phH=placeholder(40,40,40),phA=placeholder(200,200,205),phN=placeholder(0,0,0);
let texBg=null,texPaint=gl.createTexture(),texH=null,texA=null;
gl.bindTexture(gl.TEXTURE_2D,texPaint);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);

// --- Background height (separate) + paint layer (separate) ---
// Background relief is boosted x1.5 vs paint layer in the shader,
// so drawn strokes keep their previous strength.
const BG_BOOST=2.5;
let bgHidden=false;
const pCanvas=document.createElement('canvas');
const pCtx=pCanvas.getContext('2d');
let hW=0,hH=0,paintDirty=false;
const hImg=new Image();
hImg.onload=()=>{
  hW=hImg.width;hH=hImg.height;
  pCanvas.width=hW;pCanvas.height=hH;
  pCtx.fillStyle='#000';pCtx.fillRect(0,0,hW,hH);
  paintDirty=true;
};
hImg.src=HEIGHT_DATA;
function uploadPaint(){
  if(!paintDirty||!hW)return;
  gl.bindTexture(gl.TEXTURE_2D,texPaint);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,pCanvas);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  paintDirty=false;
}
function loadTex(data,flip,wrap,cb){const img=new Image();img.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);cb(t);};img.src=data;}
loadTex(HEIGHT_DATA,true,gl.CLAMP_TO_EDGE,t=>texBg=t);
loadTex(HDRI_DATA,false,gl.REPEAT,t=>texH=t);
loadTex(ALU_DATA,true,gl.CLAMP_TO_EDGE,t=>texA=t);

// --- Brushes: LEFT button = soft 16px, hover trail = smooth 0.5px ---
// Opacity halved vs before: draw 0.55->0.275, trail 0.85->0.425.
// On fast movement opacity additionally drops down to x0.25.
const DRAW_RADIUS=16;
const TRAIL_WIDTH=0.5;
const DRAW_ALPHA=0.275;
const TRAIL_ALPHA=0.425;
const brushSprite=(()=>{
  const S=128,c=document.createElement('canvas');c.width=c.height=S;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.25,'rgba(255,255,255,0.78)');
  g.addColorStop(0.55,'rgba(255,255,255,0.34)');
  g.addColorStop(0.8,'rgba(255,255,255,0.10)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,S,S);
  return c;
})();
let lastPos=null,lastPosTime=0,leftDown=false;
function pointerToHeight(e){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return {x:0,y:0};
  let u=(e.clientX-rect.left)/rect.width;
  let v=1-(e.clientY-rect.top)/rect.height;
  // Mirror the shader's 90° clockwise UV rotation before cover mapping.
  const rotated=matchMedia('(max-width: 1000px)').matches;
  if(rotated){const oldU=u;u=1-v;v=oldU;}
  const sa=rotated?rect.height/rect.width:rect.width/rect.height,ta=hW/hH;
  let sx=1,sy=1;if(sa>ta)sy=ta/sa;else sx=sa/ta;
  const tx=u*sx+(1-sx)*0.5,ty=v*sy+(1-sy)*0.5;
  return {x:tx*hW,y:(1-ty)*hH};
}
function speedFactor(pos,now){
  // Fast movement -> opacity multiplier smoothly drops to 0.25
  if(!lastPos||!lastPosTime)return 1;
  const dt=Math.max(now-lastPosTime,1);
  const speed=Math.hypot(pos.x-lastPos.x,pos.y-lastPos.y)/dt; // height-px per ms
  let t=(speed-0.25)/(2.5-0.25);t=Math.max(0,Math.min(1,t));t=t*t*(3-2*t);
  return 1-0.75*t;
}
function stampBig(x,y,alpha){
  pCtx.save();pCtx.globalAlpha=alpha;
  pCtx.drawImage(brushSprite,x-DRAW_RADIUS,y-DRAW_RADIUS,DRAW_RADIUS*2,DRAW_RADIUS*2);
  pCtx.restore();paintDirty=true;
}
function drawBigLine(from,to,alpha){
  const dx=to.x-from.x,dy=to.y-from.y,dist=Math.hypot(dx,dy);
  const step=Math.max(2,DRAW_RADIUS*0.3);
  const steps=Math.max(1,Math.ceil(dist/step));
  // per-stamp alpha lowered to compensate overlap of soft stamps
  for(let i=1;i<=steps;i++){const t=i/steps;stampBig(from.x+dx*t,from.y+dy*t,alpha*0.55);}
}
function drawTrail(from,to,alpha){
  pCtx.save();
  pCtx.strokeStyle=`rgba(255,255,255,${alpha})`;
  pCtx.lineWidth=TRAIL_WIDTH;pCtx.lineCap='round';pCtx.lineJoin='round';
  pCtx.beginPath();pCtx.moveTo(from.x,from.y);pCtx.lineTo(to.x,to.y);pCtx.stroke();
  pCtx.restore();paintDirty=true;
}
canvas.addEventListener('pointermove',e=>{
  if(!hW||!canPaint())return;
  const evs=(e.getCoalescedEvents&&e.getCoalescedEvents().length)?e.getCoalescedEvents():[e];
  for(const ev of evs){
    const pos=pointerToHeight(ev),now=performance.now();
    const sf=speedFactor(pos,now);
    if(leftDown){
      if(lastPos)drawBigLine(lastPos,pos,DRAW_ALPHA*sf);else stampBig(pos.x,pos.y,DRAW_ALPHA*sf);
    }else{
      if(lastPos)drawTrail(lastPos,pos,TRAIL_ALPHA*sf);else drawTrail(pos,pos,TRAIL_ALPHA*sf);
    }
    lastPos=pos;lastPosTime=now;
  }
});
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||!canPaint())return;
  leftDown=true;lastPos=null;
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  if(!hW)return;
  const pos=pointerToHeight(e);lastPos=pos;lastPosTime=performance.now();
  stampBig(pos.x,pos.y,DRAW_ALPHA);
});
const onPointerUp=e=>{if(e.button===0){leftDown=false;lastPos=null;}};
const onPointerCancel=()=>{leftDown=false;lastPos=null;};
const onKeyDown=e=>{
  if(!canPaint())return;
  const t=e.target;
  if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
  if((e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К')&&hW){pCtx.fillStyle='#000';pCtx.fillRect(0,0,hW,hH);bgHidden=false;paintDirty=true;}
  if((e.key==='c'||e.key==='C'||e.key==='с'||e.key==='С')&&hW){pCtx.fillStyle='#000';pCtx.fillRect(0,0,hW,hH);bgHidden=true;paintDirty=true;}
};
addEventListener('pointerup',onPointerUp);
addEventListener('pointercancel',onPointerCancel);
canvas.addEventListener('pointerleave',()=>{if(!leftDown)lastPos=null;});
addEventListener('keydown',onKeyDown);

let tm={x:0,y:0},m={x:0,y:0},last=performance.now(),ang=0;
const onWinPointerMove=e=>{
  // On phones the accelerometer owns the lighting, not the touch position.
  if(isMobileLayout()&&('DeviceOrientationEvent'in window))return;
  const r=canvas.getBoundingClientRect();
  if(!r.width||!r.height)return;
  tm.x=((e.clientX-r.left)/r.width)*2-1;
  tm.y=-(((e.clientY-r.top)/r.height)*2-1);
  last=performance.now();
};
addEventListener('pointermove',onWinPointerMove,{passive:true});

// --- Accelerometer lighting (mobile) -------------------------------------
// Tilting the phone pans the reflected HDRI, exactly like moving the cursor
// does on desktop. The first reading becomes the neutral position, so the
// lighting starts where the phone is actually held.
const TILT_RANGE=30; // degrees of tilt for the full pan
let tiltBase=null;
const clampUnit=v=>Math.max(-1,Math.min(1,v));
const onDeviceOrientation=e=>{
  if(!isMobileLayout())return;
  if(e.beta==null&&e.gamma==null)return;
  const beta=e.beta||0,gamma=e.gamma||0;
  if(!tiltBase)tiltBase={beta,gamma};
  let dx=gamma-tiltBase.gamma;
  let dy=beta-tiltBase.beta;
  if(dx>180)dx-=360; else if(dx<-180)dx+=360;
  if(dy>180)dy-=360; else if(dy<-180)dy+=360;
  tm.x=clampUnit(dx/TILT_RANGE);
  tm.y=clampUnit(-dy/TILT_RANGE);
  last=performance.now();
};
const listenTilt=()=>{
  removeEventListener('deviceorientation',onDeviceOrientation);
  addEventListener('deviceorientation',onDeviceOrientation,{passive:true});
};
const requestTilt=()=>{
  if(!isMobileLayout()||!('DeviceOrientationEvent'in window))return;
  // iOS 13+ needs an explicit permission granted from a user gesture.
  if(typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission()
      .then(state=>{if(state==='granted')listenTilt();})
      .catch(()=>{});
  }else{
    listenTilt();
  }
};
if(isMobileLayout()){
  requestTilt();
  // Retry on the first real gesture: browsers only allow the prompt there.
  addEventListener('pointerup',requestTilt,{passive:true});
}
function resize(){
  const rect=canvas.getBoundingClientRect();
  const d=Math.min(devicePixelRatio||1,2);
  const w=Math.max(1,Math.floor((rect.width||canvas.clientWidth||1)*d));
  const h=Math.max(1,Math.floor((rect.height||canvas.clientHeight||1)*d));
  if(canvas.width===w&&canvas.height===h)return;
  canvas.width=w;canvas.height=h;
  gl.viewport(0,0,canvas.width,canvas.height);
}
addEventListener('resize',resize);
let ro=null;
if('ResizeObserver'in window){ro=new ResizeObserver(resize);ro.observe(canvas);}
resize();
function cleanup(){
  removeEventListener('pointerup',onPointerUp);
  removeEventListener('pointercancel',onPointerCancel);
  removeEventListener('keydown',onKeyDown);
  removeEventListener('pointermove',onWinPointerMove);
  removeEventListener('deviceorientation',onDeviceOrientation);
  removeEventListener('resize',resize);
  if(ro)ro.disconnect();
}
let prev=performance.now();
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let lastDrawX=NaN,lastDrawY=NaN,lastDrawW=0,lastDrawH=0;
// Pause the render loop when the hero is off-screen or the tab is hidden:
// the shader used to keep a full-frame RAF alive for the whole session.
let inView=true,pageVisible=!document.hidden,loopRunning=false;
const canRun=()=>inView&&pageVisible&&canvas.isConnected;
function kick(){
  if(loopRunning||!canRun())return;
  loopRunning=true;prev=performance.now();
  requestAnimationFrame(frame);
}
if('IntersectionObserver'in window){
  const vio=new IntersectionObserver(entries=>{
    inView=!!entries[0]?.isIntersecting;
    if(inView)kick(); else loopRunning=false;
  },{rootMargin:'120px'});
  vio.observe(canvas);
  const drop=()=>{vio.disconnect();cleanup();};
  canvas.addEventListener('lednique:teardown',drop,{once:true});
}
document.addEventListener('visibilitychange',()=>{
  pageVisible=!document.hidden;
  if(pageVisible)kick(); else loopRunning=false;
});
function frame(now){
if(!canvas.isConnected||canvas.dataset.shaderReady!=='1'){cleanup();loopRunning=false;return;}
if(!canRun()){loopRunning=false;return;}
const dt=Math.min((now-prev)/1000,.05);prev=now;
const still=motionQuery.matches||document.documentElement.dataset.a11y==='true';
// No automatic rotation: only real pointer movement drives the metal lighting.
if(still){m.x=0;m.y=0;}
else{
  const ease=Math.min(1,dt*5);
  m.x+=(tm.x-m.x)*ease;
  m.y+=(tm.y-m.y)*ease;
}
// In reduced-motion/a11y there is no animation: redraw only on real input.
const changed=paintDirty||canvas.width!==lastDrawW||canvas.height!==lastDrawH||Math.abs(m.x-lastDrawX)>1e-4||Math.abs(m.y-lastDrawY)>1e-4;
if(still&&!changed){requestAnimationFrame(frame);return;}
uploadPaint();
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texBg||phN);gl.uniform1i(U.u_height,0);
gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,texPaint);gl.uniform1i(U.u_paint,3);
gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texH||phH);gl.uniform1i(U.u_hdri,1);
gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,texA||phA);gl.uniform1i(U.u_aluminum,2);
gl.uniform1f(U.u_bgBoost,bgHidden?0:BG_BOOST);
gl.uniform2f(U.u_resolution,canvas.width,canvas.height);gl.uniform2f(U.u_mouse,m.x,m.y);gl.uniform1f(U.u_time,now*.001);
gl.uniform2f(U.u_texel,hW?1/hW:1/1800,hH?1/hH:1/1350);
gl.uniform1f(U.u_normalScale,P.normalScale);gl.uniform1f(U.u_roughness,P.roughness);gl.uniform1f(U.u_metalness,P.metalness);
gl.uniform1f(U.u_exposure,P.exposure);gl.uniform1f(U.u_hdriRot,P.hdriRot);gl.uniform1f(U.u_mouseInfluence,P.mouseInfluence);
gl.uniform1f(U.u_lightIntensity,P.lightIntensity);gl.uniform1f(U.u_flipY,P.flipY);
gl.uniform1f(U.u_rot90,matchMedia('(max-width: 1000px)').matches?1:0);
gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
lastDrawX=m.x;lastDrawY=m.y;lastDrawW=canvas.width;lastDrawH=canvas.height;
requestAnimationFrame(frame);}
kick();
}
window.__bootLedniqueShader=bootShader;
bootShader();
})();
