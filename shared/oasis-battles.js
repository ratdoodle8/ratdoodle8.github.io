(() => {
 'use strict';
 const api='https://ratdoodle-accounts.ratdoodle8.workers.dev',scene=document.getElementById('oasis');
 let world={frozen_total:0,battle_start:0,battle_until:0},mobs=[],offset=0,requesting=false,ownerId=null,encounter=null,overlay=null,overlayKey='',acknowledged=false;
 const mobActors=new Map(),contactLatch=new Set(),retryAfter=new Map(),cooldowns=new Map();
 let requestMotionAt=null,collisionRects=new Map(),rollingId=null,queuedRoll=false,contactReason='',lastCooldownPaint=0;
 const now=()=>Date.now()+offset;
 const token=()=>typeof getSessionToken==='function'?getSessionToken():null;
 function auth(){const h={'Content-Type':'application/json'};if(token())h.Authorization='Bearer '+token();return h;}
 function actorById(id){return id<0?mobActors.get(-id):typeof actors!=='undefined'?actors.get(String(id)):null;}
 function updateCooldowns(){
  const t=now();if(t-lastCooldownPaint<250)return;lastCooldownPaint=t;
  for(const [id,until] of cooldowns){
   const actor=actorById(id);if(until<=t){actor?.element.classList.remove('fight-cooldown');actor?.cooldownBadge?.remove();if(actor)actor.cooldownBadge=null;cooldowns.delete(id);continue;}
   if(!actor)continue;actor.element.classList.add('fight-cooldown');
   if(id>0){if(!actor.cooldownBadge){const badge=document.createElement('div');badge.className='oasis-untouchable-badge';actor.element.append(badge);actor.cooldownBadge=badge;}
    const value='UNTOUCHABLE · '+Math.max(1,Math.ceil((until-t)/1000))+'s';if(actor.cooldownBadge.textContent!==value)actor.cooldownBadge.textContent=value;}
  }
 }

 function isFrozen(){return requesting||now()<world.battle_until;}
 function timerTime(t){return t+Math.max(0,world.battle_until-t);}
 function motionTime(t){if(requesting&&requestMotionAt!==null&&t>=world.battle_until)return requestMotionAt;return t-world.frozen_total+Math.max(0,world.battle_until-t);}
 function bodyRect(actor){if(collisionRects.has(actor))return collisionRects.get(actor);return (actor.element.querySelector?.('.weebie-body')||actor.element).getBoundingClientRect();}
 function overlap(a,b){const x=bodyRect(a),y=bodyRect(b);return x.left<=y.right&&x.right>=y.left&&x.top<=y.bottom&&x.bottom>=y.top;}
 const pairKey=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
 function observeContacts(positions){collisionRects=new Map();for(const p of positions)collisionRects.set(p.actor,(p.actor.element.querySelector?.('.weebie-body')||p.actor.element).getBoundingClientRect());for(const key of contactLatch){const [a,b]=key.split(':').map(Number),first=positions.find(p=>Number(p.actor.data.id)===a),second=positions.find(p=>Number(p.actor.data.id)===b);if(!first||!second||!overlap(first.actor,second.actor))contactLatch.delete(key);}}
 let lastSyncTime=0;
 function sync(data){
  const stamp=Date.parse(data.serverTime);if(Number.isFinite(stamp)){if(stamp<lastSyncTime)return;lastSyncTime=stamp;}
  if(data.serverTime)offset=Date.parse(data.serverTime)-Date.now();
  if(data.battleWorld)world=data.battleWorld;
  if(data.mushrooms){mobs=data.mushrooms.slice(0,2);const live=new Set(mobs.map(m=>m.id));for(const [id,a] of mobActors)if(!live.has(id)){a.element.remove();mobActors.delete(id);}}
  if('encounter' in data){
   const incoming=data.encounter,oldId=encounter?.id;
   // A late page refresh must not erase or regress an encounter already accepted.
   if(!(encounter&&(!incoming&&now()<encounter.end_at||incoming&&incoming.id<encounter.id||incoming?.id===encounter.id&&encounter.applied&&!incoming.applied))){
    encounter=incoming;
    if(encounter?.id!==oldId){acknowledged=false;if(!requesting)overlayKey='';}
    if(encounter){const ids=[encounter.a,encounter.b||-encounter.mushroom_id];for(const id of ids)cooldowns.set(id,encounter.end_at+20000);if(now()<encounter.end_at)contactLatch.add(pairKey(...ids));}
   }
  }
  if(data.cooldowns)for(const c of data.cooldowns)for(const id of [c.a,c.b||-c.mushroom_id])cooldowns.set(id,c.until);
  lastCooldownPaint=0;updateCooldowns();
  renderEncounter();applyFreeze();
 }
 let lastFrozen=null;
 function applyFreeze(force=false){const frozen=isFrozen();if(!force&&frozen===lastFrozen)return;lastFrozen=frozen;scene.querySelectorAll('.weebie,.weebie *, .death-marker,.death-marker *, .wp-mushroom').forEach(n=>n.style.animationPlayState=frozen?'paused':'');}
 function botHash(number){const value=Math.sin(number*12.9898)*43758.5453;return value-Math.floor(value);}
 function eraserBotX(m,t){const center=Number(m.x),range=Math.max(0,Math.min(20,center-10,90-center));return center+range*Math.sin(t*0.00012+botHash(Number(m.id)+700)*Math.PI*2);}
 function addMushrooms(positions,t=motionTime(now())){
  for(const m of mobs){let a=mobActors.get(m.id);if(!a){const img=document.createElement('img');img.src='/shared/eraser-bot.png';img.alt='Eraser-Bot';img.className='wp-mushroom';scene.append(img);a={element:img,data:{id:-m.id},interactionUntil:0};mobActors.set(m.id,a);}const x=eraserBotX(m,t);a.element.style.left='0';a.element.style.transform='translateX('+(x*scene.clientWidth/100)+'px) translateX(-50%)';positions.push({actor:a,x});}
 }
 let polling=false;
 async function poll(){if(document.hidden||polling||requesting||rollingId!==null)return;polling=true;try{const r=await fetch(api+'/oasis/battle-state');if(r.ok)sync(await r.json());}catch(e){console.error('Battle sync:',e);}finally{polling=false;}}
 function trigger(a,b,time){
  a=Number(a);b=Number(b);
  const key=pairKey(a,b);if(requesting||isFrozen()||contactLatch.has(key)||ownerId===null||now()<(cooldowns.get(a)||0)||now()<(cooldowns.get(b)||0)||now()<(retryAfter.get(key)||0))return false;
  contactReason='';requesting=true;requestMotionAt=time;contactLatch.add(key);applyFreeze();
  overlay?.remove();overlay=document.createElement('div');overlay.className='wp-battle-message';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Oasis contact');
  const meeting=document.createElement('strong');meeting.textContent='Checking contact… ♡';const quickRoll=document.createElement('button');quickRoll.textContent='Roll';quickRoll.onclick=()=>{queuedRoll=true;quickRoll.disabled=true;meeting.textContent='Your Roll is queued ♡';quickRoll.textContent='Connecting…';};overlay.append(meeting,quickRoll);scene.append(overlay);overlayKey='contact';
  const mushroomId=a<0?-a:b<0?-b:null;
  const body=mushroomId?{a:a>0?a:b,mushroomId,time}:{a,b,time};
  body.sceneWidth=Math.min(1000,scene.clientWidth);body.bodySize=window.matchMedia('(max-width: 600px)').matches?78:100;
  (async()=>{try{let r,result;for(let attempt=0;attempt<5;attempt++){r=await fetch(api+'/oasis/battle',{method:'POST',credentials:'include',headers:auth(),body:JSON.stringify(body)});result=await r.json();if(!result.busy||attempt===4)break;await new Promise(resolve=>setTimeout(resolve,120));}contactReason=result.reason||result.error||'';if(r.ok){sync(result);if(result.accepted)overlayKey='';if(!result.accepted){retryAfter.set(key,now()+20000);}if(result.accepted&&queuedRoll){queuedRoll=false;void roll();}if(!result.accepted)queuedRoll=false;if(result.accepted&&typeof playInteraction==='function'){for(const id of [a,b]){const actor=id<0?mobActors.get(-id):actors.get(String(id));if(actor)playInteraction(actor);}}}else{retryAfter.set(key,now()+20000);}if(typeof loadOasis==='function')void loadOasis();}catch(e){retryAfter.set(key,now()+20000);console.error('Battle:',e);}finally{requesting=false;queuedRoll=false;requestMotionAt=null;if(overlayKey==='contact')showContactError();renderEncounter();applyFreeze();}})();
  return true;
 }
 function showContactError(){
  if(!overlay)return;
  overlayKey='contact-error';overlay.replaceChildren();
  const message=document.createElement('p');message.textContent=contactReason||'Connection interrupted while confirming contact. Please try again.';
  const close=document.createElement('button');close.textContent='Okay';close.onclick=()=>{overlay?.remove();overlay=null;overlayKey='';renderEncounter();};overlay.append(message,close);
 }
 async function roll(){
  if(!encounter||rollingId!==null||encounter.applied)return;
  const id=encounter.id;rollingId=id;overlayKey='';renderEncounter();
  try{
   let data;
   for(let attempt=0;attempt<5;attempt++){
    const r=await fetch(api+'/oasis/roll',{method:'POST',credentials:'include',headers:auth(),body:JSON.stringify({encounterId:id})});
    data=await r.json();
    if(r.ok){rollingId=null;sync(data);return;}
    if(r.status!==409||attempt===4)throw Error(data.error||'Unable to roll.');
    await new Promise(resolve=>setTimeout(resolve,120));
   }
  }catch(e){console.error('Roll:',e);rollingId=null;overlayKey='';renderEncounter();const note=overlay?.querySelector('.wp-battle-countdown');if(note)note.textContent=e.message+' Tap Roll to retry.';}
  finally{rollingId=null;}
 }

 async function finishResult(){
  if(!encounter||!encounter.applied||acknowledged)return;
  const id=encounter.id;
  acknowledged=true;overlay?.remove();overlay=null;overlayKey='';
  try{
   const r=await fetch(api+'/oasis/okay',{method:'POST',credentials:'include',headers:auth(),body:JSON.stringify({encounterId:id})});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to resume Oasis.');
   sync(data);applyFreeze();
   if(typeof loadOasis==='function')await loadOasis();
  }catch(e){
   console.error('Continue Oasis:',e);
   if(encounter?.id===id){acknowledged=false;overlayKey='';renderEncounter();const note=overlay?.querySelector('.wp-battle-countdown');if(note)note.textContent=e.message+' Tap Okay to retry.';}
  }
 }
 function setText(node,value){if(node.textContent!==value)node.textContent=value;}
 function renderEncounter(){
  if(overlayKey==='contact-error')return;
  if(requesting&&overlayKey==='contact')return;
  if(!encounter||acknowledged||now()>=encounter.end_at){overlay?.remove();overlay=null;overlayKey='';return;}
  const stage=rollingId===encounter.id?'rolling':now()<encounter.roll_at?'waiting':!encounter.applied?'rolling':'result';
  const key=encounter.id+':'+stage;
  if(!overlay){overlay=document.createElement('div');overlay.className='wp-battle-message';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Oasis battle');scene.append(overlay);}
  if(key!==overlayKey){
   overlayKey=key;overlay.replaceChildren();
   const title=document.createElement('strong');title.className='wp-battle-title';overlay.append(title);
   const dice=document.createElement('div');dice.className='wp-labeled-dice';dice.style.cssText='display:flex;gap:16px;justify-content:center;margin:12px 0';
   for(let i=0;i<2;i++){const column=document.createElement('div');column.style.cssText='flex:1;min-width:0';const name=document.createElement('div');name.className='wp-die-name';name.style.cssText='font-weight:bold;overflow-wrap:anywhere';const face=document.createElement('div');face.className='wp-die-face';face.style.cssText='font-size:48px;line-height:1.3';const change=document.createElement('div');change.className='wp-die-change';column.append(name,face,change);dice.append(column);}
   overlay.append(dice);
   const note=document.createElement('small');note.className='wp-battle-countdown';overlay.append(note);
   if(stage==='waiting'&&ownerId!==null){const button=document.createElement('button');button.textContent='Roll';button.onclick=roll;overlay.append(button);}
   if(stage==='result'){const button=document.createElement('button');button.textContent=acknowledged?'Okay ♡':'Okay';button.disabled=acknowledged;button.onclick=finishResult;overlay.append(button);if(typeof loadOasis==='function')loadOasis();}
  }
  const actorName=id=>typeof actors!=='undefined'?actors.get(String(id))?.data.name:null;
  const labels=[encounter.a_name||actorName(encounter.a)||'Your Weebie',encounter.mushroom_id?'Eraser-Bot':encounter.b_name||actorName(encounter.b)||'Your Weebie'];
  const title=overlay.querySelector('.wp-battle-title'),note=overlay.querySelector('.wp-battle-countdown'),columns=overlay.querySelectorAll('.wp-labeled-dice > div'),faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
  const rolls=[encounter.a_roll,encounter.b_roll];
  for(let i=0;i<2;i++){
   setText(columns[i].querySelector('.wp-die-name'),labels[i]);
   const face=columns[i].querySelector('.wp-die-face');
   setText(face,stage==='waiting'?'—':stage==='rolling'?faces[Math.floor(Math.random()*6)]:faces[rolls[i]-1]);
   face.setAttribute('aria-label',labels[i]+(stage==='result'?' rolled '+rolls[i]:stage==='rolling'?' is rolling':' is ready'));
   let change='';
   if(stage==='result'){
    if(rolls[0]===rolls[1])change='No time change';
    else if((i===0?rolls[0]>rolls[1]:rolls[1]>rolls[0]))change=i===1&&encounter.mushroom_id?'Wins this round':'+ '+(encounter.boost_ms>=60000?(encounter.boost_ms/60000).toFixed(1).replace(/\.0$/,'')+' min':(encounter.boost_ms/1000).toFixed(1)+' sec');
    else change=i===1&&encounter.mushroom_id?'Defeated!':'− 3 min';
   }
   setText(columns[i].querySelector('.wp-die-change'),change);
  }
  if(stage==='waiting'){setText(title,'Ready to roll?');setText(note,'Auto-roll in '+Math.max(0,Math.ceil((encounter.roll_at-now())/1000))+'s');}
  else if(stage==='rolling'){setText(title,'Rolling…');setText(note,'Good luck! ♡');}
  else {setText(title,rolls[0]===rolls[1]?'A tie! ♡':labels[rolls[0]>rolls[1]?0:1]+' wins! ✨');setText(note,'Back to Oasis in '+Math.max(0,Math.ceil((encounter.end_at-now())/1000))+'s');}
 }
 window.OasisBattle={identify:id=>{ownerId=Number(id);},sync,trigger,isFrozen,motionTime,timerTime,addMushrooms,overlap,observeContacts};
 (async()=>{try{const r=await fetch(api+'/account?view=oasis',{credentials:'include',headers:auth()});if(r.ok){const d=await r.json();ownerId=d.weebie?.id??null;}}catch(e){console.error(e);}})();
 poll();setInterval(poll,1000);setInterval(()=>{renderEncounter();applyFreeze();updateCooldowns();},80);
})();
