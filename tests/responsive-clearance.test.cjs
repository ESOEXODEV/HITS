const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
function load(file){const window={};vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,THREE:{Color:class{constructor(){this.r=1;this.g=.8;this.b=.4}}},performance:{now:()=>1000},document:{}});return window.CreateParticles;}
const Old=load(path.join(__dirname,'../Animationcodev32-thumbnail-grid.js'));
const Fixed=load(path.join(__dirname,'../Animationcodev33-responsive-clearance.js'));
const clamp=(a,v,b)=>Math.min(b,Math.max(a,v));
function model(C,w,h,index,phase=0){
 const g=Object.create(C.prototype),canvas={left:37,top:23,width:w,height:h};
 g.camera={position:{z:100},fov:65,aspect:w/h};g.gridColumns=18;g.gridRows=12;
 const vw=g.visibleWidthAtZDepth(0,g.camera),vh=g.visibleHeightAtZDepth(0,g.camera);
 const home=[];for(let r=0;r<12;r++)for(let c=0;c<18;c++)home.push(-vw*.45+c*vw*.9/17,vh*.42-r*vh*.84/11,0);
 const attr=values=>({array:values,count:values.length/3,getX(i){return this.array[i*3]},getY(i){return this.array[i*3+1]},getZ(i){return this.array[i*3+2]},setXYZ(i,x,y,z){this.array.splice(i*3,3,x,y,z)}});
 g.particles={geometry:{attributes:{position:attr([...home]),customColor:attr([...home]),size:{array:Array(216).fill(4.5)},alpha:{array:Array(216).fill(1)}}}};
 g.geometryCopy={attributes:{position:attr([...home])}};g.data={particleColor:0xf0c36e,particleSize:4.5,area:50,ease:.05};
 const gap=clamp(12,w*.02,28),inset=clamp(80,h*.12,120),side=clamp(20,w*.06,120);
 const cw=(w-side*2-gap*2)/3,ch=(h-inset*2-gap*2)/3;
 const tw=Math.min(cw,ch*16/9),th=tw*9/16;
 const cx=canvas.left+side+cw/2+(index%3)*(cw+gap)+phase;
 const cy=canvas.top+inset+ch/2+Math.floor(index/3)*(ch+gap)+phase;
 const rect={left:cx-tw/2,right:cx+tw/2,top:cy-th/2,bottom:cy+th/2,width:tw,height:th};
 const project={getBoundingClientRect:()=>rect};
 g.activeProject={querySelector:()=>project,getBoundingClientRect:()=>rect};
 g.renderer={domElement:{getBoundingClientRect:()=>canvas}};
 return {g,home,rect,canvas,vw,vh};
}
function points(m){const p=m.g.particles.geometry.attributes.position,alpha=m.g.particles.geometry.attributes.alpha.array;return alpha.map((a,i)=>({x:m.canvas.left+(p.getX(i)/m.vw+.5)*m.canvas.width,y:m.canvas.top+(.5-p.getY(i)/m.vh)*m.canvas.height,a}));}
function clearance(m){return clamp(16,Math.min(m.canvas.width*.9/17,m.canvas.height*.84/11)*.22,28);}
function violations(m,pad){const r=m.rect;return points(m).filter(p=>p.a>.99&&p.x>r.left-pad+.02&&p.x<r.right+pad-.02&&p.y>r.top-pad+.02&&p.y<r.bottom+pad-.02);}
let cases=0,oldBorderFailures=0;const snapshots=[];
for(const [w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[844,390],[2560,1440]])for(let i=0;i<9;i++)for(const phase of [0,7.3,-11.5]){
 const m=model(Fixed,w,h,i,phase),old=model(Old,w,h,i,phase);
 for(let frame=0;frame<300;frame++){m.g.updateInteractiveGrid();old.g.updateInteractiveGrid();}
 assert.equal(violations(m,clearance(m)).length,0,`${w}x${h} slot ${i} phase ${phase} must clear border`);
 if(violations(old,0).length)oldBorderFailures++;
 assert.ok(m.g.particles.geometry.attributes.size.array.every(x=>x===4.5));
 if(w===1920&&h===1080&&phase===0)snapshots.push({slot:i,before:points(old),after:points(m),rect:m.rect,clearance:clearance(m)});
 m.g.activeProject=null;for(let frame=0;frame<300;frame++)m.g.updateInteractiveGrid();
 assert.ok(m.g.particles.geometry.attributes.position.array.every((x,k)=>Math.abs(x-m.home[k])<.00001),'restores home');
 assert.ok(m.g.particles.geometry.attributes.alpha.array.every(x=>x===1),'restores opacity');
 cases++;
}
const idle=model(Fixed,1440,900,4);idle.g.activeProject=null;idle.g.updateInteractiveGrid();assert.deepEqual(idle.g.particles.geometry.attributes.position.array,idle.home,'no cursor movement');
// Retain the original center fade and outer influence: this changes only the edge targets/clearance.
const center=model(Fixed,1920,1080,4);for(let f=0;f<300;f++)center.g.updateInteractiveGrid();assert.ok(center.g.particles.geometry.attributes.alpha.array.some(x=>x===0));assert.ok(center.g.particles.geometry.attributes.position.array.some((x,i)=>x!==center.home[i]));
fs.writeFileSync('/tmp/hits-clearance-snapshots.json',JSON.stringify(snapshots));
assert.ok(oldBorderFailures>0,'regression test must reproduce original border overlaps');
console.log(`PASS: ${cases} viewport/thumbnail/offset cases. All visible drones clear thumbnail plus margin; center fading, displacement, restoration, and idle formation preserved. Original code reproduced border overlaps in ${oldBorderFailures} cases.`);
