(() => {
 'use strict';
 const api='https://ratdoodle-accounts.ratdoodle8.workers.dev',scene=document.getElementById('oasis');
 let world={frozen_total:0,battle_start:0,battle_until:0},mobs=[],offset=0,requesting=false,ownerId=null,encounter=null,overlay=null,overlayKey='',acknowledged=false;
 const mobActors=new Map(),contactLatch=new Set();
 const now=()=>Date.now()+offset;
 const token=()=>typeof getSessionToken==='function'?getSessionToken():null;
 function auth(){const h={'Content-Type':'application/json'};if(token())h.Authorization='Bearer '+token();return h;}
 function isFrozen(){return requesting||now()<world.battle_until;}
 function timerTime(t){return t+Math.max(0,world.battle_until-t);}
 function motionTime(t){return t-world.frozen_total+Math.max(0,world.battle_until-t);}
 function bodyRect(actor){return (actor.element.querySelector?.('.weebie-body')||actor.element).getBoundingClientRect();}
 function overlap(a,b){const x=bodyRect(a),y=bodyRect(b);return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;}
 const pairKey=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
 function observeContacts(positions){for(const key of contactLatch){const [a,b]=key.split(':').map(Number),first=positions.find(p=>p.actor.data.id===a),second=positions.find(p=>p.actor.data.id===b);if(!first||!second||!overlap(first.actor,second.actor))contactLatch.delete(key);}}
 function sync(data){
  if(data.serverTime)offset=Date.parse(data.serverTime)-Date.now();
  if(data.battleWorld)world=data.battleWorld;
  if(data.mushrooms){mobs=data.mushrooms;const live=new Set(mobs.map(m=>m.id));for(const [id,a] of mobActors)if(!live.has(id)){a.element.remove();mobActors.delete(id);}}
  if('encounter' in data){const oldId=encounter?.id;encounter=data.encounter;if(encounter?.id!==oldId){acknowledged=false;overlayKey='';}if(encounter){contactLatch.add(pairKey(encounter.a,encounter.b||-encounter.mushroom_id));}}
  renderEncounter();applyFreeze();
 }
 function applyFreeze(){const frozen=isFrozen();scene.querySelectorAll('.weebie,.weebie *, .death-marker,.death-marker *, .wp-mushroom').forEach(n=>n.style.animationPlayState=frozen?'paused':'');}
 function addMushrooms(positions){
  for(const m of mobs){let a=mobActors.get(m.id);if(!a){const img=document.createElement('img');img.src='/shared/eraser-bot.png';img.alt='Eraser-Bot';img.className='wp-mushroom';img.style.left=m.x+'%';scene.append(img);a={element:img,data:{id:-m.id},interactionUntil:0};mobActors.set(m.id,a);}positions.push({actor:a,x:m.x});}
 }
 async function poll(){if(document.hidden)return;try{const r=await fetch(api+'/oasis/battle-state');if(r.ok)sync(await r.json());}catch(e){console.error('Battle sync:',e);}}
 function trigger(a,b,time){
  const key=pairKey(a,b);if(requesting||isFrozen()||contactLatch.has(key)||ownerId===null)return false;
  requesting=true;contactLatch.add(key);applyFreeze();
  const mushroomId=a<0?-a:b<0?-b:null;
  const body=mushroomId?{a:a>0?a:b,mushroomId,time}:{a,b,time};
  body.sceneWidth=Math.min(1000,scene.clientWidth);body.bodySize=window.matchMedia('(max-width: 600px)').matches?78:100;
  (async()=>{try{const r=await fetch(api+'/oasis/battle',{method:'POST',credentials:'include',headers:auth(),body:JSON.stringify(body)});const result=await r.json();if(!r.ok||!result.accepted)contactLatch.delete(key);await poll();if(typeof loadOasis==='function')await loadOasis();}catch(e){contactLatch.delete(key);console.error('Battle:',e);}finally{requesting=false;applyFreeze();}})();
  return true;
 }
 async function roll(){const button=overlay?.querySelector('button');if(button)button.disabled=true;try{const r=await fetch(api+'/oasis/roll',{method:'POST',credentials:'include',headers:auth(),body:JSON.stringify({encounterId:encounter.id})});if(r.ok)sync(await r.json());else if(button)button.disabled=false;}catch(e){if(button)button.disabled=false;console.error(e);}}
 function renderEncounter(){
  if(!encounter||now()>=encounter.end_at){overlay?.remove();overlay=null;overlayKey='';return;}
  const stage=now()<encounter.roll_at?'waiting':!encounter.applied?'rolling':'result';
  const key=encounter.id+':'+stage;
  if(!overlay){overlay=document.createElement('div');overlay.className='wp-battle-message';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Oasis battle');overlay.setAttribute('aria-live','polite');scene.append(overlay);}
  if(key!==overlayKey){overlayKey=key;overlay.replaceChildren();const title=document.createElement('strong');title.textContent='Battle!';overlay.append(title);const text=document.createElement('div');text.className='wp-battle-text';overlay.append(text);const note=document.createElement('small');note.className='wp-battle-countdown';overlay.append(note);
   if(stage==='waiting'&&[encounter.a,encounter.b].includes(ownerId)){const button=document.createElement('button');button.textContent='Roll';button.onclick=roll;overlay.append(button);}
   if(stage==='result'){const dice=document.createElement('div');dice.className='wp-final-dice';dice.style.fontSize='48px';dice.style.lineHeight='1.3';dice.setAttribute('aria-label','Final dice rolls');overlay.insertBefore(dice,text);const button=document.createElement('button');button.textContent=acknowledged?'Acknowledged':'Okay';button.disabled=acknowledged;button.onclick=()=>{acknowledged=true;button.textContent='Acknowledged';button.disabled=true;};overlay.append(button);if(typeof loadOasis==='function')loadOasis();}
  }
  const aName=typeof actors!=='undefined'?actors.get(encounter.a)?.data.name:null,bName=encounter.mushroom_id?'Eraser-Bot':typeof actors!=='undefined'?actors.get(encounter.b)?.data.name:null;
  const labels=[aName||'Weebie',bName||'Weebie'],text=overlay.querySelector('.wp-battle-text'),note=overlay.querySelector('.wp-battle-countdown');
  if(stage==='waiting'){text.textContent=labels.join(' vs ');note.textContent='First Roll starts both dice. Automatic roll in '+Math.max(0,Math.ceil((encounter.roll_at-now())/1000))+'s.';}
  else if(stage==='rolling'){const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];text.textContent=faces[Math.floor(Math.random()*6)]+'  '+faces[Math.floor(Math.random()*6)];text.style.fontSize='40px';note.textContent='Rolling…';}
  else {text.style.fontSize='14px';const ar=encounter.a_roll,br=encounter.b_roll;const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];overlay.querySelector('.wp-final-dice').textContent=faces[ar-1]+'  '+faces[br-1];const winLabel=ar>br?labels[0]:labels[1],loseLabel=ar>br?labels[1]:labels[0];text.textContent=`${labels[0]} rolled ${ar}; ${labels[1]} rolled ${br}. `+(ar===br?'Tie — neither timer changes.':`${winLabel} wins!`+(encounter.winner!==null?' +'+(encounter.boost_ms/1000).toFixed(1)+' seconds. ':' ')+loseLabel+(encounter.mushroom_id&&ar>br?' is defeated.':' loses 3 minutes.'));note.textContent='Oasis resumes in '+Math.max(0,Math.ceil((encounter.end_at-now())/1000))+'s.';}
 }
 window.OasisBattle={sync,trigger,isFrozen,motionTime,timerTime,addMushrooms,overlap,observeContacts};
 (async()=>{try{const r=await fetch(api+'/account',{credentials:'include',headers:auth()});if(r.ok){const d=await r.json();ownerId=d.weebie?.id??null;}}catch(e){console.error(e);}})();
 poll();setInterval(poll,400);setInterval(()=>{renderEncounter();applyFreeze();},80);
})();
