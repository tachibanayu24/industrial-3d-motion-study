import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorlds } from '../src/worlds.js';

const worlds=createWorlds(new T.Scene());
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
  for(const w of worlds){
    const ground=w.root.getObjectByName('frame-ground');assert.ok(ground);
    const area=bounds(ground);
    for(const phase of [0,.5,1]){
      const c=new T.PerspectiveCamera(37,16/9,.1,1600);
      c.position.fromArray(w.view.position).applyAxisAngle(new T.Vector3(0,1,0),(phase-.5)*.08);c.lookAt(...w.view.target);c.updateMatrixWorld();
      for(const x of [-1,1])for(const y of [-1,1]){
        const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x,y),c);
        const hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-area.max.y),new T.Vector3());
        assert.ok(hit && hit.x>=area.min.x&&hit.x<=area.max.x&&hit.z>=area.min.z&&hit.z<=area.max.z);
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
