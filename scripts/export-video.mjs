// Deterministic video export. Headless Chrome renders every frame of the loop at a fixed
// timestep through the page's `?export` hook; ffmpeg encodes the PNG stream to MP4 and WebM.
// Encoding targets a lightweight hero background video: 720p, H.264 crf 26 capped at 3 / 2 Mbps, VP9 crf 36.
// Raise the target sizes or lower the crf values for more quality at the cost of file size.
// Usage: npm run export [-- 16x9|9x16]
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const FPS=30,OUT='export',POSTER_TIME=1;
const targets=[{name:'16x9',width:1280,height:720,maxrate:'3M'},{name:'9x16',width:720,height:1280,maxrate:'2M'}];
const wanted=process.argv.slice(2),selected=targets.filter(t=>!wanted.length||wanted.includes(t.name));
if(!selected.length){console.error(`unknown target ${wanted.join(' ')}; use 16x9 or 9x16`);process.exit(1);}
mkdirSync(OUT,{recursive:true});

const server=await createServer({server:{port:0,host:'127.0.0.1'},logLevel:'silent'});
await server.listen();
const url=`${server.resolvedUrls.local[0]}?export`;
const browser=await puppeteer.launch({channel:'chrome',headless:true,args:['--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--hide-scrollbars']});
try{
  const page=await browser.newPage();
  page.on('pageerror',e=>console.error('page error:',e.message));
  await page.goto(url,{waitUntil:'networkidle0'});
  await page.waitForFunction('window.__industrial');
  const info=await page.evaluate(()=>({duration:window.__industrial.duration,gpu:window.__industrial.gpu,shots:window.__industrial.shots}));
  const frames=Math.round(info.duration*FPS);
  console.log(`renderer: ${info.gpu}\nloop: ${info.duration}s, ${frames} frames at ${FPS}fps, shots: ${info.shots.join(' / ')}`);
  const grab=(t,w,h)=>page.evaluate((t,w,h)=>window.__industrial.frame(t,w,h),t,w,h).then(d=>Buffer.from(d.slice(d.indexOf(',')+1),'base64'));
  for(const target of selected){
    await page.setViewport({width:target.width,height:target.height,deviceScaleFactor:1});
    const base=`${OUT}/industrial-motion-${target.name}`,started=Date.now();
    writeFileSync(`${base}.png`,await grab(POSTER_TIME,target.width,target.height));
    const ffmpeg=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-i','pipe:0',
      '-c:v','libx264','-preset','slow','-crf','26','-maxrate',target.maxrate,'-bufsize',`${parseInt(target.maxrate)*2}M`,'-pix_fmt','yuv420p','-movflags','+faststart',`${base}.mp4`,
      '-c:v','libvpx-vp9','-crf','36','-b:v','0','-row-mt','1','-deadline','good','-cpu-used','2','-pix_fmt','yuv420p',`${base}.webm`],
      {stdio:['pipe','inherit','inherit']});
    const finished=new Promise((resolve,reject)=>{ffmpeg.on('close',code=>code===0?resolve():reject(new Error(`ffmpeg exited with ${code}`)));ffmpeg.on('error',reject);});
    for(let i=0;i<frames;i++){
      const png=await grab(i/FPS,target.width,target.height);
      if(!ffmpeg.stdin.write(png))await new Promise(r=>ffmpeg.stdin.once('drain',r));
      if(i%FPS===0||i===frames-1)process.stdout.write(`\r${target.name}: ${i+1}/${frames} frames, ${((Date.now()-started)/1000).toFixed(0)}s`);
    }
    ffmpeg.stdin.end();await finished;
    console.log(`\n${base}.mp4 / ${base}.webm / ${base}.png (poster at ${POSTER_TIME}s)`);
  }
}finally{await browser.close();await server.close();}
