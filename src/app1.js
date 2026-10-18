/* Part 1: state, helpers, landing */
var KEY='first-packet-v2', S={done:{},ans:{},setup:{},code:{}};
try{var raw=localStorage.getItem(KEY);if(raw){var pp=JSON.parse(raw);if(pp&&typeof pp==='object'){S.done=pp.done||{};S.ans=pp.ans||{};S.setup=pp.setup||{};S.code=pp.code||{};}}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

var PAGES=WEEKS.concat([FINAL]);
var TINT=['purple','blue','green','orange','red','yellow','pink'];
function byId(id){for(var i=0;i<PAGES.length;i++)if(PAGES[i].id===id)return PAGES[i];return null;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function psetsOf(w){return w.id==='final'?[FINAL.pset]:w.psets;}
function stats(w){
  var ps=psetsOf(w),pd=0;ps.forEach(function(p){if(S.done[p.id])pd++;});
  var qs=w.check||[],qd=0;qs.forEach(function(q,i){var a=S.ans[w.id+'-'+i];if(a&&a.ok===true)qd++;});
  return {pd:pd,pt:ps.length,qd:qd,qt:qs.length};
}
function setupStats(){var d=0;SETUP.verify.forEach(function(v){if(S.setup[v.id])d++;});return {d:d,t:SETUP.verify.length};}
function totals(){var d=0,t=0;PAGES.forEach(function(w){var s=stats(w);d+=s.pd+s.qd;t+=s.pt+s.qt;});return {d:d,t:t};}
function updateChip(){var t=totals();document.getElementById('pchip').textContent=t.d+' / '+t.t+' done';}
function label(w){return w.id==='final'?'Final project':'Week '+w.num;}
function refLink(r){
  if(r[0]==='Setup')return '<a href="#setup">Setup</a>: '+esc(r[1]);
  var w=byId(r[0]);return '<a href="#'+w.id+'">'+label(w)+'</a>: '+esc(r[1]);
}
function codeBlock(code,lang){
  return '<div class="codeblock'+(lang?' has-lang':'')+'">'+(lang?'<span class="lang">'+esc(lang)+'</span>':'')
    +'<pre>'+esc(code)+'</pre><button class="btn sm copy" type="button">Copy</button></div>';
}
function meter(d,t){return '<div class="meter"><div class="bar"><i style="width:'+(t?d/t*100:0)+'%"></i></div><span>'+d+'/'+t+'</span></div>';}

function renderLanding(){
  var ss=setupStats(),g='';
  g+='<a class="g-card" href="#setup"><div class="g-top" style="background:var(--t-gray);color:var(--muted)">Start here</div>'
    +'<div class="g-body"><h3>Setup: build your lab</h3><p>Two virtual machines, Wireshark, Docker, containerlab and the course Python environment.</p>'+meter(ss.d,ss.t)+'</div></a>';
  PAGES.forEach(function(w,i){
    var s=stats(w),c=w.id==='final'?'purple':TINT[i%TINT.length];
    g+='<a class="g-card" href="#'+w.id+'"><div class="g-top" style="background:var(--t-'+c+');color:var(--c-'+c+')">'+label(w)+'</div>'
      +'<div class="g-body"><h3>'+esc(w.title)+'</h3><p>'+esc(w.blurb)+'</p>'+meter(s.pd+s.qd,s.pt+s.qt)+'</div></a>';
  });
  document.getElementById('gallery').innerHTML=g;
  var r='';
  WEEKS.forEach(function(w,i){
    r+='<tr><td><a href="#'+w.id+'">'+label(w)+'</a></td><td><span class="tag '+TINT[i%TINT.length]+'">'+esc(w.title)+'</span></td>'
      +'<td>'+w.psets.map(function(p){return esc(p.title);}).join(', ')+'</td><td>'+esc(EMBER[w.id].ms)+'</td></tr>';
  });
  r+='<tr><td><a href="#final">Final</a></td><td><span class="tag purple">Capstone</span></td><td>Your project</td><td>Ember 1.0: deployed, attacked, fixed and presented.</td></tr>';
  document.getElementById('roadmap').innerHTML=r;
}
