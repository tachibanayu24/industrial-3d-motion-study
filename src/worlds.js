import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Shared meter-scale modeling vocabulary. No external assets or brand material.
const material=(color,metalness=0,roughness=.65)=>new T.MeshStandardMaterial({color,metalness,roughness});
const m={floor:material('#b6b3a4'),wall:material('#d6d7c7'),steel:material('#91a7a5',.65,.32),dark:material('#324843',.35),green:material('#487864',.25),blue:material('#425f73'),water:material('#327e91',.55,.23),wood:material('#997b55'),box:material('#bca479'),rubber:material('#24322f'),yellow:material('#dcb25e'),white:material('#eeeade'),glass:material('#7bb3ba',.55,.22),skin:material('#ba9275'),orange:material('#cd8150'),road:material('#586462'),grass:material('#789078'),red:material('#b86457')};
function mesh(parent,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(p,x,y,z,w,h,d,mat=m.wall,r=0){return mesh(p,r?new RoundedBoxGeometry(w,h,d,2,r):new T.BoxGeometry(w,h,d),mat,x,y,z);}
function cylinder(p,x,y,z,r,h,mat=m.steel){return mesh(p,new T.CylinderGeometry(r,r,h,12),mat,x,y,z);}
function ball(p,x,y,z,xr,yr,zr,mat){const o=mesh(p,new T.SphereGeometry(1,12,8),mat,x,y,z);o.scale.set(xr,yr,zr);return o;}
function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
function beam(p,a,b,r=.035,mat=m.steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const o=cylinder(p,0,0,0,r,av.distanceTo(bv),mat);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function rail(p,x,z,length,y=0){for(let i=0;i<=length;i+=1.5)beam(p,[x+i,y,z],[x+i,y+1,z]);beam(p,[x,y+1,z],[x+length,y+1,z]);beam(p,[x,y+.5,z],[x+length,y+.5,z]);}
function crate(p,x,y,z,fish=false){box(p,x,y+.16,z,.8,.32,.55,fish?m.blue:m.box,.025);box(p,x,y+.33,z,.72,.025,.47,fish?m.dark:m.wood);if(fish)for(let i=0;i<4;i++){const f=ball(p,x-.25+i*.17,y+.38,z,.055,.04,.18,m.steel);f.rotation.y=.2;}else{box(p,x,y+.34,z,.035,.012,.55,m.white);box(p,x,y+.17,z+.279,.23,.11,.008,m.white);}}
function pallet(p,x,z,rows=2){for(let i=0;i<5;i++)box(p,x-.5+i*.25,.16,z,.19,.1,1.2,m.wood);for(let i=-1;i<=1;i++)box(p,x+i*.45,.06,z,.13,.15,1.1,m.wood);for(let y=0;y<rows;y++)for(const dz of [-.3,.3])crate(p,x,.23+y*.34,z+dz);}
function wheel(p,x,z,r=.4,y=.45){const w=cylinder(p,x,y,z,r,.22,m.rubber);w.rotation.z=Math.PI/2;const hub=cylinder(p,x*1.025,y,z,r*.5,.24,m.steel);hub.rotation.z=Math.PI/2;}
function person(p,updates,{x=0,z=0,y=0,rot=0,coat=m.blue,hat=m.yellow,pose='work',phase=0}={}){
  const g=group(p,x,y,z);g.rotation.y=rot;
  const seated=pose==='sit';const hips=seated?.6:.86;
  box(g,0,hips+.28,0,.43,.56,.25,coat,.075);box(g,0,hips,0,.37,.18,.24,coat,.04);
  cylinder(g,0,hips+.62,0,.065,.13,m.skin);ball(g,0,hips+.79,0,.14,.18,.135,m.skin);
  if(hat){ball(g,0,hips+.9,0,.17,.09,.16,hat);box(g,0,hips+.88,.1,.35,.025,.2,hat,.02);}
  for(const s of [-1,1]){const leg=group(g,s*.12,hips,0);if(seated){beam(leg,[0,0,0],[0,-.1,.36],.085,coat);beam(leg,[0,-.1,.36],[0,-.55,.36],.068,coat);box(leg,0,-.58,.43,.17,.12,.3,m.rubber,.03);}else{beam(leg,[0,0,0],[s*.025,-.39,.015],.085,coat);beam(leg,[s*.025,-.39,.015],[s*.05,-.75,.04],.065,coat);box(leg,s*.05,-.81,.11,.18,.14,.32,m.rubber,.03);}}
  const arms=[];for(const s of [-1,1]){const a=group(g,s*.24,hips+.47,0);beam(a,[0,0,0],[s*.06,-.28,.08],.065,coat);beam(a,[s*.06,-.28,.08],[s*.04,-.34,.34],.055,coat);ball(a,s*.04,-.34,.37,.062,.07,.065,m.skin);arms.push(a);}
  if(pose==='clipboard'){box(g,0,hips+.04,.43,.35,.035,.38,m.dark);box(g,0,hips+.065,.43,.3,.01,.32,m.white);}
  if(pose==='carry')crate(g,0,hips-.14,.52);
  updates.push(t=>{arms[0].rotation.x=.09*Math.sin(t*Math.PI/3+phase);arms[1].rotation.x=.07*Math.sin(t*Math.PI/3+phase+.8);g.rotation.z=.012*Math.sin(t*Math.PI/3+phase);});
  return g;
}
function truck(p,x,z,rot=0,small=false){const g=group(p,x,0,z);g.rotation.y=rot;const len=small?3.2:5;
  box(g,0,.63,0,2,.23,len+2,m.dark);box(g,0,1.95,-.75,2.2,2.25,len,m.white,.08);box(g,0,1.32,len/2+.55,2,1.85,1.65,m.green,.14);box(g,0,1.85,len/2+1.39,1.65,.7,.025,m.glass,.03);box(g,0,.7,len/2+1.4,2,.18,.1,m.steel);
  for(const xx of [-.7,.7])box(g,xx,1,len/2+1.41,.35,.18,.035,m.white);for(const xx of [-1.08,1.08])for(const zz of [-len/2+.2,len/2+.5])wheel(g,xx,zz);for(let i=0;i<12;i++)box(g,1.106,1.9,-len/2+i*len/12,.025,2,.02,m.steel);box(g,0,2.9,len/2-.8,.9,.32,.65,m.steel);return g;}
function forklift(p,updates,x,z,animate=true){
  const g=group(p,x,0,z);g.rotation.y=-Math.PI/2;
  box(g,0,.65,0,1.2,.95,1.7,m.orange,.12);box(g,0,1.12,0,.6,.12,.6,m.rubber);
  const carriage=group(g);carriage.name='fork-carriage';
  for(const xx of [-.57,.57]){
    for(const zz of [-.6,.6])wheel(g,xx,zz,.28,.3);
    for(const zz of [-.55,.65])beam(g,[xx,1,zz],[xx,2.55,zz],.035,m.dark);
    box(g,xx,1.2,1,.075,2.3,.1,m.steel);box(carriage,xx,.25,1.6,.12,.08,1.2,m.steel);
  }
  box(g,0,2.57,0,1.35,.1,1.6,m.dark);person(g,updates,{y:.55,pose:'sit',hat:m.yellow});
  const load=group(carriage,0,.3,1.6);load.name='fork-load';pallet(load,0,0,2);
  if(animate)updates.push(t=>g.position.x=x+Math.sin(t*Math.PI/9)*1.6);return g;
}
function tree(p,x,z,size=1){cylinder(p,x,1*size,z,.13,2*size,m.wood);ball(p,x,2.5*size,z,1.1*size,1.5*size,1.05*size,m.grass);}
function surface(p,w=36,d=26,mat=m.floor){box(p,0,-.24,0,w,.45,d,mat,.12);}
function shed(p,x,z,w,d){box(p,x,2.7,z-d/2,w,5.4,.2,m.wall);for(const xx of [-w/2,w/2])box(p,x+xx,2.7,z,.18,5.4,d,m.wall);for(let xx=-w/2;xx<=w/2;xx+=3){box(p,x+xx,2.7,z+d/2,.15,5.4,.15,m.steel);beam(p,[x+xx,5.4,z-d/2],[x+xx,5.4,z+d/2],.08);for(let zz=-d/2;zz<d/2;zz+=1.5)beam(p,[x+xx,5.4,z+zz],[x+xx,4.95,z+zz+1.5],.025);}for(let i=0;i<w;i+=.5)box(p,x-w/2+i,3,z-d/2+.12,.03,4.4,.03,m.steel);box(p,x,5.5,z-d*.35,w+.3,.14,d*.3,m.green);for(let xx=-w/2;xx<w/2;xx+=.4)box(p,x+xx,5.6,z-d*.35,.025,.04,d*.3,m.steel);}
function factory(){const root=new T.Group(),updates=[];surface(root,36,27);shed(root,0,-3,32,19);
  // One line mesh covers the complete floor, including the utility and shipping areas.
  const floorLines=[];
  for(let n=-300;n<=300;n+=2)floorLines.push(n,.028,-300,n,.028,300,-300,.028,n,300,.028,n);
  const floorGrid=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(floorLines,3)),new T.LineBasicMaterial({color:'#7d8c87',transparent:true,opacity:.48}));
  floorGrid.name='full-floor-grid';root.add(floorGrid);
  for(const z of [-6,1]){box(root,0,.9,z,23,.22,1.5,m.dark);for(let x=-11;x<12;x+=.3){const r=cylinder(root,x,1.06,z,.1,1.4);r.rotation.x=Math.PI/2;}for(let x=-10;x<12;x+=2)for(const dz of [-.55,.55])box(root,x,.45,z+dz,.08,.9,.08,m.steel);
    for(const x of [-6,2,8]){box(root,x,1.9,z,2.6,1.55,2.2,m.steel,.09);box(root,x,2.75,z,2.3,.15,2,m.white);box(root,x,2.15,z+1.11,1.7,.8,.025,m.glass);box(root,x+1,1.9,z+1.17,.35,.5,.12,m.dark);box(root,x+1,2.02,z+1.24,.25,.2,.02,m.glass);for(let j=0;j<5;j++)box(root,x-.9+j*.22,1.38,z+1.12,.1,.2,.025,m.dark);cylinder(root,x,3.25,z,.28,.85,m.steel);beam(root,[x,3.7,z],[x,4.5,z],.14);}
    const trays=[];for(let i=0;i<12;i++){const g=group(root);box(g,0,1.23,z,.68,.13,.95,m.white,.035);for(let j=0;j<3;j++)ball(g,0,1.34,z-.28+j*.28,.23,.07,.1,m.orange);trays.push(g);}updates.push(t=>trays.forEach((g,i)=>g.position.x=((i*2+t*2/3)%24)-12));
  }
  for(const x of [-13,-10]){cylinder(root,x,2.2,-10,1.1,3.7,m.steel);ball(root,x,4.05,-10,1.1,.35,1.1,m.steel);for(const z of [-10.6,-9.4])beam(root,[x,.2,z],[x,1,z],.08);beam(root,[x,3.8,-10],[x,4.4,-10],.12);beam(root,[x,4.4,-10],[x,4.4,1],.12);}
  for(let x=-14;x<16;x+=5){box(root,x,5.45,-3,.1,.18,19,m.steel);for(const z of [-7,0,5]){beam(root,[x,5.4,z],[x,4.9,z],.025);box(root,x,4.88,z,2.6,.055,.3,m.white);}}
  for(let x=-8;x<9;x+=4){box(root,x,1,6,2.5,.13,1.4,m.steel);for(const dx of [-1,1])for(const dz of [-.5,.5])beam(root,[x+dx,0,6+dz],[x+dx,1,6+dz],.04);crate(root,x,1.1,6);}
  for(let x=11;x<16;x+=1.5)for(const z of [7,9.2])pallet(root,x,z,3);
  person(root,updates,{x:-7,z:-4.3,coat:m.white,hat:m.white,rot:Math.PI,phase:0});person(root,updates,{x:3,z:2.6,coat:m.white,hat:m.white,rot:Math.PI,phase:1});person(root,updates,{x:-4,z:7,coat:m.white,hat:m.white,rot:Math.PI,pose:'clipboard',phase:2});person(root,updates,{x:4,z:7,coat:m.white,hat:m.white,rot:Math.PI,pose:'work',phase:3});person(root,updates,{x:11,z:5,coat:m.blue,hat:m.white,pose:'carry',phase:1});return {root,updates};
}
const ribGeometry=new T.BoxGeometry(.035,2.45,.055);
function container(p,x,y,z,color=m.blue){
  box(p,x,y+1.3,z,2.5,2.6,6,color);
  const ribs=new T.InstancedMesh(ribGeometry,m.steel,20),matrix=new T.Matrix4();let i=0;
  for(let k=0;k<10;k++)for(const side of [-1,1])ribs.setMatrixAt(i++,matrix.makeTranslation(x+side*1.26,y+1.3,z-2.7+k*.6));
  ribs.castShadow=false;ribs.receiveShadow=true;p.add(ribs);
  for(const dx of [-.65,.65])beam(p,[x+dx,y+.1,z+3.02],[x+dx,y+2.5,z+3.02],.03);
}
function expandedFactory(){const result=factory(),p=result.root,u=result.updates;
  // Lower cutaway walls keep the process annex visible from the review camera.
  for(const o of p.children){if(o.isMesh && o.geometry.parameters?.height===5.4){const width=o.geometry.parameters.width,depth=o.geometry.parameters.depth;if(width===32 || (width===.18 && depth===19)){o.scale.y=.16;o.position.y=.43;}}}
  // Dedicated rear utility annex: tanks, mixers, heat exchange and pipework.
  box(p,0,-.22,-18,36,.45,12,m.floor);
  for(const x of [-12,-7,-2]){cylinder(p,x,2.8,-18,1.6,4.4,m.steel);ball(p,x,5,-18,1.6,.6,1.6,m.steel);ball(p,x,.6,-18,1.6,.5,1.6,m.steel);for(const dx of [-1,1])beam(p,[x+dx,.1,-18],[x+dx,1.5,-18],.09);beam(p,[x,5.5,-18],[x,6.2,-18],.16);beam(p,[x,6.2,-18],[x,6.2,-8],.16);cylinder(p,x+.6,1.6,-16.5,.2,.3,m.green);}
  for(const x of [5,10]){cylinder(p,x,1.8,-18,1.3,2.5,m.steel);box(p,x,3.3,-18,1,.6,.8,m.green);beam(p,[x,3,-18],[x,1,-18],.09);box(p,x,1.3,-16.5,.7,.8,.3,m.dark);box(p,x,1.5,-16.32,.5,.3,.015,m.glass);}
  box(p,15,1.8,-18,2.5,3.2,5,m.steel,.1);for(let z=-20;z<-16;z+=.25)box(p,16.27,1.8,z,.07,2.8,.08,m.dark);
  const shipping=group(p,0,0,-3);shipping.name='factory-logistics';
  box(shipping,24,-.2,0,12,.4,35,m.floor);for(const z of [-12,-7]){for(const x of [21,26]){for(const dx of [-1.6,1.6])box(shipping,x+dx,2.2,z,.1,4.4,1.4,m.green);for(let y=.25;y<4;y+=1.3){box(shipping,x,y,z,3.4,.1,1.5,m.steel);for(const dx of [-1,0,1])crate(shipping,x+dx,y+.1,z);}}}
  // Open ceiling: expose the process machinery, retain only the structural frame.
  for(const o of [...p.children]){const q=o.geometry?.parameters;if(q && ((q.height===.14 && q.depth===19*.3)||(q.height===.04 && q.depth===19*.3)||(q.height===4.4&&q.width===.03)))p.remove(o);}
  const lift=forklift(shipping,u,23,-2,false);lift.name='transfer-forklift';lift.rotation.y=0;
  const load=lift.getObjectByName('fork-load');
  const waiting=group(shipping,23,0,-.4);pallet(waiting,0,0,2);
  const delivered=group(shipping,23,.12,8.8);delivered.name='delivered-pallet';pallet(delivered,0,0,2);
  u.push(t=>{const s=((t%6)+6)%6;const travel=s<.6?0:s<2.8?(s-.6)/2.2:s<3.4?1:s<5.6?1-(s-3.4)/2.2:0;lift.position.z=-2+9.2*travel;lift.getObjectByName('fork-carriage').position.y=-.18*travel;load.visible=s>=.35&&s<3.2;waiting.visible=s<.35||s>5.8;delivered.visible=s>=3.2&&s<5.8;});
  person(shipping,u,{x:27,z:5,pose:'clipboard',coat:m.blue});for(const z of [6,9])pallet(shipping,27,z,3);
  // Indoor transfer: a pallet staging bay and storage rack replace the truck.
  box(shipping,23,.035,8.8,3.4,.07,2.8,m.dark);
  for(const x of [21.3,24.7])box(shipping,x,.08,8.8,.08,.02,3,m.yellow);
  for(const z of [7.3,10.3])box(shipping,23,.08,z,3.5,.02,.08,m.yellow);
  for(const x of [20,26])box(shipping,x,2,12,.12,4,1.6,m.green);
  for(const y of [.15,1.65,3.15]){box(shipping,23,y,12,6,.1,1.8,m.steel);for(const x of [21,23,25])crate(shipping,x,y+.08,12);}
  box(p,0,-.24,0,600,.45,600,m.floor).name='frame-ground';
  // Low cutaway partitions keep the interior readable from all azimuths.
  box(p,0,.45,-25,90,.9,.25,m.wall);
  for(const x of [32,35,38]){box(p,x,1.3,-18,2.3,2.6,1,m.steel);box(p,x,1.7,-17.48,.8,.5,.03,m.dark);}
  for(const x of [-23,35])for(const z of [-21,-13]){
    box(p,x,.8,z,4,1.6,2.3,m.white);box(p,x,1.7,z,4,.15,2.3,m.steel);
  }
  return {...result,view:{position:[27.4,16.59,14.21],target:[9.5,1,-6]}};
}
export function createWorlds(scene){
  const worlds=[workingPort(),expandedFactory(),neighborhood()];
  surroundPort(worlds[0]);surroundFactory(worlds[1]);surroundNeighborhood(worlds[2]);
  for(const w of worlds){
    const {position:p,target:t}=w.view;
    p[1]=t[1]+Math.hypot(p[0]-t[0],p[2]-t[2])*Math.tan(Math.PI/6);
    scene.add(w.root);
  }
  return worlds;
}

