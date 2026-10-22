(() => {
 'use strict';
 const API='https://ratdoodle-accounts.ratdoodle8.workers.dev';
 let ready=false,activeDialog=null,checking=false,notices=[],noticed=new Set();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function id(){return crypto.randomUUID().replace(/-/g,'');}
 function headers(){const h={'Content-Type':'application/json'};let token=null;try{token=typeof getSessionToken==='function'?getSessionToken():localStorage.getItem('rd_session');}catch{}if(token)h.Authorization='Bearer '+token;return h;}
 async function request(path,body){const response=await fetch(API+path,{method:body===undefined?'GET':'POST',credentials:'include',headers:headers(),...(body===undefined?{}:{body:JSON.stringify(body)})});let data;try{data=await response.json();}catch{throw Error('Server returned an unreadable response. Retry this action.');}if(!response.ok){const error=Error(data.error||'Unable to complete this action.');error.status=response.status;throw error;}return data;}
 function close(){if(activeDialog){activeDialog.close();activeDialog.remove();activeDialog=null;}setTimeout(nextNotice,100);}
 function dialog(title){if(activeDialog||document.querySelector('dialog[open]'))return null;const d=el('dialog');d.className='rd-item-dialog';d.append(el('h2',title));d.addEventListener('cancel',event=>{event.preventDefault();if(d.dataset.pending!=='true'&&d.dataset.notice!=='true')close();});document.body.append(d);activeDialog=d;d.showModal();return d;}
 function button(parent,text,click){const b=el('button',text);b.type='button';b.onclick=click;parent.append(b);return b;}
 function feedback(parent){const p=el('p');p.className='rd-item-feedback';p.setAttribute('role','status');parent.append(p);return p;}
 function showItem(item,message){const d=dialog(message||'Item received!');if(!d)return;const image=el('img');image.src=item.image;image.alt=item.title;d.append(image,el('p',item.title));button(d,'OK',close);}
 async function refreshInventory(){if(typeof loadInventory==='function')await loadInventory();}
 function actionButton(d,label,path,body,onSuccess){
  const output=feedback(d);let pending=false;const requestBody={...body,requestId:id()};
  const confirm=button(d,label,async()=>{if(pending)return;pending=true;confirm.disabled=true;cancel.disabled=true;d.dataset.pending='true';output.textContent='Please wait…';try{const result=await request(path,requestBody);close();try{await refreshInventory();}catch{}if(onSuccess)await onSuccess(result);}catch(error){output.textContent=error.message;confirm.textContent='Retry';}finally{pending=false;confirm.disabled=false;cancel.disabled=false;d.dataset.pending='false';}});
  const cancel=button(d,'Cancel',close);return confirm;
 }
 function gift(item){close();const d=dialog('gift to someone!');if(!d)return;
  const label=el('label','Who would you like to gift this item to?'),input=el('input');input.type='text';input.autocomplete='off';input.maxLength=30;label.append(input);d.append(label);
  const anonymousLabel=el('label'),anonymous=el('input');anonymous.type='checkbox';anonymousLabel.append(anonymous,document.createTextNode(' Would u like to remain anonymous?'));d.append(anonymousLabel);
  const output=feedback(d);const check=button(d,'Check username',async()=>{check.disabled=true;input.disabled=true;anonymous.disabled=true;d.dataset.pending='true';try{const result=await request('/items/recipient',{username:input.value.trim()});const recipient=result.recipient;d.replaceChildren(el('h2','Confirm gift'),el('p','Give one '+item.title+' to '+recipient.username+'?'),el('p',anonymous.checked?'Your username will be hidden.':'Your username will be shown.'));actionButton(d,'Confirm gift','/items/gift',{itemId:item.id,username:recipient.username,recipientId:recipient.id,anonymous:anonymous.checked},()=>showItem(item,'Gift sent!'));}catch(error){output.textContent=error.message;input.disabled=false;anonymous.disabled=false;check.disabled=false;}finally{d.dataset.pending='false';}});button(d,'Cancel',close);
 }
 function discard(item){close();const d=dialog('Throw item away');if(!d)return;d.append(el('p','Are you sure you would like to throw this away?'),el('p','One copy of '+item.title+' will be removed.'));actionButton(d,'Throw away','/items/discard',{itemId:item.id});}
 function addOptions(card,item){if(!ready||Number(item.quantity)<=0||card.querySelector('.rd-item-gear'))return;const gear=button(card,'⚙',()=>{const d=dialog('Item Options');if(!d)return;d.append(el('p',item.title));button(d,'gift to someone!',()=>gift(item));button(d,'throw item away',()=>discard(item));button(d,'Close',close);});gear.className='rd-item-gear';gear.setAttribute('aria-label','Item Options: '+item.title);}
 function nextNotice(){if(activeDialog||document.querySelector('dialog[open]')||!notices.length)return;const gift=notices[0],d=dialog('Item received!');if(!d)return;d.dataset.notice='true';const img=el('img');img.src=gift.item.image;img.alt=gift.item.title;d.append(img,el('p',gift.sender+' gifted u '+gift.item.title+'!'));const output=feedback(d);let busy=false;
  // Dismissal is persisted only after the user has seen the notice.
  d.addEventListener('cancel',event=>event.preventDefault());
  const ok=button(d,'OK',async()=>{if(busy)return;busy=true;ok.disabled=true;d.dataset.pending='true';try{await request('/items/gifts/ack',{id:gift.id});notices.shift();close();await refreshInventory();}catch(error){output.textContent=error.message;ok.disabled=false;}finally{busy=false;d.dataset.pending='false';}});
 }
 async function checkGifts(){if(!ready||checking||document.hidden||typeof currentWeebie==='undefined'||!currentWeebie)return;checking=true;try{const data=await request('/items/gifts');for(const gift of data.gifts||[])if(!noticed.has(gift.id)){noticed.add(gift.id);notices.push(gift);}nextNotice();}catch(error){if(error.status!==401)console.warn('Gift notices:',error);}finally{checking=false;}}
 async function initialize(){try{const status=await request('/items/status');ready=status.ready===true;if(ready&&typeof renderInventory==='function')renderInventory();await checkGifts();}catch(error){console.warn('Optional item features unavailable:',error);}}
 function notify(message){const d=dialog('Redeem');if(d){d.append(el('p',message));button(d,'OK',close);}}
 window.RatdoodleItems={addOptions,checkGifts,request,showItem,notify};
 if(/^\/account(?:\/|$)/.test(location.pathname)){initialize();setInterval(()=>{if(notices.length)nextNotice();},1500);setInterval(checkGifts,30000);}
})();
