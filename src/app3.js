/* Part 3: sidebar and pages */
function renderSide(cur){
  var ss=setupStats();
  var h='<div class="grp">Start here</div>'
    +'<a href="#home"><span class="ic">~</span><span>Course home</span><span></span></a>'
    +'<a href="#setup"'+(cur==='setup'?' class="on" aria-current="page"':'')+'><span class="ic">S</span><span>Setup</span><span class="s'+(ss.d===ss.t?' full':'')+'">'+ss.d+'/'+ss.t+'</span></a>'
    +'<div class="grp">Weeks</div>';
  PAGES.forEach(function(w){
    if(w.id==='final')h+='<div class="grp">Capstone</div>';
    var s=stats(w),t=s.pt+s.qt,d=s.pd+s.qd;
    h+='<a href="#'+w.id+'"'+(w.id===cur?' class="on" aria-current="page"':'')+'><span class="ic">'+(w.id==='final'?'F':w.num)+'</span>'
      +'<span>'+esc(w.title)+'</span><span class="s'+(t&&d===t?' full':'')+'">'+d+'/'+t+'</span></a>';
  });
  document.getElementById('side').innerHTML=h;
  var sel='<select id="jumpSel" aria-label="Go to page"><option value="home">Course home</option><option value="setup"'+(cur==='setup'?' selected':'')+'>Setup</option>';
  PAGES.forEach(function(w){sel+='<option value="'+w.id+'"'+(w.id===cur?' selected':'')+'>'+(w.id==='final'?'Final project':'Week '+w.num+' · '+esc(w.title))+'</option>';});
  document.getElementById('jump').innerHTML=sel+'</select>';
}

function pagerHTML(prev,next){
  var h='<div class="pager">';
  if(prev)h+='<a href="#'+prev[0]+'"><span>← Previous</span><b>'+esc(prev[1])+'</b></a>';
  if(next)h+='<a class="next" href="#'+next[0]+'"><span>Next →</span><b>'+esc(next[1])+'</b></a>';
  return h+'</div>';
}
function callout(color,icon,title,body){
  return '<div class="callout '+color+'"><span class="ci" aria-hidden="true">'+icon+'</span><div class="cb">'+(title?'<div class="ct">'+title+'</div>':'')+body+'</div></div>';
}

function renderSetup(){
  var h='<div class="p-icon">S</div><h1>Setup: build your lab</h1>';
  h+=callout('purple','i','',SETUP.intro);
  h+=callout('red','!','Rules of the range','Only scan, probe or attack machines you own (your lab and target VMs) or platforms built for practice. Unauthorized access to anyone else\'s systems is a crime, including your employer\'s without written permission.');
  h+='<h2>Steps</h2><div class="steps">';
  SETUP.steps.forEach(function(s,i){
    h+='<div class="step"><span class="n">'+(i+1)+'</span><div class="sb"><h3>'+esc(s.t)+'</h3>'+s.b+(s.code?codeBlock(s.code,s.lang):'')+'</div></div>';
  });
  h+='</div><h2>Verify everything works</h2><p class="para">Run each command in the lab VM and tick it off when you see the expected result.</p><div class="verify" style="margin-top:12px">';
  SETUP.verify.forEach(function(v){
    var on=!!S.setup[v.id];
    h+='<label class="vrow'+(on?' on':'')+'"><input type="checkbox" data-setup="'+v.id+'"'+(on?' checked':'')+'><span><b>'+esc(v.t)+'</b><br><code>'+esc(v.cmd)+'</code><span class="exp">Expect: '+esc(v.exp)+'</span></span></label>';
  });
  h+='</div>'+pagerHTML(['home','Course home'],['w0','Week 0 · Signals']);
  return h;
}

function lensCaseHTML(c){
  var rows=[['think','Think','gray'],['design','Design','blue'],['protect','Protect','green'],['attack','Attack','red'],['innovate','Innovate','purple']];
  var h='<div class="case-h"><div class="case-top"><span class="lbl">The example</span><h3>'+esc(c.t)+'</h3></div>';
  rows.forEach(function(r){h+='<div class="lensrow"><span class="tag '+r[2]+'">'+r[1]+'</span><p>'+esc(c[r[0]])+'</p></div>';});
  return h+'</div>';
}