// Peripheral sets are deliberately low-detail. Shared geometry/materials and
// instancing keep repetitive architecture cheap even when the camera turns.
function contextBuilding(p,x,z,w,d,h,kind=0){
  const g=group(p,x,0,z);
  box(g,0,h/2,0,w,h,d,kind===1?m.white:m.wall);
  box(g,0,h+.18,0,w+.6,.36,d+.6,kind===2?m.blue:m.steel);
  if(kind===0){
    for(const side of [-1,1])for(const dx of [-w*.28,w*.28]){box(g,dx,2.1,side*(d/2+.06),w*.24,4.2,.1,m.dark);box(g,dx,h-1.4,side*(d/2+.08),w*.3,.9,.1,m.glass);}
    box(g,0,h+.6,0,w*.65,.2,2,m.glass);
  }else{
    // A single instanced batch for windows on all four facades.
    const transforms=[];
    for(let y=2;y<h-1;y+=3){for(const side of [-1,1]){
      for(let xx=-w/2+2;xx<w/2-1;xx+=3.5)transforms.push([xx,y,side*(d/2+.04),0]);
      for(let zz=-d/2+2;zz<d/2-1;zz+=3.5)transforms.push([side*(w/2+.04),y,zz,Math.PI/2]);
    }}
    const windows=new T.InstancedMesh(new T.BoxGeometry(1.8,1.4,.06),m.glass,transforms.length),dummy=new T.Object3D();
    transforms.forEach(([xx,y,zz,rot],i)=>{dummy.position.set(xx,y,zz);dummy.rotation.y=rot;dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);});g.add(windows);
  }
  return g;
}
function surroundPort(w){
  const p=w.root,u=w.updates;
  // A working harbor basin: the opposite bank and side piers stay in view when
  // orbiting toward the sea, rather than revealing an empty ocean backdrop.
  const south=group(p,0,1.1,148);
  box(south,0,-1.2,0,430,2.4,94,m.floor);
  box(south,0,-.4,-47,430,2,.6,m.dark);
  box(south,0,.14,-22,430,.28,11,m.road);
  for(let x=-180;x<200;x+=12)box(south,x,.31,-22,4,.02,.15,m.white);
  for(const [x,z,width,depth,height,kind] of [[-135,13,66,45,16,0],[-48,14,60,44,13,0],[37,17,52,45,18,1],[115,17,60,40,12,0]])contextBuilding(south,x,z,width,depth,height,kind);
  for(const x of [-95,-10,75]){
    truck(south,x,-30,Math.PI/2);for(let k=0;k<4;k++)container(south,x+k*2.8,0,-36,m.blue);
  }
  for(const side of [-1,1]){
    const pier=group(p,side*180,1.1,25);
    if(side<0){
      box(pier,0,-1.2,0,36,2.4,158,m.floor);contextBuilding(pier,0,25,25,55,11,0);
      for(const z of [-35,-15,65]){cylinder(pier,0,4,z,4,8,m.steel);ball(pier,0,8,z,4,.7,4,m.steel);}
    }else{
      // Open the eastern bank from world z=-24 to z=65: a 89m navigation entrance.
      box(pier,0,-1.2,-64,36,2.4,30,m.floor);
      box(pier,0,-1.2,60,36,2.4,40,m.floor);
      contextBuilding(pier,0,59,25,30,11,0);
      for(const [z,color] of [[-49,m.red],[40,m.green]]){cylinder(pier,-17,2,z,.35,4,m.white);ball(pier,-17,4.2,z,.5,.5,.5,color);}
    }
    for(let z=-45;z<100;z+=12)if(side<0||z<=-25||z>=66)cylinder(p,side*161,1.4,z,.22,.6,m.dark);
  }
  for(const [x,z,rot] of [[-73,77,Math.PI/2],[89,76,-Math.PI/2]]){
    const ship=group(p,x,0,z);ship.rotation.y=rot;vesselHull(ship,58,10,3.2,m.blue);
    box(ship,0,5,-19,8,3.6,8,m.white);box(ship,0,5.3,-14.96,7,1.2,.06,m.glass);
    for(const xx of [-2.8,0,2.8])for(const zz of [-8,0,8,16])container(ship,xx,3.3,zz,m.green);
    u.push(t=>ship.position.y=.04*Math.sin(t*Math.PI/3+x));
  }
  for(const [x,z,width,depth,height,kind] of [[-75,-173,52,42,15,1],[15,-185,80,45,18,0],[123,-177,63,40,13,0]])contextBuilding(p,x,z,width,depth,height,kind).position.y=1.1;
}
function surroundFactory(w){
  const p=w.root,u=w.updates;
  // Connected packing cells fill the working floor, leaving the forklift aisle
  // at x=23 clear. Low equipment keeps both the people and process visible.
  for(const [x,z] of [[-12,14],[1,14],[12,19],[-23,-3]]){
    const cell=group(p,x,0,z);
    box(cell,0,1,0,8,.18,1.6,m.steel);
    for(let dx=-3.6;dx<4;dx+=.6){const roller=cylinder(cell,dx,1.14,0,.07,1.4,m.steel);roller.rotation.x=Math.PI/2;}
    for(const dx of [-3,3])box(cell,dx,.5,0,.1,1,1.3,m.steel);
    // Sealer, inspection terminal and finished cases share a continuous conveyor.
    box(cell,1,1.8,0,2.2,1.4,2,m.steel,.05);box(cell,1,2.15,.99,1.3,.5,.05,m.glass);
    box(cell,-2,.82,2.5,3,.13,1.3,m.steel);for(const dx of [-3,-1])box(cell,dx,.4,2.5,.08,.8,1.1,m.steel);
    crate(cell,-3,1.22,0);crate(cell,-1.7,1.22,0);crate(cell,3,1.22,0);
    person(cell,u,{x:-2,z:3.5,rot:Math.PI,coat:m.white,hat:m.white,pose:'work'});
    // A wheeled ingredient bin and a pallet-sized output stack, not loose clutter.
    box(cell,-4,.65,2.6,.85,1.1,.85,m.steel,.08);for(const dx of [-4.35,-3.65])for(const dz of [2.25,2.95])wheel(cell,dx,dz,.09,.12);
    pallet(cell,4,2.6,2);
  }
  // Short cross-conveyors join packing cells; pipe racks link processing tanks.
  for(const x of [-12,1]){box(p,x,1.05,10.1,1.2,.18,6,m.steel);for(const z of [8,11.5])box(p,x,.5,z,1,.95,.08,m.steel);}
  for(const z of [-22,21]){
    for(const x of [-32,-16,0,16,40])beam(p,[x,0,z],[x,5.7,z],.065,m.steel);
    for(const y of [5.5,5.8])beam(p,[-32,y,z],[40,y,z],.1,m.steel);
  }
  // Ingredient storage and sanitation stations around the production floor.
  for(const [x,z] of [[-22,-20],[-22,8],[33,-7],[32,13]]){
    const rack=group(p,x,0,z);
    for(const dx of [-2,2])box(rack,dx,1.65,0,.1,3.3,1.5,m.steel);
    for(const y of [.2,1.25,2.3]){box(rack,0,y,0,4.2,.08,1.6,m.steel);for(const dx of [-1.3,0,1.3])crate(rack,dx,y+.08,0);}
  }
  for(const [x,z] of [[-18,-27],[18,-27]]){
    box(p,x,.9,z,3,1.8,1.4,m.steel);box(p,x,1.84,z,2.7,.06,1.1,m.dark);
    beam(p,[x,1.8,z-.4],[x,2.3,z-.4],.035,m.steel);beam(p,[x,2.3,z-.4],[x,2.3,z+.2],.035,m.steel);
  }
  // Processing islands around the original lines: tanks, packaging and cold
  // storage. Keep the central shipping aisle unobstructed.
  for(const [x,z,kind] of [[-31,-13,0],[-32,5,1],[-20,24,1],[-4,27,0],[13,27,1],[40,17,2],[44,-1,1],[43,-19,0],[23,-35,2],[5,-38,0],[-16,-37,2],[-34,-34,1]]){
    const g=group(p,x,0,z);
    if(kind===0){
      for(const dx of [-2.1,2.1]){cylinder(g,dx,2,0,1.5,4,m.steel);ball(g,dx,4,0,1.5,.5,1.5,m.steel);beam(g,[dx,4.5,0],[dx,5,0],.1);}
      beam(g,[-2.1,5,0],[2.1,5,0],.12);box(g,0,1,2.3,1.5,2,.5,m.dark);
    }else if(kind===1){
      box(g,0,1,0,10,.25,1.8,m.steel);box(g,0,2,0,3,1.8,2.5,m.steel,.08);
      box(g,0,2.3,1.27,2,.7,.06,m.glass);
      for(const dx of [-4,4]){box(g,dx,.5,0,.12,1,1.6,m.dark);crate(g,dx,1.2,0);}
    }else{
      box(g,0,2,0,9,4,5,m.white);for(const dx of [-2.5,2.5]){box(g,dx,1.8,2.54,3.5,3.4,.08,m.steel);box(g,dx,2.2,2.6,2,.7,.05,m.glass);}
      box(g,0,4.3,0,5,.6,2,m.steel);
    }
  }
  // Perimeter structure and low partitions suggest a full hall without opaque
  // walls hiding the action when the camera passes behind it.
  for(const x of [-47,55])for(let z=-48;z<=42;z+=15){box(p,x,3.5,z,.2,7,.2,m.steel);beam(p,[x,7,z],[x,7,Math.min(z+15,42)],.08);}
  for(const z of [-48,42]){box(p,4,.5,z,102,1,.2,m.wall);for(let x=-46;x<=54;x+=20){box(p,x,3.5,z,.2,7,.2,m.steel);box(p,x,6,z,9,.1,1.2,m.white);}}
  for(const [x,z] of [[-73,-63],[0,-80],[75,-64],[85,0],[73,63],[0,76],[-73,63],[-82,0]]){
    contextBuilding(p,x,z,32,25,6,0);
    for(const dx of [-8,8]){box(p,x+dx,1.4,z+17,5,2.8,4,m.steel);box(p,x+dx,2.9,z+17,5,.2,4,m.white);}
  }
}
function surroundNeighborhood(w){
  const p=w.root;
  // Surrounding blocks leave the central crossroads and its sightlines open.
  // Lots include their paving and tree crowns. Keep them wholly inside blocks:
  // main roads x=9 / z=4, outer roads x=-72,73 / z=-76,61.
  for(const [x,z,width,depth,height,kind] of [[-104,-104,37,30,10,0],[-38,-105,42,32,12,0],[35,-107,27,27,15,1],[43,-145,31,28,12,1],[103,-46,34,29,10,0],[102,30,29,30,9,1],[104,92,32,27,12,1],[43,88,28,24,8,2],[-19,88,26,25,9,2],[-42,126,33,24,10,1],[-102,31,31,30,9,0],[-101,-32,27,30,12,1]]){
    box(p,x,-.005,z,width+8,.08,depth+8,m.floor);contextBuilding(p,x,z,width,depth,height,kind);
    for(const side of [-1,1])tree(p,x+side*(width/2+2),z+depth/2+2,1.1);
  }
  for(const z of [-76,61]){
    box(p,0,.03,z,240,.08,9,m.road);
    for(let x=-110;x<120;x+=7)if(x<1||x>18)box(p,x,.095,z,3,.015,.12,m.white);
  }
  for(const x of [-72,73]){box(p,x,.035,-4,8,.08,190,m.road);for(let z=-90;z<90;z+=7)if(z<-4||z>12)box(p,x,.1,z,.12,.015,3,m.white);}
  // Small parking courts and planted setbacks are cheaper than more buildings.
  for(const [x,z] of [[-52,46],[56,-56],[-54,-59]]){
    box(p,x,.035,z,17,.08,12,m.road);
    for(let dx=-7;dx<=7;dx+=3.5)box(p,x+dx,.1,z,.1,.02,10,m.white);
    box(p,x,.7,z-7,17,1.4,1.3,m.green,.15);
  }
}

