/* Part 4: routing and interactions */
function stripHTML(st){
  if(!st)return '';
  if(st.type==='shell')return '<div class="codeblock shell"><pre><span class="p">$</span> '+esc(st.cmd)+'   <span class="c"># '+esc(st.note)+'</span></pre></div>';
  return '<div class="wire"><div class="wire-in">'+st.cells.map(function(x){return '<div style="flex:'+x[2]+'"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>';}).join('')
    +'</div><div class="wire-cap">'+esc(st.cap)+'</div></div>';
}

var CUR='home';
function setCrumb(t){document.getElementById('crumbCur').textContent=t;}
function route(){
  var id=(location.hash||'').slice(1)||'home';
  var land=document.getElementById('landing'),ws=document.getElementById('workspace'),doc=document.getElementById('doc');
  var w=byId(id);
  if(id==='setup'||w){
    CUR=id;land.hidden=true;ws.hidden=false;
    if(id==='setup'){doc.innerHTML=renderSetup();setCrumb('Setup');}
    else if(id==='final'){doc.innerHTML=renderFinalPage();setCrumb('Final project');}
    else{doc.innerHTML=renderWeekPage(w);setCrumb('Section '+w.num+' · '+w.title);}
    renderSide(id);
  } else {
    CUR='home';ws.hidden=true;land.hidden=false;renderLanding();setCrumb('Home');
  }
  document.getElementById('navHome').classList.toggle('on',CUR==='home');
  updateChip();
  try{window.scrollTo(0,0);}catch(e){}
}
window.addEventListener('hashchange',route);

function refreshQ(box){
  var w=byId(CUR),id=box.getAttribute('data-q'),i=+id.split('-').pop(),tmp=document.createElement('div');
  tmp.innerHTML=qHTML(w,w.check[i],i);box.replaceWith(tmp.firstChild);
  var s=stats(w),sc=document.getElementById('scoreN');if(sc)sc.textContent=s.qd+' / '+s.qt;
  renderSide(CUR);updateChip();
}
function copyCode(btn){
  var pre=btn.parentNode.querySelector('pre'),txt=pre.textContent;
  function flash(t){btn.textContent=t;setTimeout(function(){btn.textContent='Copy';},1500);}
  function fallback(){var r=document.createRange();r.selectNodeContents(pre);var s=window.getSelection();s.removeAllRanges();s.addRange(r);flash('Selected');}
  try{navigator.clipboard.writeText(txt).then(function(){flash('Copied');},fallback);}catch(e){fallback();}
}
function checkAnswer(box,q,id){
  var err=box.querySelector('.err'),a={};
  if(q.t==='choice'){
    var r=box.querySelector('input[type=radio]:checked');
    if(!r){err.textContent='Pick an option first.';return;}
    a.v=+r.value;a.ok=(a.v===q.a);
  } else if(q.t==='explain'){
    var v=box.querySelector('textarea').value.trim();
    if(v.length<15){err.textContent='Write at least a sentence first.';return;}
    var prev=S.ans[id];a.v=v;a.self=prev&&prev.self;a.ok=prev?prev.ok:null;
  } else {
    var raw=box.querySelector('input[type=text]').value.trim();
    if(!raw){err.textContent='Enter an answer first.';return;}
    a.v=raw;
    if(q.t==='num'){
      var n=parseFloat(raw.replace(/,/g,'').replace(/[^0-9.\-eE]/g,''));
      if(isNaN(n)){err.textContent='Enter a number, like 12 or 0.5.';return;}
      a.ok=Math.abs(n-q.a)<=q.tol+1e-9;
    } else {
      var norm=raw.toLowerCase().replace(/\s+/g,' ').replace(/\.$/,'');
      a.ok=q.acc.indexOf(norm)>=0;
    }
  }
  S.ans[id]=a;save();refreshQ(box);
}

document.addEventListener('click',function(e){
  var t=e.target;
  if(t.classList&&t.classList.contains('copy')){copyCode(t);return;}
  if(t.id==='resetQ'){
    if(t.getAttribute('data-arm')!=='1'){
      t.setAttribute('data-arm','1');t.textContent='Click again to reset';
      setTimeout(function(){if(t.isConnected){t.removeAttribute('data-arm');t.textContent='Reset answers';}},3000);return;
    }
    var w0=byId(CUR);w0.check.forEach(function(q,i){delete S.ans[w0.id+'-'+i];});save();route();
    var c=document.getElementById('b-check');if(c)c.scrollIntoView({block:'start'});return;
  }
  var box=t.closest&&t.closest('.q');if(!box)return;
  var w=byId(CUR),id=box.getAttribute('data-q'),i=+id.split('-').pop(),q=w.check[i];
  var act=t.getAttribute('data-act');
  if(act==='check'){checkAnswer(box,q,id);return;}
  if(act==='reveal'){var a2=S.ans[id];if(a2){a2.revealed=true;save();refreshQ(box);}return;}
  var self=t.getAttribute('data-self');
  if(self){var a3=S.ans[id]||{v:box.querySelector('textarea').value};a3.self=self;a3.ok=self==='got'?true:(self==='part'?'part':false);S.ans[id]=a3;save();refreshQ(box);}
});
document.addEventListener('input',function(e){var box=e.target.closest&&e.target.closest('.q');if(box){var err=box.querySelector('.err');if(err)err.textContent='';}});
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('.q input[type=text]')){e.preventDefault();e.target.closest('.q').querySelector('[data-act=check]').click();}
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.hasAttribute&&t.hasAttribute('data-done')){
    var pid=t.getAttribute('data-done');if(t.checked)S.done[pid]=1;else delete S.done[pid];save();
    t.closest('.prob').classList.toggle('done',t.checked);renderSide(CUR);updateChip();return;
  }
  if(t.hasAttribute&&t.hasAttribute('data-setup')){
    var sid=t.getAttribute('data-setup');if(t.checked)S.setup[sid]=1;else delete S.setup[sid];save();
    t.closest('.vrow').classList.toggle('on',t.checked);renderSide(CUR);return;
  }
  if(t.id==='jumpSel'){location.hash=t.value;return;}
  if(t.type==='radio'){var box=t.closest('.q');if(box){var err=box.querySelector('.err');if(err)err.textContent='';}}
});
route();
