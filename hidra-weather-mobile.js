/* HIDRA Mobile V9 — clima no modulo e painel completo, independente do servidor. */
(()=>{'use strict';
const api=window.HIDRAMobilePublic,modules=document.querySelector('.modules');
if(!modules||!api)return;
const tile=document.createElement('button');tile.type='button';tile.className='module hidra-weather-tile';tile.setAttribute('aria-label','Clima: abrir detalhes');
tile.innerHTML='<span class="symbol" id="hidraWeatherIcon" aria-hidden="true">☁</span><span id="hidraWeatherTileName">Clima</span><small id="hidraWeatherTileTemp" aria-live="polite">--°C</small><small id="hidraWeatherTileStatus" aria-live="polite"></small>';
modules.appendChild(tile);
const style=document.createElement('style');style.textContent=`
.hidra-weather-tile{position:relative;gap:2px!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center}
.hidra-weather-tile #hidraWeatherIcon{font-size:1.65rem;line-height:1.2}
.hidra-weather-tile #hidraWeatherTileTemp{font-size:1.22rem;font-weight:700;color:#b5f5ff;line-height:1.25}
.hidra-weather-tile #hidraWeatherTileStatus{font-size:.65rem;color:#8eafc2;min-height:.75rem}
`;document.head.appendChild(style);
const panel=document.createElement('section');panel.id='hidraWeatherPanel';panel.hidden=true;
panel.style.cssText='margin:12px 16px;padding:16px;border:1px solid #347d91;border-radius:14px;background:#082337;color:#d8faff;';
panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><strong>☁ CLIMA ATUAL</strong><button type="button" id="hidraWeatherClose">Fechar ✕</button></div><p id="hidraWeatherMain" role="status">Carregando…</p><p id="hidraWeatherDetails"></p><small id="hidraWeatherTime"></small><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" id="hidraWeatherRefresh">Atualizar</button><button type="button" id="hidraWeatherCity">Alterar cidade</button></div>';
(document.querySelector('main.app')||document.querySelector('main')||document.body).appendChild(panel);
for(const b of panel.querySelectorAll('button'))b.style.cssText='background:#15506a;color:#e9faff;border:1px solid #4aa7c0;border-radius:8px;padding:9px';
const el=id=>document.getElementById(id);
let lastCity='',busy=false,lastWeather=null;
function iconFor(description){const d=String(description||'').toLowerCase();if(/trovoada|tempestade/.test(d))return '⛈';if(/neve/.test(d))return '❄';if(/chuva|pancadas/.test(d))return '🌧';if(/neblina/.test(d))return '🌫';if(/parcialmente|nublado/.test(d))return '⛅';if(/limpo|sol/.test(d))return '☀';return '☁'}
function render(w){lastWeather=w;lastCity=w.city||lastCity;el('hidraWeatherIcon').textContent=iconFor(w.description);el('hidraWeatherTileTemp').textContent=Math.round(w.temp)+'°C';el('hidraWeatherTileStatus').textContent=w.stale?'Dado anterior':'';tile.setAttribute('aria-label','Clima em '+w.city+': '+Math.round(w.temp)+' graus, '+w.description+(w.stale?', informação anterior':'')+'. Abrir detalhes');
 el('hidraWeatherMain').textContent=(w.stale?'Última medição salva: ':'')+w.city+' · '+Math.round(w.temp)+' °C · '+w.description;
 const parts=[];if(Number.isFinite(w.feelsLike))parts.push('Sensação '+Math.round(w.feelsLike)+' °C');if(Number.isFinite(w.humidity))parts.push('Umidade '+Math.round(w.humidity)+'%');if(Number.isFinite(w.wind))parts.push('Vento '+Math.round(w.wind)+' km/h');el('hidraWeatherDetails').textContent=parts.join(' · ');
 el('hidraWeatherTime').textContent=(w.stale?'Sem atualização recente. ':'Fonte: Open-Meteo. ')+'Atualizado em '+new Date(w.updated).toLocaleString('pt-BR');}
async function refresh(){if(busy)return;const city=api.getWeatherCity();if(!city){el('hidraWeatherTileTemp').textContent='--°C';el('hidraWeatherTileStatus').textContent='Definir cidade';if(!panel.hidden)el('hidraWeatherMain').textContent='Escolha uma cidade em Alterar cidade.';return}
 busy=true;try{const w=await api.weather(city);render(w)}catch(e){el('hidraWeatherTileStatus').textContent='Indisponível';if(!panel.hidden)el('hidraWeatherMain').textContent='Clima indisponível: '+e.message}finally{busy=false}}
function open(){panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'nearest'});if(lastWeather)render(lastWeather);refresh()}
tile.addEventListener('click',open);el('hidraWeatherClose').onclick=()=>panel.hidden=true;el('hidraWeatherRefresh').onclick=refresh;
el('hidraWeatherCity').onclick=()=>{const city=prompt('Cidade para o clima',lastCity||api.getWeatherCity()||'');if(city&&city.trim()){api.setWeatherCity(city);refresh()}};
// A atualizacao acontece mesmo com o painel fechado, sem depender do servidor Python.
refresh();setInterval(()=>{if(!document.hidden)refresh()},10*60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
window.HidraWeather={open,refresh};
})();
