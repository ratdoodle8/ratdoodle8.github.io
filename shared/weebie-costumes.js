/* Only draws equipment inside an existing Weebie container. No battle or animation handlers. */
(() => {
 'use strict';
 function render(container,items){
  if(!container||!Array.isArray(items))return;
  const worn=items.filter(item=>item&&item.image&&!/background/i.test(item.placement||'')).sort((a,b)=>Number(a.layernumber||0)-Number(b.layernumber||0));
  const key=JSON.stringify(worn.map(item=>[item.id,item.image,item.layernumber]));
  if(container.dataset.costumeKey===key)return;
  container.dataset.costumeKey=key;
  for(const child of Array.from(container.children))if(child.classList.contains('rd-costume-layer'))child.remove();
  for(const item of worn){const image=document.createElement('img');image.className='rd-costume-layer';image.src=item.image;image.alt='';image.draggable=false;image.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:'+String(10+Math.max(0,Math.min(100,Number(item.layernumber)||0)));container.append(image);}
 }
 window.WeebieCostumes={render};
})();
