import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorlds, createShots, SHOT_SECONDS as SHOT } from './worlds.js';
import './style.css';

const $=s=>document.querySelector(s),canvas=$('#scene');
const FADE=.5,DRIFT=.18; // seconds of crossfade at each cut; radians of camera drift per shot
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});}
catch(e){$('#error').hidden=false;$('#error').textContent='WebGL対応のブラウザで開いてください。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new T.Scene();scene.background=new T.Color('#899e9d');
const camera=new T.PerspectiveCamera(37,1,.5,1600),filmCamera=camera.clone();
let viewportAspect=1;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=450;orbit.maxPolarAngle=Math.PI/2-.025;
scene.add(new T.HemisphereLight('#e2f0ed','#666e61',2));
const sun=new T.DirectionalLight('#fff0d5',3);sun.position.set(-55,100,55);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:85,bottom:-85,near:1,far:250});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
const rim=new T.DirectionalLight('#a1d4e0',1.3);rim.position.set(15,12,-20);scene.add(rim);
const worlds=createWorlds(scene),shots=createShots(),DURATION=SHOT*shots.length;
const backgrounds=['#7b9ea6','#869691','#97aaa4'];
let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,mode='auto',recording=false,last=performance.now();
let activeShot=-1,orbitOffset=0,orbitSpeed=1;
for(const [i,shot] of shots.entries()){const o=document.createElement('option');o.value=String(i);o.textContent=shot.name;$('#mode').append(o);}
$('#mode').value=mode;$('#play').textContent=playing?'一時停止':'再生';
const azimuthOf=v=>Math.atan2(v.position[0]-v.target[0],v.position[2]-v.target[2]),radiusOf=v=>Math.hypot(v.position[0]-v.target[0],v.position[2]-v.target[2]);
function resetView(){const v=shots[Math.max(0,activeShot)].landscape;camera.position.fromArray(v.position);orbit.target.fromArray(v.target);orbit.update();}
resetView();

// The outgoing shot of a crossfade renders into this target, then is composited over the incoming shot.
const fadeTarget=new T.WebGLRenderTarget(1,1,{samples:4});
const fadeQuad=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:fadeTarget.texture,transparent:true,depthTest:false,depthWrite:false}));
const fadeScene=new T.Scene().add(fadeQuad),fadeCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);