function renderWeekPage(w){
  var E=EMBER[w.id],i=PAGES.indexOf(w),h='';
  h+='<div class="p-icon">'+w.num+'</div><h1>'+esc(w.h1)+'</h1>';
  h+=callout('gray','↩','What you\'re carrying in','<ul>'+E.carry.map(function(r){return '<li>'+refLink(r)+'</li>';}).join('')+'</ul>');
  h+='<h2 id="b-idea">The big idea</h2>'+callout('purple','★','','<div class="bigidea">'+w.big+'</div>')+stripHTML(w.strip);
  var D=DIAGRAMS[w.id];
  if(D)h+='<h2 id="b-fig">See it</h2><figure class="fig"><div class="scroll">'+D.svg+'</div><figcaption>'+esc(D.cap)+'</figcaption></figure>';
  h+='<h2>Core ideas</h2><div class="ideas">'+w.ideas.map(function(x){return '<div class="idea"><h3>'+x[0]+'</h3><p>'+x[1]+'</p></div>';}).join('')+'</div>';
  h+='<h2>One example, five lenses</h2><p class="para" style="margin-bottom:12px">One real-world situation, followed through every way of looking at it.</p>'+lensCaseHTML(LENSCASE[w.id]);
  h+='<h2 id="b-ps">Problem set '+w.num+'</h2><div class="psets">'+w.psets.map(probHTML).join('')+'</div>';
  var s=stats(w);
  h+='<h2 id="b-check">Check your work</h2><div class="score"><div><b id="scoreN">'+s.qd+' / '+s.qt+'</b> <span>answered correctly</span></div><button class="btn sm" type="button" id="resetQ">Reset answers</button></div>'
    +'<div class="checks">'+w.check.map(function(q,k){return qHTML(w,q,k);}).join('')+'</div>';
  h+='<h2>This week in Ember</h2>'+callout('purple','E','Ember milestone',esc(E.ms));
  h+=callout('blue','→','What this unlocks','<ul>'+E.unlock.map(function(r){return '<li>'+refLink(r)+'</li>';}).join('')+'</ul>');
  h+='<h2>Go deeper</h2><div class="links">'+w.reads.map(function(r){return '<a href="'+r[1]+'" target="_blank" rel="noopener">'+esc(r[0])+'</a>';}).join('')+'</div>';
  var prev=i===0?['setup','Setup']:[PAGES[i-1].id,label(PAGES[i-1])+' · '+PAGES[i-1].title];
  var nx=PAGES[i+1];
  return h+pagerHTML(prev,nx?[nx.id,nx.id==='final'?'Final project':label(nx)+' · '+nx.title]:null);
}

function renderFinalPage(){
  var w=FINAL,h='<div class="p-icon">F</div><h1>'+esc(w.h1)+'</h1>';
  h+=callout('gray','↩','What you\'re carrying in','Everything. Ember\'s transport (week 3), resolver (4), server (5), encryption (6), design (7), defenses (8), audit (9), accounts (10), scale-out (11), privacy (12) and fast path (13).');
  h+=callout('purple','★','',esc(w.blurb));
  h+='<h2>The four steps</h2><div class="steps">'+w.steps.map(function(s,i){return '<div class="step"><span class="n">'+(i+1)+'</span><div class="sb"><h3>'+s[0]+'</h3><p>'+s[1]+'</p></div></div>';}).join('')+'</div>';
  h+='<h2>Project ideas</h2><div class="ideas">'+w.ideas.map(function(x){return '<div class="idea"><h3>'+x[0]+'</h3><p>'+x[1]+'</p></div>';}).join('')+'</div>';
  h+='<h2>Submission</h2><div class="psets">'+probHTML(w.pset)+'</div>';
  var p=PAGES[PAGES.length-2];
  return h+pagerHTML([p.id,label(p)+' · '+p.title],['home','Course home']);
}