// Hull sections are modeled in X/Z directly, avoiding the mirrored deck/bow
// mismatch caused by rotating a 2D extrusion. Dimensions use meters.
function vesselHull(p,length,width,depth,mat){
  const outline=[[-.38,-.5],[.38,-.5],[.5,-.4],[.5,.27],[.39,.4],[.2,.48],[0,.54],[-.2,.48],[-.39,.4],[-.5,.27],[-.5,-.4]];
  const vertices=[],indices=[],n=outline.length;
  for(const [scale,y] of [[.7,-.7],[.93,depth*.4],[1,depth]])for(const [x,z] of outline)vertices.push(x*width*scale,y,z*length);
  for(let r=0;r<2;r++)for(let i=0;i<n;i++){const j=(i+1)%n,a=r*n+i,b=r*n+j;indices.push(a,b,a+n,b,b+n,a+n);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const hull=mesh(p,geo,mat);hull.material=mat.clone();hull.material.side=T.DoubleSide;
  const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x*width,-z*length):shape.moveTo(x*width,-z*length));shape.closePath();
  const deckGeo=new T.ShapeGeometry(shape);deckGeo.rotateX(-Math.PI/2);mesh(p,deckGeo,m.floor,0,depth+.015,0);
  for(let i=0;i<n;i++){const a=outline[i],b=outline[(i+1)%n];beam(p,[a[0]*width,depth+.1,a[1]*length],[b[0]*width,depth+.1,b[1]*length],.065,m.white);}
  return hull;
}
function fishingVessel(p,u,x,z,index){
  const g=group(p,x,0,z);g.name=`fishing-${index}`;g.rotation.y=index===1?.12:-.06;
  vesselHull(g,15,4.6,1.5,index===1?m.white:m.blue);
  // Enclosed wheelhouse aft, working deck forward, winch and net drum.
  box(g,0,2.7,-3.7,3.5,2.4,3.7,m.white,.08);box(g,0,4,-3.7,3.8,.16,4,m.steel);
  box(g,0,3.1,-1.83,2.9,.9,.04,m.glass);for(const side of [-1,1])box(g,side*1.77,3.1,-3.7,.035,.9,2.8,m.glass);
  beam(g,[0,4,-4],[0,6.9,-4],.06);beam(g,[-1.2,6,-4],[1.2,6,-4],.04);box(g,.85,4.6,-4.7,.6,1.1,.65,m.dark);
  const winch=group(g,0,2,1);winch.name='winch';for(const xw of [-.9,.9])box(winch,xw,0,0,.15,.8,1.3,m.steel);
  const drum=cylinder(winch,0,.25,0,.55,1.7,m.dark);drum.rotation.z=Math.PI/2;
  for(let k=-.7;k<.8;k+=.13){const ring=mesh(winch,new T.TorusGeometry(.55,.04,6,16),m.wood,k,.25,0);ring.rotation.y=Math.PI/2;}
  for(const side of [-1,1]){beam(g,[side*1.9,1.5,2.5],[side*1.9,4.5,2.5],.065);for(let zz=-6;zz<6;zz+=1.7){beam(g,[side*2.05,1.5,zz],[side*2.05,2.35,zz],.03);const tire=mesh(g,new T.TorusGeometry(.3,.095,6,16),m.rubber,side*2.2,1.15,zz);tire.rotation.y=Math.PI/2;}beam(g,[side*2.05,2.35,-6],[side*2.05,2.35,5.5],.03);}
  beam(g,[-1.9,4.5,2.5],[1.9,4.5,2.5],.065);beam(g,[0,4.5,2.5],[0,2.4,3.5],.025,m.dark);
  for(const xx of [-1.2,0,1.2])crate(g,xx,1.55,4.6,true);
  box(g,0,1.62,-.3,2,.15,1.4,m.steel);person(g,u,{x:.95,z:1.4,y:1.55,rot:-Math.PI/2,coat:m.orange,hat:m.white});
  person(g,u,{x:0,z:-2.8,y:1.55,pose:'sit',coat:m.blue,hat:m.white});
  u.push(t=>{g.position.y=.055*Math.sin(t*Math.PI/3+index);g.rotation.z=.009*Math.sin(t*Math.PI/3+index);drum.rotation.x=t*.5;});return g;
}
function workingPort(){
  const root=new T.Group(),updates=[];
  const distantSea=new T.PlaneGeometry(3200,3200);distantSea.rotateX(-Math.PI/2);
  const backdrop=mesh(root,distantSea,m.water,0,-.8,0);backdrop.name='frame-ground';backdrop.castShadow=false;backdrop.receiveShadow=false;
  const sea=new T.PlaneGeometry(400,240,80,48);sea.rotateX(-Math.PI/2);const water=mesh(root,sea,m.water,0,-.35,0);water.castShadow=false;
  const a=sea.attributes.position,base=a.array.slice();updates.push(t=>{for(let i=0;i<a.count;i++){const x=base[3*i],z=base[3*i+2];a.setY(i,.28*Math.sin(x*.18+z*.22+t*Math.PI/3)+.12*Math.sin(z*.46-x*.11-t*Math.PI/3));}a.needsUpdate=true;sea.computeVertexNormals();});
  const foam=new T.MeshBasicMaterial({color:'#cfebea',transparent:true,opacity:.48});
  for(let i=0;i<65;i++){const x=(i*37%260)-130,z=(i*23%100)-15,pts=[];for(let j=0;j<7;j++)pts.push(new T.Vector3(x+j*1.1,.16,z+Math.sin(j*.6+i)*.5));const line=mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts),10,.045,3,false),foam);line.castShadow=false;updates.push(t=>line.position.y=.08*Math.sin(t*Math.PI/3+i));}
  const land=group(root,0,1.1,0);box(root,0,-.1,-1024,3000,2.4,2000,m.floor).name='mainland';
  box(root,0,.6,-24,3000,2.4,.5,m.dark);
  for(let x=-160;x<180;x+=5){cylinder(land,x,.22,-25,.22,.5,m.dark);box(land,x,-.2,-23.7,1,.5,.22,m.yellow);box(root,x,.1,-23.6,.65,1.6,.5,m.rubber);}
  // An inland circulation spine separates container stacks from sheds.
  box(land,0,.12,-78,600,.24,13,m.road);
  const roadPaint=m.white.clone();roadPaint.polygonOffset=true;roadPaint.polygonOffsetFactor=-1;roadPaint.polygonOffsetUnits=-2;
  for(let x=-220;x<240;x+=8){const stripe=box(land,x,.275,-78,3,.02,.13,roadPaint);stripe.castShadow=false;}
  for(const x of [-10,22,54])for(const z of [-43,-58])for(let k=0;k<5;k++)for(let y=0;y<3;y++)container(land,x+k*2.75,y*2.6,z,[m.blue,m.green,m.orange][Math.abs(x+z)%3]);
  // Two large, distinct buildings establish the inland edge of the shot.
  for(const [x,z,w,d,h] of [[15,-112,108,52,17],[115,-108,68,44,22]]){
    box(land,x,h/2,z,w,h,d,m.wall);box(land,x,h+.2,z,w+1,.4,d+1,m.steel);
    for(let dx=-w/2+10;dx<w/2-5;dx+=18){box(land,x+dx,3,z+d/2+.06,8,6,.12,m.dark);box(land,x+dx,h-3,z+d/2+.08,12,1.6,.1,m.glass);}
    for(const dx of [-w/3,0,w/3])box(land,x+dx,h+.7,z,8,.5,3,m.glass);
  }
  truck(land,-9,-82,0).position.y=.24;truck(land,27,-82,0).position.y=.24;
  // Low-detail peripheral facilities, rather than another repeated warehouse row.
  const utility=group(land,-64,0,-102);
  box(utility,0,4,0,25,8,22,m.white);box(utility,0,8.2,0,26,.4,23,m.dark);
  for(const x of [-8,0,8])box(utility,x,5.3,11.05,4,1.8,.06,m.glass);
  for(const x of [-118,-105]){cylinder(land,x,5,-91,4.5,10,m.steel);ball(land,x,10,-91,4.5,.8,4.5,m.steel);}
  // Consolidate peripheral context inland, in the visible strip beyond the road.
  const office=group(land,-117,0,-120);
  box(office,0,7,0,40,14,28,m.wall);box(office,0,14.2,0,41,.4,29,m.dark);
  for(const y of [4,9])for(const x of [-14,-7,0,7,14])box(office,x,y,14.06,4.8,2.2,.08,m.glass);
  box(office,0,3,14.1,5,6,.12,m.glass);box(office,0,6.3,16,10,.2,4,m.white);
  // The inland parking road needs the same surface separation as the main road.
  const parkingRoadMaterial=m.road.clone();parkingRoadMaterial.polygonOffset=true;parkingRoadMaterial.polygonOffsetFactor=-1;parkingRoadMaterial.polygonOffsetUnits=-2;
  const parkingRoad=box(land,-106,.15,-99,64,.3,10,parkingRoadMaterial);parkingRoad.castShadow=false;
  for(let x=-137;x<-78;x+=8){const stripe=box(land,x,.35,-99,.1,.02,9,roadPaint);stripe.castShadow=false;stripe.receiveShadow=false;}
  for(const x of [-134,-91])truck(land,x,-98,0,true).position.y=.3;
  for(const x of [-145,-82]){cylinder(land,x,4,-116,2.8,8,m.steel);beam(land,[x,7,-116],[x,7,-91],.16,m.steel);}
  // Fishing market and refrigerated loading: crates only on the sheltered dock.
  shed(land,-94,-48,43,27);for(const xx of [-109,-101,-93,-85]){box(land,xx,.95,-37,5,.15,2,m.steel);for(const dx of [-1.6,0,1.6])crate(land,xx+dx,1.04,-37,true);}
  truck(land,-115,-65,Math.PI/2,true);truck(land,-78,-65,Math.PI/2,true);forklift(land,updates,-81,-34);
  for(const xx of [-107,-93,-85])person(land,updates,{x:xx,z:-35.5,coat:m.white,hat:m.white,rot:Math.PI});
  // A separate fishing basin beside the deep-water commercial berth.
  box(root,-120,.5,-6,6,2,36,m.floor);box(root,-86,.5,12,68,2,5,m.floor);
  for(let x=-115;x<-55;x+=6)cylinder(root,x,1.7,10.6,.15,.45,m.dark);
  for(let i=0;i<3;i++){const b=fishingVessel(root,updates,-108+i*16,-4,i);beam(root,[-108+i*16,1.8,8.8],[-108+i*16,1.9,3.5],.025,m.wood);}
  const ship=group(root,27,0,-9);ship.rotation.y=Math.PI/2;
  vesselHull(ship,112,18,5,m.blue).name='merchant-hull';
  // Long, low cargo holds and an aft accommodation block leave the bow clear.
  for(const x of [-6,-3,0,3,6])for(let z=-31;z<=32;z+=6.4)for(let y=0;y<3+(z<8?1:0);y++)container(ship,x,5.15+y*2.6,z,[m.blue,m.green,m.orange][(Math.round(z*10)+310+y)%3]);
  box(ship,0,7.1,-45,16,4,12,m.white);box(ship,0,11.1,-46,13,4,10,m.white);box(ship,0,14.5,-45,16,2.5,9,m.white);
  for(let y=7;y<=14;y+=2)for(let x=-5.5;x<7;x+=2)box(ship,x,y,-39.95,1,.65,.05,m.glass);
  box(ship,0,14.8,-40.45,14,.85,.05,m.glass);for(const side of [-1,1])box(ship,side*8.02,14.8,-45,.04,.85,7.5,m.glass);
  box(ship,0,16,-45,16.8,.2,9.7,m.white);box(ship,3.4,17,-49,2.8,4.5,3,m.orange);box(ship,3.4,19.3,-49,2.8,.35,3,m.dark);
  beam(ship,[-3,16,-44],[-3,22,-44],.09);beam(ship,[-5,20,-44],[-1,20,-44],.07);
  for(const xx of [-4,4]){cylinder(ship,xx,5.5,43,.6,.8,m.dark);beam(ship,[xx,5.5,43],[xx,5.5,49],.08);}
  for(const side of [-1,1]){for(let z=-53;z<43;z+=3)beam(ship,[side*8.6,5.1,z],[side*8.6,6.2,z],.035);beam(ship,[side*8.6,6.2,-53],[side*8.6,6.2,43],.035);}
  updates.push(t=>ship.position.y=.045*Math.sin(t*Math.PI/3));
  for(const x of [-5,42]){
    const crane=group(land,x,0,-33);for(const dx of [-4,4])for(const zz of [-5,5]){beam(crane,[dx,0,zz],[dx,28,zz],.28,m.steel);box(crane,dx,.4,zz,1.3,.8,3,m.dark);}
    for(const dx of [-3,3]){beam(crane,[dx,28,-15],[dx,28,43],.22,m.steel);beam(crane,[dx,31,-15],[dx,31,43],.18,m.steel);for(let z=-15;z<42;z+=3)beam(crane,[dx,28,z],[dx,31,z+3],.1,m.steel);}
    const trolley=group(crane,0,28,20);box(trolley,0,0,0,6,.7,3,m.yellow);for(const dx of [-2,2])beam(trolley,[dx,0,0],[dx,-11,0],.035,m.dark);box(trolley,0,-11,0,5,.4,2.5,m.yellow);
    updates.push(t=>trolley.position.z=20+4*Math.sin(t*Math.PI/3));
  }
  truck(land,75,-91,Math.PI/2);truck(land,12,-69,Math.PI/2);person(land,updates,{x:79,z:-89,pose:'clipboard',coat:m.orange});
  return {root,updates,view:{position:[61.53,68.4,69.08],target:[-6,2,-24]}};
}

