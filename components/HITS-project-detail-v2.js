
/* HITS project loop and native full-video lightbox. */
(function(){
function start(){
 const hero=document.querySelector('.hits-project-hero');

 if(!hero)return;
 const video=hero.querySelector('video');
 const json=hero.querySelector('.w-json');
 const color=getComputedStyle(hero.closest('.cms-shadow')).getPropertyValue('--cms-color').trim()||'#f0c36e';
 if(json){
  let item;try{item=JSON.parse(json.textContent).items[0];}catch(e){}
  let url=null;
  if(item&&(item.originalUrl||item.url)){
   const source=new URL(item.originalUrl||item.url);
   if(source.hostname==='vimeo.com'||source.hostname==='player.vimeo.com'){
    const match=source.pathname.match(/(?:video\/)?(\d+)/);
    if(match)url=new URL('https://player.vimeo.com/video/'+match[1]);
   }else if(['youtu.be','www.youtube.com','youtube.com'].includes(source.hostname)){
    const key=source.hostname==='youtu.be'?source.pathname.slice(1):source.searchParams.get('v')||source.pathname.split('/').pop();
    if(key)url=new URL('https://www.youtube.com/embed/'+encodeURIComponent(key));
   }
  }
  if(url){url.searchParams.set('autoplay','1');url.searchParams.set('muted','0');url.searchParams.set('title','0');url.searchParams.set('byline','0');url.hash='t=0s';
  const frame=document.createElement('iframe');frame.src=url.href;frame.width='1280';frame.height='720';frame.title='Full project video';frame.allow='autoplay; fullscreen; picture-in-picture';frame.setAttribute('allowfullscreen','');frame.style.border='0';
  json.textContent=JSON.stringify({items:[{type:'video',html:frame.outerHTML,width:1280,height:720}],group:''});

  if(window.Webflow&&Webflow.require('lightbox'))Webflow.require('lightbox').ready();
 }
 }
 hero.setAttribute('aria-label','Play full project video from the beginning');
 if(video){
  video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;
  const resume=()=>{if(!document.hidden&&!document.querySelector('.w-lightbox-backdrop:not(.w-lightbox-hide)'))video.play().catch(()=>{});};
  resume();
  hero.addEventListener('click',()=>video.pause());
  new MutationObserver(resume).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>document.hidden?video.pause():resume());
 }
 const layer=document.querySelector('.hits-project-margin-drones');
 const content=document.querySelector('.project-contents');
 if(!layer||!content)return;
 layer.setAttribute('aria-hidden','true');layer.style.color=color;
 const nodes=[...layer.children];
 nodes.forEach((node,i)=>{Object.entries({'data-drone-grid':'true','data-drone-columns':'1','data-drone-rows':'1','data-drone-size':[3,4.5,2.3,5,2.8,4,2,3,5.2,2.5][i],'data-drone-color':'inherit'}).forEach(([k,v])=>node.setAttribute(k,v));});
 function layout(){
  const r=content.getBoundingClientRect(),b=layer.getBoundingClientRect();
  const left=r.left-b.left,right=b.right-r.right;
  nodes.forEach((node,i)=>{
   const side=i<5?left:right,frac=[.35,.72,.16,.55,.42][i%5];
   node.style.display=side<65?'none':'block';
   node.style.left=(i<5?24+(left-48)*frac:b.width-right+24+(right-48)*frac)+'px';
   node.style.top=([.22,.46,.58,.77,.92,.25,.39,.56,.72,.88][i]*b.height)+'px';
  });
 }
 new ResizeObserver(layout).observe(content);window.addEventListener('resize',layout,{passive:true});layout();
 if(window.HITSDroneBlocks)HITSDroneBlocks.refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
