/* Additive private progression UI. No timers, input handlers or art from existing pages are replaced. */
(() => {
 'use strict';
 const api='https://ratdoodle-accounts.ratdoodle8.workers.dev';
 const pagePath=location.pathname.replace(/\/index\.html$/i,'/');
 const privatePage=/^\/account\/?$/.test(pagePath);
 const training=/^\/training\/?$/.test(pagePath);
 const oasis=/^\/oasis\/?$/.test(pagePath);
 if(!privatePage&&!training&&!oasis)return;
 let state=null,busy=false,dialog=null,dismissedPoints='',lastInput=0,inputPending=false;
 const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 function headers(){const h={'Content-Type':'application/json'};const token=typeof getSessionToken==='function'?getSessionToken():localStorage.getItem('rd_session');if(token)h.Authorization='Bearer '+token;return h;}
 async function request(path,body){const r=await fetch(api+path,{method:body===undefined?'GET':'POST',credentials:'include',headers:headers(),...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok){const e=new Error(d.error||'Unable to update progression.');e.status=r.status;throw e;}return d;}
 function bar(label,value,detail){const section=el('div',undefined,'wp-bar-section');section.append(el('p',label));const track=el('div',undefined,'wp-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(Math.round(value*100)));const fill=el('div',undefined,'wp-fill');fill.style.width=Math.max(0,Math.min(100,value*100))+'%';track.append(fill);if(training){for(const percentage of [25,50,75]){const tick=el('span',undefined,'wp-quarter-line');tick.style.left=percentage+'%';tick.setAttribute('aria-hidden','true');track.append(tick);}}section.append(track,el('small',detail));return section;}
 let panel;
 function render(){
  if(!state)return;
  if(privatePage){
   const target=document.getElementById('weebieDisplay');if(!target||target.style.display==='none')return;
   if(!panel){panel=el('section',undefined,'wp-panel');panel.id='privateProgression';target.append(panel);}
   panel.replaceChildren();
   panel.append(el('p',`${state.currencyPlural}: ${state.coins.toLocaleString()}`));
   const b=state.boost;
   panel.append(bar('Daily '+state.currencyName+' boost',b.progress,b.end===null?`Maximum boost reached · 1 coin / ${b.rate} minutes`:`${Math.floor(b.minutes)} / ${b.end} active minutes · 1 coin / ${b.rate} minutes`));
   panel.append(bar('Level '+state.level+' → '+(state.level+1),state.progress,`${state.xp-state.startXP} / ${state.nextXP-state.startXP} XP`));
   panel.append(el('p',`PWR: ${state.modifiers.PWR} · DEX: ${state.modifiers.DEX} · DEF: ${state.modifiers.DEF}`));
   if(state.unspentPoints){const button=el('button',`Allocate ${state.unspentPoints} stat point${state.unspentPoints===1?'':'s'}`);button.onclick=()=>pointAlert();panel.append(button);}
  }
  if(training){
   if(!panel){panel=el('section',undefined,'wp-panel wp-training');panel.id='quarterLevelRewards';const trainingArea=document.getElementById('page');if(trainingArea)trainingArea.after(panel);else document.body.append(panel);}
   panel.replaceChildren(el('h2','Level rewards'),el('p',`Level ${state.level} · ${state.xp.toLocaleString()} XP`),el('p','Unlock one food or swag item at every quarter-level milestone.'));
   const markers=el('div',undefined,'wp-milestones');
   // Show all four markers of the CURRENT level interval, including completed ones.
   const interval=state.nextXP-state.startXP;
   for(let q=1;q<=4;q++){const at=state.startXP+interval*q/4;const marker=el('div',undefined,'wp-marker');marker.append(el('span',state.xp>=at?'✓':'?'),el('small',at.toLocaleString()+' XP'));if(state.xp>=at)marker.classList.add('wp-earned');markers.append(marker);}
   panel.append(markers,bar('Progress to level '+(state.level+1),state.progress,`${state.xp-state.startXP} / ${interval} XP`));
  }
  alerts();
 }
 function makeDialog(title){
  if(dialog)return null;
  const d=el('dialog',undefined,'wp-dialog');d.append(el('h2',title));document.body.append(d);dialog=d;
  d.addEventListener('cancel',e=>e.preventDefault());d.showModal();return d;
 }
 function closeDialog(){if(dialog){dialog.close();dialog.remove();dialog=null;}}
 async function acknowledge(item,view,button){
  button.disabled=true;
  try {state=await request('/progression/ack',{milestone:item.milestone});closeDialog();if(view){if(privatePage){document.getElementById('inventoryPanel')?.scrollIntoView({behavior:'smooth'});if(typeof loadInventory==='function')await loadInventory();}else{location.href='/account/#inventoryPanel';return;}}render();}
  catch(e){button.disabled=false;dialog?.append(el('p',e.message));}
 }
 function itemAlert(item){
  const d=makeDialog('Congratulations!!');if(!d)return;
  const img=el('img');img.src=item.image;img.alt=item.title;img.className='wp-reward-image';
  d.append(img,el('p',`Your hard work paid off—you unlocked a new ${item.type==='swag'?'swag':'food'} item: ${item.title}!`),el('p','Check it out in your inventory!'));
  const actions=el('div',undefined,'wp-actions');
  for(const [label,view] of [['view inventory',true],['dismiss',false]]){const b=el('button',label);b.onclick=()=>acknowledge(item,view,b);actions.append(b);}d.append(actions);
 }
 function pointAlert(){
  if(!state?.unspentPoints)return;
  const d=makeDialog('Stat points available!');if(!d)return;
  d.append(el('p',`You have ${state.unspentPoints} points to split among PWR, DEX and DEF.`));
  const form=el('form'),inputs={};
  for(const key of ['PWR','DEX','DEF']){const label=el('label',key+': ');const input=el('input');input.type='number';input.min='0';input.max=String(state.unspentPoints);input.step='1';input.value='0';input.required=true;input.setAttribute('aria-label',key+' points');inputs[key]=input;label.append(input);form.append(label);}
  const feedback=el('p'),save=el('button','allocate points');save.type='submit';const later=el('button','dismiss');later.type='button';
  later.onclick=()=>{dismissedPoints=state.weebieId+':'+state.pointsEntitled;closeDialog();render();};
  form.append(feedback,save,later);form.onsubmit=async e=>{e.preventDefault();const values=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,Number(v.value)]));const sum=Object.values(values).reduce((a,b)=>a+b,0);if(sum<1||sum>state.unspentPoints){feedback.textContent='Choose between 1 and '+state.unspentPoints+' points.';return;}save.disabled=true;try{state=await request('/progression/allocate',values);closeDialog();render();}catch(error){feedback.textContent=error.message;save.disabled=false;}};d.append(form);
 }
 function alerts(){if(dialog)return;if(state.pendingRewards.length){itemAlert(state.pendingRewards[0]);return;}if(state.unspentPoints&&dismissedPoints!==state.weebieId+':'+state.pointsEntitled)pointAlert();}
 async function refresh(){if(busy||document.hidden)return;busy=true;try{state=await request('/progression');render();}catch(e){if(e.status!==401)console.error(e);}finally{busy=false;}}
 // Trusted input records attention. Merely leaving a visible tab open never renews attention.
 for(const type of ['pointerdown','keydown','touchstart','wheel'])document.addEventListener(type,e=>{if(e.isTrusted&&!document.hidden){lastInput=Date.now();inputPending=true;}},{passive:true});
 async function pulse(){
  if(!oasis||document.hidden||busy)return;
  busy=true;const active=inputPending&&Date.now()-lastInput<30000;inputPending=false;
  try{state=await request('/oasis/pulse',{active});render();}catch(e){if(e.status!==401)console.error(e);}finally{busy=false;}
 }
 if(oasis)setInterval(pulse,15000);
 window.WeebieProgression={refresh};
 refresh();setInterval(refresh,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
