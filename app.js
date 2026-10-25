const invitation=document.querySelector('#invitation');
const reopen=document.querySelector('#reopen');
const form=document.querySelector('#booking-form');
const date=document.querySelector('#date');
const day=document.querySelector('#weekday');
const status=document.querySelector('#form-status');
const fallback=document.querySelector('#email-fallback');
let opened=false;
let lastTrigger=null;
let submitted=false;
const berlinToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
date.min=berlinToday();
function openInvitation(trigger,city){
  opened=true;
  if(city) document.querySelector('#city').value=city;
  invitation.hidden=false;
  reopen.hidden=true;
  if(trigger){lastTrigger=trigger;document.querySelector('#close-invite').focus({preventScroll:true});}
}
function closeInvitation(){
  invitation.hidden=true;reopen.hidden=false;
  if(invitation.contains(document.activeElement)) (lastTrigger?.isConnected?lastTrigger:reopen).focus({preventScroll:true});
}
document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>openInvitation(button,button.dataset.city)));
document.querySelector('#close-invite').addEventListener('click',closeInvitation);
reopen.addEventListener('click',()=>openInvitation(reopen));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!invitation.hidden) closeInvitation();});
setTimeout(()=>{if(!opened)openInvitation();},5500);
date.addEventListener('change',()=>{
  if(date.value){const parsed=new Date(date.value+'T12:00:00');day.value=String(parsed.getDay());}
  date.setCustomValidity('');
});
day.addEventListener('change',()=>{
  if(date.value&&String(new Date(date.value+'T12:00:00').getDay())!==day.value)date.value='';
});
form.addEventListener('input',()=>{if(submitted){submitted=false;status.textContent='';form.querySelector('[type="submit"]').disabled=false;}});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(submitted||form.querySelector('[type="submit"]').disabled)return;
  date.min=berlinToday();
  if(date.value&&date.value<date.min){date.setCustomValidity('Выбери сегодняшнюю или будущую дату.');date.reportValidity();return;}
  if(!form.reportValidity())return;
  if(form.elements._honey.value)return;
  const button=form.querySelector('[type="submit"]');
  const original=button.innerHTML;
  const payload=Object.fromEntries(new FormData(form));
  payload['День недели']=day.selectedOptions[0].textContent;
  payload['Дата']=date.value||'Дату согласуем лично';
  payload['Часовой пояс']='Europe/Berlin — местное время Германии';
  const body=`Привет, Даник! Хочу на прогулку.\n\nГород: ${payload['Город']}\nДень: ${payload['День недели']}\nДата: ${payload['Дата']}\nВремя: ${payload['Время']} (по Германии)\nПожелание: ${payload['Пожелание']||'Пока нет'}\n\nДо встречи!`;
  fallback.href='mailto:danko.penko@gmail.com?subject='+encodeURIComponent('Есть планы на прогулку')+'&body='+encodeURIComponent(body);
  fallback.hidden=true;button.disabled=true;button.textContent='Отправляю приглашение…';status.textContent='';
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch('https://formsubmit.co/ajax/danko.penko@gmail.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json();
    if(!response.ok||!(result.success===true||result.success==='true'))throw new Error('Submission rejected');
    submitted=true;status.textContent='Заявка принята. Теперь осталось договориться о встрече. Если хочется, напиши Данику и в вашем чате.';button.textContent='До встречи на прогулке';
  }catch(error){
    status.textContent='Не удалось подтвердить отправку. Можно попробовать ещё раз или отправить готовое письмо через свою почту.';
    fallback.hidden=false;button.innerHTML=original;button.disabled=false;
  }finally{clearTimeout(timeout);}
});
