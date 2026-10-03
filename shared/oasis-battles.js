(() => {
 'use strict';
 const api='https://ratdoodle-accounts.ratdoodle8.workers.dev',scene=document.getElementById('oasis');
 let world={frozen_total:0,battle_start:0,battle_until:0},mobs=[],lastEvent=0,offset=0,requesting=false,overlay=null,overlayTimer=null;
 const mobActors=new Map();
 const now=()=>Date.now()+offset;
 function isFrozen(){return now()<world.battle_until;}
 function timerTime(t){return t+Math.max(0,world.battle_until-t);}
 function motionTime(t){return t-world.frozen_total+Math.max(0,world.battle_until-t);}
 function sync(data){
  if(data.serverTime)offset=Date.parse(data.serverTime)-Date.now();
  if(data.battleWorld)world=data.battleWorld;
  if(data.mushrooms){mobs=data.mushrooms;const live=new Set(mobs.map(m=>m.id));for(const [id,a] of mobActors)if(!live.has(id)){a.element.remove();mobActors.delete(id);}}
  const battle=data.battles?.[0];
  if(battle&&battle.id>lastEvent){lastEvent=battle.id;if(now()-battle.created_at<4000)showDice(battle);}
 }
 function applyFreeze(){
  const frozen=isFrozen();
  scene.querySelectorAll('.weebie,.weebie *, .death-marker,.death-marker *').forEach(n=>n.style.animationPlayState=frozen?'paused':'');
 }
 function addMushrooms(positions){
  for(const m of mobs){let a=mobActors.get(m.id);if(!a){const img=document.createElement('img');img.src='/shared/mush1.png';img.alt='Mushroom';img.className='wp-mushroom';img.style.left=m.x+'%';scene.append(img);a={element:img,data:{id:-m.id},interactionUntil:0};mobActors.set(m.id,a);}positions.push({actor:a,x:m.x});}
 }
 async function poll(){if(document.hidden)return;try{const r=await fetch(api+'/oasis/battle-state');if(r.ok)sync(await r.json());applyFreeze();}catch(e){console.error('Battle sync:',e);}}
 async function trigger(a,b,time){
  if(requesting||isFrozen())return;
  const token=typeof getSessionToken==='function'?getSessionToken():null;
  requesting=true;
  const h={'Content-Type':'application/json'};if(token)h.Authorization='Bearer '+token;
  const mushroomId=a<0?-a:b<0?-b:null;
  const body=mushroomId?{a:a>0?a:b,mushroomId,time}:{a,b,time};
  try {const r=await fetch(api+'/oasis/battle',{method:'POST',credentials:'include',headers:h,body:JSON.stringify(body)});if(r.ok){await poll();if(typeof loadOasis==='function')await loadOasis();}}
  catch(e){console.error('Battle:',e);}finally{requesting=false;}
 }
 function showDice(battle){
  overlay?.remove();if(overlayTimer)clearInterval(overlayTimer);
  overlay=document.createElement('div');overlay.className='wp-battle-message';overlay.setAttribute('role','status');scene.append(overlay);
  const aName=typeof actors!=='undefined'?actors.get(battle.a)?.data.name:null;
  const bName=battle.mushroom_id?'Mushroom':typeof actors!=='undefined'?actors.get(battle.b)?.data.name:null;
  const labels=[aName||'Weebie',bName||'Weebie'];
  const until=Number(world.battle_until),faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
  const roll=()=>{
   const running=now()<until;
   const ar=running?Math.floor(Math.random()*6)+1:battle.a_roll,br=running?Math.floor(Math.random()*6)+1:battle.b_roll;
   overlay.replaceChildren();const title=document.createElement('div');title.textContent='Battle!';overlay.append(title);
   const dice=document.createElement('div');dice.style.fontSize='40px';dice.textContent=faces[ar-1]+'  '+faces[br-1];overlay.append(dice);
   const names=document.createElement('div');names.textContent=`${labels[0]}: ${ar} · ${labels[1]}: ${br}`;overlay.append(names);
   if(!running){clearInterval(overlayTimer);overlayTimer=null;const result=document.createElement('div');result.textContent=ar===br?'Tie — timers unchanged':`${ar>br?labels[0]:labels[1]} wins! +${(battle.transferred_ms/1000).toFixed(1)}s · loser −3 minutes`;overlay.append(result);setTimeout(()=>{overlay?.remove();overlay=null;},1500);if(typeof loadOasis==='function')loadOasis();}
  };
  roll();if(now()<until)overlayTimer=setInterval(roll,80);
 }
 window.OasisBattle={sync,trigger,isFrozen,motionTime,timerTime,addMushrooms};
 poll();setInterval(poll,500);
})();
