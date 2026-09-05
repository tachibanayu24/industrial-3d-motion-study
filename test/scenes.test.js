import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorlds, createShots, SHOT_SECONDS } from '../src/worlds.js';

const worlds=createWorlds(new T.Scene()),shots=createShots(),DRIFT=.12;
const bounds=o=>{o.updateWorldMatrix(true,true);return new T.Box3().setFromObject(o);};
test('port mainland extends well inland and beyond the active berths',()=>{
  const land=worlds[0].root.getObjectByName('mainland');
  assert.ok(land,'continuous mainland is missing');
  const b=bounds(land);assert.ok(b.min.x < -180 && b.max.x > 180 && b.min.z < -180);
});
test('merchant hull is long and three fishing vessels have working decks',()=>{
  const hull=worlds[0].root.getObjectByName('merchant-hull');assert.ok(hull);
  const size=bounds(hull).getSize(new T.Vector3());assert.ok(size.x/size.z>5);
  for(let i=0;i<3;i++)assert.ok(worlds[0].root.getObjectByName(`fishing-${i}`)?.getObjectByName('winch'));
});
test('forklift carries freight along the rack-to-truck axis and returns empty',()=>{
  const w=worlds[1],f=w.root.getObjectByName('transfer-forklift');assert.ok(f);
  const tick=t=>w.updates.forEach(fn=>fn(t));
  tick(0);const start=f.position.clone();assert.equal(f.rotation.y,0);
  tick(2.5);assert.ok(f.position.z>start.z+3);assert.equal(f.position.x,start.x);
  assert.ok(f.getObjectByName('fork-load').visible);
  tick(4.5);assert.equal(f.getObjectByName('fork-load').visible,false);
  tick(6);assert.ok(f.position.distanceTo(start)<1e-6);
});
test('forklift lowers its cargo onto the staging bay pallet position',()=>{
  const w=worlds[1],f=w.root.getObjectByName('transfer-forklift'),load=f.getObjectByName('fork-load');
  const tick=t=>w.updates.forEach(fn=>fn(t));
  tick(1);const carried=bounds(load).min.y;
  tick(2.9);const cargo=bounds(load),bay=bounds(w.root.getObjectByName('delivered-pallet'));
  assert.ok(cargo.min.y<carried-.1,'cargo must be lowered before it is set down');
  assert.ok(cargo.min.distanceTo(bay.min)<.05 && cargo.max.distanceTo(bay.max)<.05,'cargo must land exactly on the staging bay pallet');
});
test('curbs leave the whole road junction open',()=>{
  const w=worlds[2],curbs=w.root.getObjectByName('curbs');assert.ok(curbs);
  const junction=new T.Box3(new T.Vector3(3.5,-1,-1.5),new T.Vector3(14.5,2,9.5));
  for(const curb of curbs.children)assert.equal(bounds(curb).intersectsBox(junction),false);
});
test('three vehicles move in left-hand lanes without entering sidewalks',()=>{
  const w=worlds[2];
  for(let i=0;i<3;i++){
    const v=w.root.getObjectByName(`traffic-${i}`);assert.ok(v);
    w.updates.forEach(fn=>fn(0));const a=v.position.clone();
    w.updates.forEach(fn=>fn(.5));const b=v.position.clone();
    assert.ok(a.distanceTo(b)>.5);
    // Eastbound (+x) uses north lane (-z); westbound uses south lane.
    assert.ok((b.x-a.x)*(b.z-4)<0);
    assert.ok(Math.abs(b.z-4)>1.5 && Math.abs(b.z-4)<3.5);
  }
});
test('film framing has ground behind every corner throughout camera travel',()=>{
  for(const shot of shots)for(const orientation of ['landscape','portrait']){
    const w=worlds[shot.world],view=shot[orientation],ground=w.root.getObjectByName('frame-ground');assert.ok(ground);
    const area=bounds(ground);
    for(const phase of [0,.5,1]){
      const c=new T.PerspectiveCamera(37,orientation==='landscape'?16/9:9/16,.1,1600);
      const p=new T.Vector3().fromArray(view.position).sub(new T.Vector3().fromArray(view.target)).applyAxisAngle(new T.Vector3(0,1,0),(phase-.5)*DRIFT).add(new T.Vector3().fromArray(view.target));
      c.position.copy(p);c.lookAt(...view.target);c.updateMatrixWorld();
      for(const x of [-1,1])for(const y of [-1,1]){
        const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x,y),c);
        const hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-area.max.y),new T.Vector3());
        assert.ok(hit && hit.x>=area.min.x&&hit.x<=area.max.x&&hit.z>=area.min.z&&hit.z<=area.max.z,`${shot.name} ${orientation} corner ${x},${y} at phase ${phase} sees past the ground`);
      }
    }
  }
});
test('port geometry stays within the reduced preview budget',()=>{
  let meshes=0;worlds[0].root.traverse(o=>{if(o.isMesh)meshes++;});
  assert.ok(meshes<6000,`port has ${meshes} meshes`);
});
test('hospital sign stands above the roof and residential context is houses',()=>{
  const w=worlds[2],sign=w.root.getObjectByName('hospital-sign'),roof=w.root.getObjectByName('hospital-roof');
  assert.ok(sign && roof);assert.ok(bounds(sign).min.y>bounds(roof).max.y);
  assert.ok(w.root.getObjectByName('house-3'));
});
test('gantry crane lifts a container off the ship stack and sets it on the quay',()=>{
  const w=worlds[0],crane=w.root.getObjectByName('gantry-0');assert.ok(crane);
  const tick=t=>w.updates.forEach(fn=>fn(t));
  const carried=crane.getObjectByName('carried'),waiting=crane.getObjectByName('waiting'),placed=crane.getObjectByName('placed');
  tick(1);assert.ok(waiting.visible&&!carried.visible&&!placed.visible);
  tick(7);assert.ok(carried.visible&&!waiting.visible);
  const lifted=bounds(carried);assert.ok(lifted.min.y>bounds(waiting).min.y+1,'carried container must clear the tier it was lifted from');
  tick(14);assert.ok(placed.visible&&!carried.visible);
  const quay=bounds(placed);assert.ok(Math.abs(quay.min.y-1.1)<.05,`placed container rests on the quay, got ${quay.min.y}`);
  tick(12.9);const lowering=bounds(carried);assert.ok(Math.abs(lowering.min.y-quay.min.y)<.5,'container is lowered onto the quay before release');
  tick(18);assert.ok(waiting.visible&&!placed.visible,'cycle resets with the loop');
});
test('quay truck runs the free +z lane westbound and never overlaps another vehicle',()=>{
  const w=worlds[0],truck=w.root.getObjectByName('quay-truck');assert.ok(truck);
  const tick=t=>w.updates.forEach(fn=>fn(t));
  tick(0);const a=truck.position.clone();tick(SHOT_SECONDS);const b=truck.position.clone();
  assert.ok(truck.visible&&a.x-b.x>30,'truck crosses the frame westbound during the port shot');
  assert.ok(a.z>-78&&a.z<-71.5&&b.z===a.z,'truck stays in the +z lane of the quay road');
  const others=[];w.root.traverse(o=>{if(o.isMesh&&!truck.getObjectById(o.id))others.push(o);});
  for(let t=-.5;t<=7.5;t+=.5){tick(t);if(!truck.visible)continue;const tb=bounds(truck);
    for(const o of others){const ob=bounds(o),size=ob.getSize(new T.Vector3());if(size.x>40||ob.max.y<tb.min.y+.2)continue;
      assert.ok(!tb.intersectsBox(ob),`quay truck clips ${o.parent?.name||'a mesh'} at x=${truck.position.x.toFixed(1)} (t=${t})`);}}
  tick(12);assert.equal(truck.visible,false,'truck is parked off screen while other scenes play');
});
test('processing-line trays enter and leave inside the end machines',()=>{
  const w=worlds[1],machines=[];w.root.traverse(o=>{if(/^line-(inlet|outlet)-/.test(o.name))machines.push(bounds(o));});
  assert.equal(machines.length,4);
  const trays=[];w.root.traverse(o=>{if(o.isGroup&&o.children.length===4&&o.children[0].geometry?.parameters?.width===.68)trays.push(o);});
  assert.ok(trays.length>=12,'trays not found');
  for(let t=0;t<36;t+=.25){w.updates.forEach(fn=>fn(t));for(const tray of trays){const b=bounds(tray);if(Math.abs(tray.position.x)<11.8)continue;
    assert.ok(machines.some(mb=>mb.min.x<=b.min.x&&mb.max.x>=b.max.x&&mb.min.z<=b.min.z&&mb.max.z>=b.max.z&&mb.max.y>=b.max.y),`tray at x=${tray.position.x.toFixed(2)} is exposed at t=${t}`);}}
});
test('neighborhood depot has no forklift',()=>{
  let forks=0;worlds[2].root.traverse(o=>{if(o.isMesh&&o.geometry?.parameters?.width===1.2&&o.geometry?.parameters?.depth===1.7)forks++;});
  assert.equal(forks,0);
});
