/* HIDRA Mobile — painel meteorológico independente do servidor, sem alertas. */
(()=>{'use strict';
const modules=document.querySelector('.modules');if(!modules||!window.HIDRAMobilePublic)return;
const tile=document.createElement('button');tile.type='button';tile.className='module';tile.innerHTML='<span class="symbol">☁</span><span>Clima</span>';
const panel=document.createElement('section');panel.id='hidraWeatherPanel';panel.hidden=true;
panel.style.cssText='margin:12px 16px;padding:16px;border:1px solid #347d91;border-radius:14px;background:#082337;color:#d8faff;';
panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><strong>☁ CLIMA ATUAL</strong><button type="button" id="hidraWeatherClose">Fechar ✕</button></div><p id="hidraWeatherMain" role="status">Carregando…</p><p id="hidraWeatherDetails"></p><small id="hidraWeatherTime"></small><div style="display:flex;gap:8px;margin-top:12px"><button type="button" id="hidraWeatherRefresh">Atualizar</button><button type="button" id="hidraWeatherCity">Alterar cidade</button></div>';
const main=document.querySelector('main.app')||document.querySelector('main')||document.body;main.appendChild(panel);
for(const b of panel.querySelectorAll('button'))b.style.cssText='background:#15506a;color:#e9faff;border:1px solid #4aa7c0;border-radius:8px;padding:9px';
let lastCity='',busy=false;
async function refresh(){if(busy||panel.hidden)return;busy=true;const status=panel.querySelector('#hidraWeatherMain');status.textContent='Atualizando condições meteorológicas…';try{
 let city=window.HIDRAMobilePublic.getWeatherCity();if(!city){status.textContent='Escolha uma cidade em Alterar cidade.';return}
 const w=await window.HIDRAMobilePublic.weather(city);lastCity=w.city;
 status.textContent=(w.stale?'Última medição salva: ':'')+w.city+' · '+Math.round(w.temp)+' °C · '+w.description;
 const parts=[];if(Number.isFinite(w.feelsLike))parts.push('Sensação '+Math.round(w.feelsLike)+' °C');if(Number.isFinite(w.humidity))parts.push('Umidade '+Math.round(w.humidity)+'%');if(Number.isFinite(w.wind))parts.push('Vento '+Math.round(w.wind)+' km/h');panel.querySelector('#hidraWeatherDetails').textContent=parts.join(' · ');
 panel.querySelector('#hidraWeatherTime').textContent=(w.stale?'Sem conexão com a fonte. ':'Fonte: Open-Meteo. ')+'Atualizado em '+new Date(w.updated).toLocaleString('pt-BR');
 }catch(e){status.textContent='Clima indisponível: '+e.message}finally{busy=false}}
function open(){panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'nearest'});refresh()}
tile.onclick=open;modules.appendChild(tile);
panel.querySelector('#hidraWeatherClose').onclick=()=>panel.hidden=true;
panel.querySelector('#hidraWeatherRefresh').onclick=refresh;
panel.querySelector('#hidraWeatherCity').onclick=()=>{const c=prompt('Cidade para o clima',lastCity||window.HIDRAMobilePublic.getWeatherCity()||'');if(c&&c.trim()){window.HIDRAMobilePublic.setWeatherCity(c);refresh()}};
setInterval(()=>{if(!document.hidden&&navigator.onLine&&!panel.hidden)refresh()},10*60*1000);
window.HidraWeather={open,refresh};
})();