function neighborhood(){
  const root=new T.Group(),updates=[];surface(root,110,96,m.grass);
  box(root,0,-.24,0,1000,.45,1000,m.grass).name='frame-ground';
  // Cheap continuous surfaces fill the film frame; off-camera vehicle routes
  // do not need extra modeled streets or buildings.
  box(root,0,.02,4,1000,.08,11,m.road);box(root,9,.025,0,11,.08,1000,m.road);
  for(let x=-53;x<55;x+=4)if(x<1||x>17)box(root,x,.08,4,2,.015,.13,m.white);
  for(let z=-42;z<44;z+=4)if(z<-4||z>12)box(root,9,.085,z,.13,.015,2,m.white);
  const curbs=group(root);curbs.name='curbs';
  // Four separate block perimeters, with gaps for vehicle entrances.
  for(const [z,spans] of [[-2,[[-54,-44],[-6,2.5],[16,25],[43,55]]],[10,[[-54,-42],[-36,2.5],[16,55]]]])for(const [a,b] of spans)box(curbs,(a+b)/2,.17,z,b-a,.3,.75,m.floor);
  for(const x of [3,15])for(const [z,d] of [[-23.5,40],[27.5,33]])box(curbs,x,.17,z,.75,.3,d,m.floor);
  // Recessed depot, loading docks face its own apron, not the public road.
  const depot=group(root,-25,.2,-21);surface(depot,46,35);shed(depot,0,-7,40,20);
  // Replace the thin green patch and its nearly coplanar ribs with a raised,
  // single roof section. Leave the taller office annex's footprint uncovered.
  for(const o of [...depot.children]){const q=o.geometry?.parameters;if(q&&q.depth===6&&(q.height===.14||q.height===.04))depot.remove(o);}
  const depotRoofMaterial=material('#487864',0,1);
  const depotRoof=box(depot,-4.2,6.15,-13.9,31.8,.4,5.8,depotRoofMaterial);
  // Thin trusses and roof seams otherwise cause a shimmering shadow pattern.
  depotRoof.receiveShadow=false;
  box(depot,-4.2,5.8,-16.85,31.8,1,.18,m.steel);
  box(depot,0,2.7,-30,40,5.4,26,m.wall);box(depot,0,5.5,-30,40,.15,26,m.steel);
  // Logistics architecture: ribbed cladding, rooflights, vents and a loading canopy.
  for(const x of [-20.12,20.12]){
    for(let z=-42;z<-17;z+=2)box(depot,x,2.7,z,.1,5.2,.12,m.steel);
    // Put glazing outside the ribbed cladding, not almost on the same plane.
    const glazing=box(depot,Math.sign(x)*20.28,4.4,-30,.08,1.1,22,m.glass);glazing.receiveShadow=false;
    beam(depot,[x,5.45,-43],[x,5.45,-17],.09,m.dark);
  }
  for(const x of [-12,0,12]){
    box(depot,x,5.72,-30,4,.25,22,m.white);box(depot,x,5.88,-30,3.3,.08,20,m.glass);
    box(depot,x,6,-39,2.5,1,2.5,m.steel);
  }
  box(depot,0,4.8,5.7,40,.2,5.3,m.steel);
  for(const x of [-19,19])beam(depot,[x,0,7.8],[x,4.7,7.8],.09,m.steel);
  for(const x of [-14,-5,4,13]){
    for(const dx of [-2.6,2.6])box(depot,x+dx,2.1,3.22,.25,4.2,.35,m.rubber);
    box(depot,x,4.3,3.22,5.5,.35,.35,m.rubber);
    box(depot,x,.08,13,4.8,.03,.13,m.yellow);
  }
  box(depot,16,3.6,-12,8,7.2,8,m.white);
  box(depot,16,5,-7.88,6,1.5,.08,m.glass);box(depot,20.28,5,-12,.08,1.5,6,m.glass);
  for(let x=-14;x<=14;x+=9){box(depot,x,2.15,3.05,5,4.3,.12,m.dark);for(let y=.3;y<4.3;y+=.3)box(depot,x,y,3.15,4.8,.035,.025,m.steel);box(depot,x,.5,4.5,5,1,3,m.floor);truck(depot,x,8.5);}
  forklift(depot,updates,17,9);for(const x of [-13,-5,3,11])pallet(depot,x,-5,3);person(depot,updates,{x:1,z:13,pose:'clipboard'});
  // Hospital exterior: ward block, enclosed outpatient podium and formal entrance.
  const h=group(root,33,.25,-23);surface(h,30,35);
  box(h,0,6.7,-6,27,13.4,14,m.white);for(let y=2.5;y<13;y+=3.2)for(let x=-11;x<12;x+=3.2){box(h,x,y,1.03,1.9,1.65,.055,m.glass);box(h,x,y+1,1.08,2.2,.15,.18,m.floor);}
  for(const side of [-1,1])for(let y=2.5;y<13;y+=3.2)for(let z=-11;z<0;z+=3.2)box(h,side*13.52,y,z,.04,1.65,1.9,m.glass);
  box(h,0,13.55,-6,27.8,.3,14.8,m.white).name='hospital-roof';for(const x of [-10,10])box(h,x,14.3,-9,3,1.2,3,m.steel);
  const sign=group(h,0,17,-3);sign.name='hospital-sign';for(const x of [-1.3,1.3])beam(sign,[x,-3.2,0],[x,1.5,0],.1,m.steel);
  box(sign,0,0,0,4.4,4.4,.45,m.white);box(sign,0,0,.24,3.2,.9,.08,m.red);box(sign,0,0,.25,.9,3.2,.08,m.red);box(sign,0,0,-.24,3.2,.9,.08,m.red);box(sign,0,0,-.25,.9,3.2,.08,m.red);
  // Solid, two-storey front wing; no cutaway rooms or transparent roof.
  box(h,0,3.4,7,28,6.8,12,m.white);
  box(h,0,6.95,7,29,.3,13,m.wall);
  for(const y of [2,5])for(const x of [-11,-7,7,11])box(h,x,y,13.06,2.8,1.7,.08,m.glass);
  for(const side of [-1,1])for(const y of [2,5])for(const z of [3,7,11])box(h,side*14.06,y,z,.08,1.7,2.7,m.glass);
  // Double-height central glazing and stone piers distinguish the main entrance.
  box(h,0,3.2,13.09,8,6,.12,m.glass);
  for(const x of [-4.3,0,4.3])box(h,x,3.3,13.2,.25,6.6,.3,m.white);
  box(h,0,3.5,16,12,.4,6,m.white);
  for(const x of [-5,5])box(h,x,1.7,18.3,.45,3.4,.45,m.wall);
  box(h,0,.1,15,11,.2,4,m.floor);
  for(const x of [-11,11]){box(h,x,.45,14.7,4,.9,1.5,m.wall);box(h,x,1,14.7,3.6,.5,1.1,m.green,.12);}
  const amb=truck(h,8,15,0,true);amb.scale.setScalar(.65);for(const o of amb.children)if(o.material===m.green)o.material=m.white;box(amb,0,2.7,2.5,1,.2,.4,m.red);
  // Construction frame at real floor heights, with scaffold and safety netting.
  const site=group(root,-27,.2,26);
  const earth=new T.MeshStandardMaterial({color:'#9c7957',roughness:1,flatShading:true});
  surface(site,46,27,earth);
  for(const [x,z,rx,ry,rz] of [[15,10,4,1.9,2],[-19,7,2.7,1.4,3.2],[5,10.6,3.2,1.1,1.6]]){
    const mound=mesh(site,new T.SphereGeometry(1,9,5,0,Math.PI*2,0,Math.PI/2),earth,x,0,z);mound.scale.set(rx,ry,rz);
  }
  for(let floor=0;floor<4;floor++){
    for(const x of [-16,-9,-2,5])for(const z of [-8,0,8])box(site,x,1.65+floor*3.3,z,.5,3.3,.5,m.floor);
    box(site,-5.5,3.3+floor*3.3,0,22,.2,17,m.floor);
    for(const z of [-8,0,8])box(site,-5.5,3.02+floor*3.3,z,22,.4,.35,m.floor);
  }
  for(const z of [-9.3,9.3]){for(let x=-17.5;x<7;x+=2){beam(site,[x,0,z],[x,14.5,z],.035);for(let y=2;y<15;y+=2){beam(site,[x,y,z],[x+2,y,z],.025);beam(site,[x,y-2,z],[x+2,y,z],.025);}}for(let y=2;y<15;y+=2)box(site,-5.5,y,z,24,.055,.7,m.steel);}
  for(const x of [-22,22])box(site,x,1,0,.12,2,27,m.white);box(site,0,1,13.4,44,2,.12,m.white);
  for(let x=-20;x<8;x+=2)box(site,x,1,-13.4,1.9,2,.12,m.white);
  // Materials stay along the west edge; the entrance corridor on the east
  // remains clear from the public road to the working area.
  for(let x=-21;x<=-17;x+=.5)beam(site,[x,.15,-10],[x,.15,-3],.035,m.dark);for(let z=-10;z<=-3;z+=.5)beam(site,[-21,.17,z],[-17,.17,z],.035,m.dark);
  person(site,updates,{x:11,z:0,pose:'clipboard',coat:m.orange});person(site,updates,{x:13,z:0,coat:m.blue,rot:-Math.PI/2});
  const crane=group(site,15,0,5);for(const x of [-.8,.8])for(const z of [-.8,.8])beam(crane,[x,0,z],[x,24,z],.09,m.yellow);
  for(let y=0;y<24;y+=1.5)for(const z of [-.8,.8]){beam(crane,[-.8,y,z],[.8,y+1.5,z],.05,m.yellow);beam(crane,[-.8,y,z],[.8,y,z],.05,m.yellow);}
  const jib=group(crane,0,24,0);for(const z of [-.6,.6]){beam(jib,[-29,0,z],[7,0,z],.09,m.yellow);beam(jib,[-29,1.4,z],[7,1.4,z],.07,m.yellow);for(let x=-29;x<7;x+=2)beam(jib,[x,0,z],[x+2,1.4,z],.04,m.yellow);}box(jib,5,.3,0,3,1.3,2,m.dark);beam(jib,[-17,0,0],[-17,-10,0],.025,m.dark);updates.push(t=>jib.rotation.y=.045*Math.sin(t*Math.PI/3));
  // Low-rise residential lots with pitched roofs, gardens, porches and parked cars.
  for(let i=0;i<4;i++){
    const x=24+(i%2)*18,z=21+Math.floor(i/2)*17,g=group(root,x,.2,z);g.name=`house-${i}`;surface(g,15,14,m.floor);
    box(g,0,2.7,-1,9,5.4,8,i%2?m.white:m.wall);const roofMat=i%2?m.dark:m.blue;
    for(const s of [-1,1]){const roof=box(g,s*2.4,6.25,-1,5.5,.16,9,roofMat);roof.rotation.z=-s*.4;}
    for(const xx of [-2.6,2.6])for(const y of [1.5,4])box(g,xx,y,3.02,1.7,1.25,.04,m.glass);
    box(g,0,1.1,3.04,1.1,2.2,.06,m.wood);box(g,0,2.4,3.7,2.2,.12,1.7,m.dark);box(g,0,.15,3.8,2.4,.3,1.5,m.floor);
    for(const xx of [-6.5,6.5])box(g,xx,.45,0,.15,.9,13,m.wall);tree(g,-5,4,.7);box(g,4,.02,5,4,.05,3,m.road);
  }
  // All public-road traffic runs horizontally, in opposing left-hand lanes.
  for(let i=0;i<3;i++){
    const east=i!==1,v=truck(root,0,east?1.3:6.7,east?Math.PI/2:-Math.PI/2,true);v.name=`traffic-${i}`;if(i===2)v.scale.setScalar(.75);
    updates.push(t=>{const travel=((t/18*132+i*43)%132);v.position.x=east?-66+travel:66-travel;});
  }
  for(const [x,z] of [[-52,-37],[-51,-5.5],[18,-40],[50,-38],[51,13]])tree(root,x,z,1.5);
  // Inexpensive edges of a larger neighborhood: side street, small workshops,
  // hedges and a hospital parking area. Detail stays on the working foreground.
  box(root,35,.03,29.5,40,.07,3,m.road);
  for(const [x,z,w,d,height] of [[-56,-25,20,24,7],[-58,27,14,19,6],[57,34,14,21,6]]){
    box(root,x,height/2,z,w,height,d,m.wall);box(root,x,height+.15,z,w+1,.3,d+1,m.dark);
    for(const dx of [-w*.28,w*.28])box(root,x+dx,2,z+d/2+.04,w*.25,3.5,.08,m.glass);
  }
  const parking=group(root,-2,0,-47);parking.name='depot-parking';
  box(parking,0,.03,0,10,.07,33,m.road);
  for(let z=-15;z<=15;z+=5)box(parking,0,.08,z,8,.02,.1,m.white);
  for(const [x,z] of [[-2,-12],[2,-2],[-2,8]]){
    box(parking,x,.65,z,1.85,1.1,3.9,m.white,.12);box(parking,x,1.3,z-.2,1.55,.65,2,m.glass,.08);
    for(const xx of [-.9,.9])for(const zz of [-1.2,1.2]){const tire=cylinder(parking,x+xx,.38,z+zz,.32,.16,m.rubber);tire.rotation.z=Math.PI/2;}
  }
  for(const [x,z,w,d] of [[49,24,1,19],[34,47,38,1.2],[-53,-8,1.2,8],[-2,-64,10,1.2]])box(root,x,.65,z,w,1.3,d,m.green,.2);
  for(const [x,z] of [[1,-9],[17,16],[-40,-3],[48,-3]]){
    beam(root,[x,0,z],[x,6,z],.07,m.dark);beam(root,[x,6,z],[x+1.6,6,z],.055,m.dark);box(root,x+1.5,5.95,z,.8,.12,.35,m.white);
  }
  // Translate camera and target equally along screen-right; keep the viewing angle.
  return {root,updates,view:{position:[46.01,39.53,48.26],target:[5.4,2,-2.5]}};
}
