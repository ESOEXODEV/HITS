const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor(tag) { this.tag=tag; this.children=[]; this.attrs={}; this.events={}; this.classes=new Set();
    this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)};
    this.clientWidth=800; }
  set className(value) { this.classes=new Set(value.split(' ')); }
  get className(){return [...this.classes].join(' ')}
  setAttribute(k,v){this.attrs[k]=v}
  append(...nodes){this.children.push(...nodes)}
  prepend(node){this.children.unshift(node)}
  remove(){this.removed=true}
  addEventListener(k,cb){this.events[k]=cb}
}
async function run({reduced=false,broken=false}={}) {
  let now=0, nextID=0, timers=new Map(), observer;
  const set=(fn,ms)=>{timers.set(++nextID,{fn,at:now+ms});return nextID};
  const clear=id=>timers.delete(id);
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  async function advance(to){while(true){const next=[...timers].filter(([,v])=>v.at<=to).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();await flush()}now=to;await flush()}
  const root=new Element('div');
  const sliders=[new Element('slider'),new Element('slider')];
  const source=i=>({getAttribute:()=>'/photo-'+i+'.jpg',alt:'Photo '+i});
  root.querySelector=()=>null;
  root.querySelectorAll=s=>s===' .none'?[]:s==='.gallery-slider img'?[source(0),source(1),source(1),source(2)]:sliders;
  const motion={matches:reduced,addEventListener(){}};
  const doc={hidden:false,querySelector:()=>root,createElement:tag=>new Element(tag),addEventListener(k,cb){this[k]=cb}};
  const win={matchMedia:()=>motion,IntersectionObserver:class{constructor(cb){observer=cb}observe(){observer([{isIntersecting:true}])}},ResizeObserver:class{constructor(cb){this.cb=cb}observe(){this.cb()}}};
  class Image {set src(v){this.naturalWidth=broken?0:100;this.complete=true;if(broken)this.onerror();else this.onload()}}
  vm.runInNewContext(fs.readFileSync(__dirname+'/HITS-about-drone-gallery-v1.js','utf8'),{window:win,document:doc,location:{href:'https://example.test/about'},URL,Image,IntersectionObserver:win.IntersectionObserver,ResizeObserver:win.ResizeObserver,performance:{now:()=>now},setTimeout:set,clearTimeout:clear});
  await flush();await flush();
  const stage=root.children[0];
  if(broken){assert(stage.removed);assert(!root.classList.contains('hits-about-gallery-ready'));return;}
  assert(root.classList.contains('hits-about-gallery-ready'));
  assert(sliders.every(s=>s.inert&&s.attrs['aria-hidden']==='true'));
  const [drones,photo,pause]=stage.children,image=photo.children[0];
  assert.equal(drones.attrs['data-drone-columns'],'12');
  assert.equal(image.src,'https://example.test/photo-0.jpg');
  if(reduced){await advance(10000);assert.equal(image.src,'https://example.test/photo-0.jpg');return;}
  await advance(4999);assert(photo.classList.contains('is-visible'));
  await advance(5000);assert(!photo.classList.contains('is-visible'));
  await advance(5600);assert(!photo.classList.contains('is-visible'));
  await advance(5700);assert.equal(image.src,'https://example.test/photo-1.jpg');assert(photo.classList.contains('is-visible'));
  pause.events.click();await advance(20000);assert.equal(image.src,'https://example.test/photo-1.jpg');
  pause.events.click();await advance(25000);await advance(25700);assert.equal(image.src,'https://example.test/photo-2.jpg');
  // Duplicate sources are skipped, and the order loops back to the first image.
  await advance(30700);await advance(31400);assert.equal(image.src,'https://example.test/photo-0.jpg');
  observer([{isIntersecting:false}]);await advance(45000);assert.equal(image.src,'https://example.test/photo-0.jpg');
  observer([{isIntersecting:true}]);await advance(50700);assert.equal(image.src,'https://example.test/photo-1.jpg');
}
(async()=>{await run();await run({reduced:true});await run({broken:true});console.log('PASS: image order/deduplication, five-second hold, fade/gap timing, pause/resume, offscreen pause, reduced motion and failed-image fallback')})().catch(e=>{console.error(e);process.exit(1)});
