import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import './style.css';

const $ = s => document.querySelector(s);
const canvas = $('#scene');
let renderer;
try { renderer = new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true}); }
catch { $('#error').hidden=false; $('#error').textContent='このブラウザでは3D表示を初期化できませんでした。WebGL対応のブラウザで開いてください。'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new T.Scene();scene.background=new T.Color('#33423d');scene.fog=new T.Fog('#33423d',45,110);
const camera=new T.PerspectiveCamera(34,1,.1,160);
scene.add(new T.HemisphereLight('#e1f2eb','#394038',2.2));
const sun=new T.DirectionalLight('#fff1d3',4);sun.position.set(-14,24,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:20,bottom:-20,near:1,far:80});sun.shadow.bias=-.0004;scene.add(sun);
const rim=new T.DirectionalLight('#a4d4d2',2);rim.position.set(12,10,-16);scene.add(rim);
const mat=(color,metalness=0,roughness=.6)=>new T.MeshStandardMaterial({color,metalness,roughness});
const m={concrete:mat('#aaa99b'),edge:mat('#555e55'),steel:mat('#8b9993',.65,.34),dark:mat('#303e38',.5),green:mat('#467960',.35),light:mat('#dddcc8',.2),wood:mat('#ab8051'),box:mat('#ba9b70'),yellow:mat('#d3aa52',.25),glass:new T.MeshStandardMaterial({color:'#738f8d',metalness:.5,roughness:.22}),rubber:mat('#26332d'),white:mat('#ece4cc')};
function box(p,x,y,z,w,h,d,ma=m.light,round=0){const o=new T.Mesh(round?new RoundedBoxGeometry(w,h,d,2,round):new T.BoxGeometry(w,h,d),ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function cyl(p,x,y,z,r,h,ma=m.steel){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,16),ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function beam(p,a,b,r=.04,ma=m.steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=cyl(p,0,0,0,r,av.distanceTo(bv),ma);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function pallet(p,x,z,load=true){const g=new T.Group();g.position.set(x,.2,z);p.add(g);for(let i=0;i<5;i++)box(g,(i-2)*.25,.1,0,.2,.12,1.1,m.wood);for(let i=-1;i<=1;i++)box(g,i*.45,-.02,0,.12,.15,1.05,m.wood);if(load){box(g,0,.55,0,1.05,.8,.92,m.box,.02);box(g,0,.96,0,.05,.015,.92,m.light);box(g,0,.55,.466,.24,.16,.01,m.white);}return g;}
const worlds=[];const updates=[];
function base(){const g=new T.Group();scene.add(g);worlds.push(g);box(g,0,-.38,0,18,.7,12,m.edge,.15);box(g,0,-.015,0,17.85,.08,11.85,m.concrete);for(let x=-8;x<=8;x+=2)box(g,x,.032,0,.016,.004,11.7,m.edge);for(let z=-5;z<=5;z+=2)box(g,0,.035,z,17.8,.004,.016,m.edge);return g;}
function rail(p,x,z,w,d){for(let a=-1;a<=1;a+=2)for(let b=-1;b<=1;b+=2)beam(p,[x+a*w/2,.1,z+b*d/2],[x+a*w/2,1.2,z+b*d/2],.035,m.yellow);beam(p,[x-w/2,1.2,z-d/2],[x+w/2,1.2,z-d/2],.035,m.yellow);}
const factory=base();
// Open-sided production hall: columns, trusses, overhead services.
for(let x=-7;x<=7;x+=7){for(const z of [-4.5,4.5]){box(factory,x,2.7,z,.2,5.4,.2,m.steel);box(factory,x,.08,z,.5,.16,.5,m.dark);}box(factory,x,5.4,0,.16,.22,9.3,m.steel);for(let z=-4;z<4;z+=1)beam(factory,[x,5.3,z],[x,4.85,z+1],.035);}
for(const z of [-4.5,4.5]){box(factory,0,5.4,z,14.5,.24,.18,m.steel);box(factory,0,4.8,z,14,.09,.09,m.green);}
box(factory,0,5.45,0,14.5,.15,.28,m.light);
for(let x=-6;x<7;x+=3){box(factory,x,4.8,0,1.6,.06,.18,m.white);beam(factory,[x,5.4,0],[x,4.8,0],.025);}
box(factory,0,.7,1,12,.18,1.35,m.dark);for(let x=-5.8;x<6;x+=.25){let o=cyl(factory,x,.83,1,.09,1.25);o.rotation.x=Math.PI/2;}
for(let x=-5;x<=5;x+=2){box(factory,x,.35,.45,.08,.7,.08,m.steel);box(factory,x,.35,1.55,.08,.7,.08,m.steel);}
for(const x of [-4,0,4]){box(factory,x,1.15,-2,2.4,2.3,2,m.green,.08);box(factory,x,2.35,-2,2.15,.15,1.85,m.light);box(factory,x,1.5,-.98,1.7,1.1,.03,m.glass);box(factory,x+.85,1.05,-.93,.22,.5,.12,m.light);box(factory,x+.85,1.18,-.855,.12,.13,.015,m.dark);cyl(factory,x+.9,2.55,-2,.065,.24,m.yellow);for(let i=0;i<5;i++)box(factory,x-.6+i*.18,.5,-.97,.08,.32,.02,m.dark);}
const packages=[];for(let i=0;i<6;i++){const g=new T.Group();factory.add(g);box(g,0,1.07,1,.75,.35,.75,m.steel,.04);box(g,0,1.26,1,.5,.04,.5,m.dark);packages.push(g);}
updates.push(t=>packages.forEach((g,i)=>g.position.x=((i*2+t*.5)%12)-6));
for(let i=0;i<3;i++)pallet(factory,-6+i*1.5,3.7);rail(factory,5,-2,3,3);
// A small work station and neatly stacked trays add a human scale.
box(factory,6,1,3.5,2,.12,1,m.wood);for(const x of [5.2,6.8])box(factory,x,.5,3.5,.08,1,.8,m.steel);box(factory,6.4,1.4,3.5,.55,.4,.08,m.dark);for(let i=0;i<4;i++)box(factory,5.5,1.1+i*.03,3.5,.4,.025,.3,m.white);
const logistics=base();
for(const z of [-3.8,-1])for(const x of [-5,0,5]){for(const dx of [-1.8,1.8]){box(logistics,x+dx,2.3,z,.11,4.6,.13,m.green);box(logistics,x+dx,2.3,z+1.4,.11,4.6,.13,m.green);}for(let y=.2;y<4.6;y+=1.4){box(logistics,x,y,z+.7,3.7,.13,1.6,m.steel);for(let j=-1;j<=1;j++)box(logistics,x+j*1.05,y+.55,z+.7,.85,.95,1.1,m.box,.025);}beam(logistics,[x-1.8,.2,z],[x+1.8,4.5,z],.025);}
for(let x=-7;x<8;x+=2)box(logistics,x,.05,2.5,1,.015,.06,m.yellow);
const fork=new T.Group();logistics.add(fork);box(fork,0,.7,0,1.2,1.1,1.8,m.green,.12);box(fork,0,1.35,.35,1.15,.15,1,m.light);box(fork,0,1.4,.1,.6,.5,.5,m.dark);for(const x of [-.55,.55]){box(fork,x,1.9,.7,.06,1.7,.06,m.dark);box(fork,x,1.9,-.5,.06,1.7,.06,m.dark);for(const z of [-.5,.65]){const w=cyl(fork,x,.4,z,.32,.22,m.rubber);w.rotation.z=Math.PI/2;}}box(fork,0,2.75,.1,1.35,.12,1.55,m.dark);for(const x of [-.4,.4]){box(fork,x,1.25,-1,.08,2.5,.1,m.steel);box(fork,x,.35,-1.7,.15,.09,1.4,m.steel);}box(fork,0,.8,-1.6,.85,.8,.85,m.box);fork.rotation.y=-Math.PI/2;
updates.push(t=>{fork.position.set(Math.sin(t*Math.PI/12)*4,0,3.7);});
const construction=base();
for(let y=0;y<3;y++){for(const x of [-5,-1,3])for(const z of [-3,1])box(construction,x,1+y*2,z,.32,2,.32,m.concrete);box(construction,-1,2+y*2,-1,8.6,.22,4.6,m.concrete);if(y<2)for(let i=0;i<11;i++)box(construction,3.1-i*.3,2+y*2+.1+i*.17,1,.33,.16,1,m.concrete);}
for(let x=-5;x<4;x+=1)beam(construction,[x,6.2,-3],[x,7,-3],.022,m.steel);
const crane=new T.Group();crane.position.set(6,0,-2);construction.add(crane);for(const x of [-.4,.4])for(const z of [-.4,.4])beam(crane,[x,0,z],[x,9,z],.055,m.yellow);for(let y=.3;y<9;y+=.8){for(const z of [-.4,.4]){beam(crane,[-.4,y,z],[.4,y+.8,z],.035,m.yellow);beam(crane,[-.4,y,z],[.4,y,z],.035,m.yellow);}beam(crane,[-.4,y,-.4],[-.4,y+.8,.4],.035,m.yellow);}
const jib=new T.Group();jib.position.y=8.8;crane.add(jib);for(const z of [-.25,.25]){beam(jib,[-9,0,z],[3,0,z],.06,m.yellow);beam(jib,[-9,.55,z],[3,.55,z],.04,m.yellow);for(let x=-9;x<3;x+=.7)beam(jib,[x,0,z],[x+.7,.55,z],.028,m.yellow);}box(jib,2,.1,0,1.8,.6,.9,m.edge);box(jib,-.8,-.45,0,1.1,.8,.8,m.glass);beam(jib,[-5,0,0],[-5,-4,0],.025,m.dark);const cargo=box(jib,-5,-4.1,0,1.5,.28,1,m.steel);updates.push(t=>{jib.rotation.y=.12+Math.sin(t*Math.PI/12)*.17;});
for(let i=0;i<5;i++)box(construction,-5, .2+i*.16,4,3,.13,.65,m.steel);for(let i=0;i<3;i++)pallet(construction,i*1.5,4);rail(construction,-1,2,8.5,1);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),mat('#34453d'));ground.rotation.x=-Math.PI/2;ground.position.y=-.76;ground.receiveShadow=true;scene.add(ground);

let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,mode='auto',recording=false,last=performance.now();
$('#play').textContent=playing?'一時停止':'再生';
const names=['製造','物流','建設'];
function draw(t){const cycle=((t%24)+24)%24;const idx=mode==='auto'?Math.floor(cycle/8):Number(mode);worlds.forEach((g,i)=>g.visible=i===idx);updates.forEach(fn=>fn(cycle));const phase=mode==='auto'?(cycle%8)/8:cycle/24;const angle=.65+(phase-.5)*.16;camera.position.set(30*Math.sin(angle),21,30*Math.cos(angle));camera.lookAt(0,2.5,0);$('#industry').textContent=names[idx];renderer.render(scene,camera);}
function resize(){const r=$('#stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.fov=camera.aspect<.85?53:34;camera.updateProjectionMatrix();draw(time);}window.addEventListener('resize',resize);resize();
function tick(now){if(playing&&!recording&&!document.hidden)time+=Math.min((now-last)/1000,.1);last=now;if(!recording)draw(time);requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'一時停止':'再生';};$('#overlay').onclick=()=>{const on=$('#stage').classList.toggle('lp');$('#overlay').setAttribute('aria-pressed',String(on));};$('#mode').onchange=e=>{mode=e.target.value;time=0;draw(time);};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#poster').onclick=()=>{draw(time);canvas.toBlob(b=>{if(b)download(b,'industrial-poster.png');});};
$('#record').onclick=async()=>{if(!window.MediaRecorder||!canvas.captureStream){$('#status').textContent='このブラウザは動画書き出し非対応です。Chromeでお試しください。';return;}recording=true;const oldMode=mode,oldTime=time;mode='auto';const controls=[...document.querySelectorAll('button,select')];controls.forEach(b=>b.disabled=true);const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));let stream;try{renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);camera.aspect=16/9;camera.fov=34;camera.updateProjectionMatrix();draw(0);stream=canvas.captureStream(30);const recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:10000000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=reject;});recorder.start();const start=performance.now();await new Promise(resolve=>{function frame(now){const elapsed=(now-start)/1000;draw(Math.min(elapsed,23.999));$('#status').textContent=`書き出し中 ${Math.min(24,Math.floor(elapsed))} / 24秒 — このタブを開いたままにしてください`;if(elapsed<24)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});recorder.stop();await done;download(new Blob(chunks,{type:recorder.mimeType}),`industrial-3d-motion.${recorder.mimeType.includes('mp4')?'mp4':'webm'}`);$('#status').textContent='1920 × 1080 の動画を保存しました';}catch(e){$('#status').textContent=`書き出せませんでした: ${e.message}`;}finally{stream?.getTracks().forEach(t=>t.stop());recording=false;mode=oldMode;time=oldTime;renderer.setPixelRatio(Math.min(devicePixelRatio,2));resize();controls.forEach(b=>b.disabled=false);}};