// Emulate a 1920x1080 (or 1080x1920) video shown with object-fit: cover at the given viewport aspect.
function setCoverProjection(viewCamera,frameAspect,aspect){
  viewCamera.clearViewOffset();viewCamera.aspect=frameAspect;viewCamera.fov=37;
  const fw=frameAspect>=1?1920:1080,fh=frameAspect>=1?1080:1920;
  if(aspect<frameAspect){const width=fh*aspect;viewCamera.setViewOffset(fw,fh,(fw-width)/2,0,width,fh);}
  else if(aspect>frameAspect){const height=fw/aspect;viewCamera.setViewOffset(fw,fh,0,(fh-height)/2,fw,height);}
  viewCamera.updateProjectionMatrix();
}
function placeFilmCamera(shot,t,aspect){
  const v=aspect<1?shot.portrait:shot.landscape,u=((t%SHOT)+SHOT)%SHOT;
  // In the loop each shot drifts symmetrically around its framed azimuth; fixed scenes keep turning slowly.
  const angle=azimuthOf(v)+orbitOffset+(mode==='auto'?(u/SHOT-.5)*DRIFT:t*DRIFT/SHOT),r=radiusOf(v);
  filmCamera.position.set(v.target[0]+Math.sin(angle)*r,v.position[1],v.target[2]+Math.cos(angle)*r);filmCamera.lookAt(...v.target);
}
function renderShot(index,t,viewCamera,aspect){
  const shot=shots[index];worlds.forEach((w,i)=>{w.root.visible=i===shot.world;});
  worlds[shot.world].updates.forEach(fn=>fn(t));scene.background.set(backgrounds[shot.world]);
  if(viewCamera===filmCamera)placeFilmCamera(shot,t,aspect);
  renderer.render(scene,viewCamera);
}
function draw(t,aspect=viewportAspect){
  const cycle=((t%DURATION)+DURATION)%DURATION,auto=mode==='auto',idx=auto?Math.floor(cycle/SHOT):Number(mode);
  if(activeShot!==idx){activeShot=idx;resetView();}
  const cinematic=recording||$('#stage').classList.contains('lp');orbit.enabled=!cinematic;
  if(!cinematic){orbit.update();renderShot(idx,cycle,camera,aspect);return;}
  setCoverProjection(filmCamera,aspect<1?9/16:16/9,aspect);
  const u=cycle-idx*SHOT,n=shots.length;let fade=null;
  if(auto&&u>SHOT-FADE/2)fade={from:idx,to:(idx+1)%n,k:(u-(SHOT-FADE/2))/FADE};
  else if(auto&&u<FADE/2)fade={from:(idx+n-1)%n,to:idx,k:.5+u/FADE};
  if(!fade){renderShot(idx,cycle,filmCamera,aspect);return;}
  const size=renderer.getDrawingBufferSize(new T.Vector2());if(fadeTarget.width!==size.x||fadeTarget.height!==size.y)fadeTarget.setSize(size.x,size.y);
  renderer.setRenderTarget(fadeTarget);renderShot(fade.from,cycle,filmCamera,aspect);renderer.setRenderTarget(null);
  renderShot(fade.to,cycle,filmCamera,aspect);
  fadeQuad.material.opacity=1-fade.k;renderer.autoClear=false;renderer.render(fadeScene,fadeCamera);renderer.autoClear=true;
}
function resize(){if(recording)return;const r=$('#stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);viewportAspect=r.width/r.height;setCoverProjection(camera,viewportAspect<1?9/16:16/9,viewportAspect);draw(time);}
function deviceLayout(){
  const lp=$('#stage').classList.contains('lp'),mobile=lp&&$('#device').value!=='desktop';
  document.body.classList.toggle('phone-preview',mobile);$('#device-control').hidden=!lp;
  if(mobile){const [w,h]=$('#device').value.split('x').map(Number),heroHeight=Math.min(h,880);$('#stage').style.setProperty('--phone-width',`${w}px`);$('#stage').style.setProperty('--phone-ratio',`${w} / ${heroHeight}`);}
  resize();
}
window.addEventListener('resize',resize);resize();
function tick(now){if(playing&&!recording&&!document.hidden){const dt=Math.min((now-last)/1000,.1);time+=dt;if($('#stage').classList.contains('lp')&&orbitSpeed>1)orbitOffset=(orbitOffset+dt*DRIFT/SHOT*orbitSpeed)%(Math.PI*2);}last=now;if(!recording)draw(time);requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'一時停止':'再生';};
$('#overlay').onclick=()=>{const on=$('#stage').classList.toggle('lp');if(!on)resetView();$('#overlay').setAttribute('aria-pressed',String(on));$('#fast-orbit').hidden=!on;deviceLayout();};
$('#device').onchange=deviceLayout;
$('#fast-orbit').onclick=()=>{orbitSpeed=orbitSpeed===1?20:1;$('#fast-orbit').setAttribute('aria-pressed',String(orbitSpeed===20));};
$('#mode').onchange=e=>{mode=e.target.value;time=0;draw(time);};$('#reset').onclick=resetView;
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#poster').onclick=()=>{draw(time);canvas.toBlob(b=>{if(b)download(b,'industrial-poster.png');});};
// Quick real-time capture for review. The production files come from `npm run export` (fixed timestep, no dropped frames).
$('#record').onclick=async()=>{
  if(!window.MediaRecorder||!canvas.captureStream){$('#status').textContent='動画書き出しは対応するChrome等でお試しください。';return;}
  const oldMode=mode,oldTime=time;recording=true;mode='auto';const controls=[...document.querySelectorAll('button,select')];controls.forEach(b=>b.disabled=true);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));let stream;
  try{
    renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);draw(0,16/9);stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:10000000}),chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});recorder.start();const start=performance.now();
    await new Promise(resolve=>{function frame(now){const elapsed=(now-start)/1000;draw(Math.min(elapsed,DURATION-.001),16/9);$('#status').textContent=`書き出し中 ${Math.min(DURATION,Math.floor(elapsed))} / ${DURATION}秒 — タブを前面に保ってください`;if(elapsed<DURATION)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    recorder.stop();await done;download(new Blob(chunks,{type:recorder.mimeType}),`industrial-motion.${recorder.mimeType.includes('mp4')?'mp4':'webm'}`);$('#status').textContent=`${DURATION}秒・1920 × 1080 の動画を保存しました`;
  }catch(e){$('#status').textContent=`書き出せませんでした: ${e.message}`;}
  finally{stream?.getTracks().forEach(t=>t.stop());recording=false;mode=oldMode;time=oldTime;renderer.setPixelRatio(Math.min(devicePixelRatio,2));resize();controls.forEach(b=>b.disabled=false);}
};
// Frame server for scripts/export-video.mjs: renders the loop at an exact time and size, returns a PNG data URL.
if(new URLSearchParams(location.search).has('export')){
  const gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');
  window.__industrial={
    duration:DURATION,shots:shots.map(s=>s.name),gpu:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'unknown',
    frame(t,width,height){recording=true;mode='auto';renderer.setPixelRatio(1);renderer.setSize(width,height,false);draw(t,width/height);return canvas.toDataURL('image/png');},
  };
}
