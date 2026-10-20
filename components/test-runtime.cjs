const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
let raf = [], resizeCallbacks = [], mutation;
const hosts = [];
class Host {
  constructor(rows, columns, color='#f0c36e') {
    this.attrs = {'data-drone-grid':'true','data-drone-rows':String(rows),'data-drone-columns':String(columns)};
    this.color=color; this.style={position:''}; this.clientWidth=240; this.clientHeight=180;
    this.children=[];this.isConnected=true;
  }
  getAttribute(k){return this.attrs[k]??null}
  matches(){return this.attrs['data-drone-grid']!=='false'}
  appendChild(c){this.children.push(c);c.remove=()=>{this.children=this.children.filter(x=>x!==c)}}
}
hosts.push(new Host(4,4),new Host(3,3,'#e68ab9'),new Host(2,2,'#98c8ff'),new Host(1,8,'rgb(40,210,200)'));
hosts[3].clientHeight=60;
const motion={matches:false,addEventListener(type,cb){this.callback=cb}};
const document={readyState:'complete',hidden:false,body:{},addEventListener(){},querySelectorAll(){return hosts.filter(h=>h.isConnected&&h.matches())},createElement(){const c=createCanvas(1,1);c.style={};c.setAttribute=()=>{};return c}};
const window={devicePixelRatio:2,matchMedia:()=>motion,addEventListener(){},ResizeObserver:class{constructor(cb){resizeCallbacks.push(cb)}observe(){}disconnect(){}},IntersectionObserver:class{constructor(cb){this.cb=cb}observe(target){this.cb([{target,isIntersecting:true}])}unobserve(){}}};
const context={window,document,Map,Math,Number,CSS:{supports:()=>true},getComputedStyle:h=>({position:'static',color:h.color,getPropertyValue:()=>''}),
requestAnimationFrame:cb=>(raf.push(cb),raf.length),ResizeObserver:window.ResizeObserver,IntersectionObserver:window.IntersectionObserver,
MutationObserver:class{constructor(cb){mutation=cb}observe(){}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/HITS-drone-blocks-v1.js','utf8'),context);
function step(t){const q=raf;raf=[];q.forEach(cb=>cb(t))}
step(100);step(140);
assert(hosts.every(h=>h.children.length===1),'one canvas per instance');
const api=window.HITSDroneBlocks;
for(const n of [2,3,4]){const p=api.points(240,180,n,n,16);assert.equal(p.length,n*n);assert.equal(p[0].x,16);assert.equal(p[p.length-1].x,224)}
assert(api.points(240,60,8,1,16).every(p=>p.y===30));
const pix=hosts[3].children[0].getContext('2d').getImageData(32,60,1,1).data;
assert(pix[1]>pix[0]*2&&pix[2]>pix[0]*2,'inherited parent color rendered');
const before=hosts[0].children[0].toBuffer('image/png');step(400);
assert(!before.equals(hosts[0].children[0].toBuffer('image/png')),'flicker changes pixels');
motion.matches=true;motion.callback();step(500);const still=hosts[0].children[0].toBuffer('image/png');step(700);
assert(still.equals(hosts[0].children[0].toBuffer('image/png')),'reduced motion stays static');
hosts[0].clientWidth=110;resizeCallbacks.forEach(cb=>cb());step(800);assert.equal(hosts[0].children[0].width,220);
const copy=new Host(2,2);hosts.push(copy);api.refresh();step(900);assert.equal(copy.children.length,1);
api.refresh();step(950);assert.equal(copy.children.length,1,'refresh is idempotent');
copy.isConnected=false;api.refresh();assert.equal(copy.children.length,0,'removed blocks clean up');
hosts[0].attrs['data-drone-grid']='false';api.refresh();assert.equal(hosts[0].children.length,0,'disabled blocks clean up');
const out=createCanvas(1000,600),ctx=out.getContext('2d');ctx.fillStyle='#060608';ctx.fillRect(0,0,1000,600);
ctx.fillStyle='#f0c36e';ctx.font='28px sans-serif';ctx.fillText('HITS reusable drone blocks',40,55);
hosts[0].attrs['data-drone-grid']='true';hosts[0].clientWidth=240;api.refresh();step(1100);
hosts.slice(0,4).forEach((h,i)=>{const x=40+(i%2)*480,y=100+Math.floor(i/2)*240;ctx.fillStyle='#aab4c6';ctx.font='16px sans-serif';ctx.fillText(i===3?'8 × 1 · inherited color':`${h.attrs['data-drone-columns']} × ${h.attrs['data-drone-rows']}`,x,y);ctx.drawImage(h.children[0],x,y+18,h.clientWidth,h.clientHeight)});
fs.writeFileSync(__dirname+'/drone-blocks-check.png',out.toBuffer('image/png'));
console.log('PASS: geometry, rendered color, flicker, reduced motion, resize, duplication, cleanup, idempotency');
