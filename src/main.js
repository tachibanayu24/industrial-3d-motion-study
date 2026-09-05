import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorlds } from './worlds.js';
import './style.css';

const $=s=>document.querySelector(s),canvas=$('#scene');
const DURATION=18,SHOT=6;
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});}
catch(e){$('#error').hidden=false;$('#error').textContent='WebGL対応のブラウザで開いてください。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new T.Scene();scene.background=new T.Color('#899e9d');
const camera=new T.PerspectiveCamera(37,1,.5,1600),filmCamera=camera.clone();
let viewportAspect=1;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=450;orbit.maxPolarAngle=Math.PI/2-.025;
let activeScene=-1;
function resetView(){const v=worlds[Math.max(0,activeScene)].view,r=Math.hypot(v.position[0]-v.target[0],v.position[2]-v.target[2]);camera.position.set(v.target[0]+Math.sin(cameraAzimuth)*r,v.position[1],v.target[2]+Math.cos(cameraAzimuth)*r);orbit.target.fromArray(v.target);orbit.update();}
scene.add(new T.HemisphereLight('#e2f0ed','#666e61',2));
const sun=new T.DirectionalLight('#fff0d5',3);sun.position.set(-55,100,55);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:85,bottom:-85,near:1,far:250});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
const rim=new T.DirectionalLight('#a1d4e0',1.3);rim.position.set(15,12,-20);scene.add(rim);
const worlds=createWorlds(scene);
let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,mode='auto',recording=false,last=performance.now();
const firstView=worlds[0].view;
let cameraAzimuth=Math.atan2(firstView.position[0]-firstView.target[0],firstView.position[2]-firstView.target[2])-.04;
let recordingAzimuth=cameraAzimuth;
let orbitSpeed=1;
resetView();
$('#mode').value=mode;$('#play').textContent=playing?'一時停止':'再生';
const backgrounds=['#7b9ea6','#869691','#97aaa4'];
function setCoverProjection(viewCamera,aspect){
  viewCamera.clearViewOffset();viewCamera.aspect=16/9;viewCamera.fov=37;
  // Emulate a 1920x1080 video with object-fit: cover, including portrait cropping.
  if(aspect<16/9){const width=1080*aspect;viewCamera.setViewOffset(1920,1080,(1920-width)/2,0,width,1080);}
  else if(aspect>16/9){const height=1920/aspect;viewCamera.setViewOffset(1920,1080,0,(1080-height)/2,1920,height);}
  viewCamera.updateProjectionMatrix();
}
function draw(t){
  const cycle=((t%DURATION)+DURATION)%DURATION,idx=mode==='auto'?Math.floor(cycle/SHOT):Number(mode);
  if(activeScene!==idx){activeScene=idx;resetView();}
  worlds.forEach((w,i)=>{w.root.visible=i===idx;});worlds[idx].updates.forEach(fn=>fn(cycle));scene.background.set(backgrounds[idx]);
  const cinematic=recording||$('#stage').classList.contains('lp');orbit.enabled=!cinematic;
  if(cinematic){
    const v=worlds[idx].view,angle=recording?recordingAzimuth+t*.08/SHOT:cameraAzimuth;
    const radius=Math.hypot(v.position[0]-v.target[0],v.position[2]-v.target[2]);
    setCoverProjection(filmCamera,recording?16/9:viewportAspect);
    filmCamera.position.set(v.target[0]+Math.sin(angle)*radius,v.position[1],v.target[2]+Math.cos(angle)*radius);
    filmCamera.lookAt(...v.target);
  }else orbit.update();
  renderer.render(scene,cinematic?filmCamera:camera);
}
function resize(){if(recording)return;const r=$('#stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);viewportAspect=r.width/r.height;setCoverProjection(camera,viewportAspect);draw(time);}
function deviceLayout(){
  const lp=$('#stage').classList.contains('lp'),mobile=lp&&$('#device').value!=='desktop';
  document.body.classList.toggle('phone-preview',mobile);$('#device-control').hidden=!lp;
  if(mobile){const [w,h]=$('#device').value.split('x').map(Number),heroHeight=Math.min(h,880);$('#stage').style.setProperty('--phone-width',`${w}px`);$('#stage').style.setProperty('--phone-ratio',`${w} / ${heroHeight}`);}
  resize();
}
window.addEventListener('resize',resize);resize();
function tick(now){if(playing&&!recording&&!document.hidden){const dt=Math.min((now-last)/1000,.1);time+=dt;if($('#stage').classList.contains('lp'))cameraAzimuth=(cameraAzimuth+dt*.08/SHOT*orbitSpeed)%(Math.PI*2);}last=now;if(!recording)draw(time);requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'一時停止':'再生';};
$('#overlay').onclick=()=>{const on=$('#stage').classList.toggle('lp');if(!on)resetView();$('#overlay').setAttribute('aria-pressed',String(on));$('#fast-orbit').hidden=!on;deviceLayout();};
$('#device').onchange=deviceLayout;
$('#fast-orbit').onclick=()=>{orbitSpeed=orbitSpeed===1?20:1;$('#fast-orbit').setAttribute('aria-pressed',String(orbitSpeed===20));};
$('#mode').onchange=e=>{mode=e.target.value;time=0;draw(time);};$('#reset').onclick=resetView;
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#poster').onclick=()=>{draw(time);canvas.toBlob(b=>{if(b)download(b,'industrial-poster.png');});};
$('#record').onclick=async()=>{
  if(!window.MediaRecorder||!canvas.captureStream){$('#status').textContent='動画書き出しは対応するChrome等でお試しください。';return;}
  const oldMode=mode,oldTime=time;recordingAzimuth=cameraAzimuth;recording=true;mode='auto';const controls=[...document.querySelectorAll('button,select')];controls.forEach(b=>b.disabled=true);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));let stream;
  try{
    renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);draw(0);stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:10000000}),chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});recorder.start();const start=performance.now();
    await new Promise(resolve=>{function frame(now){const elapsed=(now-start)/1000;draw(Math.min(elapsed,DURATION-.001));$('#status').textContent=`書き出し中 ${Math.min(DURATION,Math.floor(elapsed))} / ${DURATION}秒 — タブを前面に保ってください`;if(elapsed<DURATION)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    recorder.stop();await done;download(new Blob(chunks,{type:recorder.mimeType}),`industrial-motion.${recorder.mimeType.includes('mp4')?'mp4':'webm'}`);$('#status').textContent='18秒・1920 × 1080 の動画を保存しました';
  }catch(e){$('#status').textContent=`書き出せませんでした: ${e.message}`;}
  finally{stream?.getTracks().forEach(t=>t.stop());recording=false;mode=oldMode;time=oldTime;renderer.setPixelRatio(Math.min(devicePixelRatio,2));resize();controls.forEach(b=>b.disabled=false);}
};
