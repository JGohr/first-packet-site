/* Part 2: problem sets and checks */
var DIFF={Easy:'green',Medium:'orange',Hard:'red'};
function list(items,cls){return '<ul'+(cls?' class="'+cls+'"':'')+'>'+items.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul>';}

function probHTML(p){
  var d=!!S.done[p.id],h='<article class="prob'+(d?' done':'')+'">';
  h+='<div class="prob-h"><div><div class="id">Problem '+esc(p.id)+'</div><h3>'+esc(p.title)+'</h3><div class="chips">'
    +'<span class="tag '+DIFF[p.diff]+'">'+p.diff+'</span><span class="tag gray">'+esc(p.kind)+'</span>'
    +'<span class="tag gray">'+esc(p.time)+'</span><span class="tag gray">'+esc(p.lang)+'</span></div></div>'
    +'<label class="done-t"><input type="checkbox" data-done="'+p.id+'"'+(d?' checked':'')+'> Solved</label></div><div class="prob-b">';
  h+='<div class="ps"><h4>Problem</h4><p>'+p.problem+'</p>'+(p.builds?'<p class="builds">↳ '+esc(p.builds)+'</p>':'')+'</div>';
  if(p.input)h+='<div class="ps"><h4>Input / output</h4><div class="io"><div><b>Input</b><span>'+p.input+'</span></div><div><b>Output</b><span>'+p.output+'</span></div></div></div>';
  if(p.task)h+='<div class="ps"><h4>'+(p.input?'Steps':'Task')+'</h4><ol>'+p.task.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ol></div>';
  if(p.examples){
    h+='<div class="ps"><h4>Examples</h4>';
    p.examples.forEach(function(e,i){
      h+='<div class="ex-n">Example '+(i+1)+'</div><div class="ex"><span class="k">Input:  </span><span class="v">'+esc(e.i)+'</span><br>'
        +'<span class="k">Output: </span><span class="v">'+esc(e.o)+'</span>'+(e.why?'<span class="why">'+esc(e.why)+'</span>':'')+'</div>';
    });
    h+='</div>';
  }
  if(p.constraints)h+='<div class="ps"><h4>Constraints</h4>'+list(p.constraints)+'</div>';
  if(TESTS[p.id])h+=ideHTML(p);
  else if(p.starter)h+='<div class="ps"><h4>Starter code</h4>'+codeBlock(p.starter,p.lang)+'</div>';
  if(p.hints){
    h+='<div class="ps"><h4>Hints</h4>';
    p.hints.forEach(function(t,i){h+='<details class="tog"><summary>Hint '+(i+1)+'</summary><div class="tb">'+t+'</div></details>';});
    h+='</div>';
  }
  h+='<div class="ps"><h4>Acceptance criteria</h4>'+list(p.accept,'todo')+'</div>';
  if(p.stretch)h+='<div class="ps"><h4>Stretch</h4>'+list(p.stretch)+'</div>';
  return h+'</div></article>';
}

function answerText(q){
  if(q.t==='choice')return 'Answer: '+q.o[q.a]+'.';
  if(q.t==='num')return 'Answer: '+q.a+(q.unit?' '+q.unit:'')+'.';
  if(q.t==='text')return 'Answer: '+q.acc[0]+'.';
  return '';
}
function outHTML(q,a){
  if(!a)return '';
  if(q.t==='explain'){
    var s='<div class="model"><b>Model answer.</b> '+esc(q.model)+'</div><div class="self">How did yours compare? ';
    [['got','Covered it'],['part','Partly'],['miss','Missed it']].forEach(function(k){
      s+='<button class="btn sm'+(a.self===k[0]?' primary':'')+'" type="button" data-self="'+k[0]+'">'+k[1]+'</button>';
    });
    return s+'</div>';
  }
  if(a.ok===true)return '<div class="fb ok"><b>Correct.</b> '+esc(q.why)+'</div>';
  return '<div class="fb bad"><b>Not quite.</b> Try again, or <button class="btn sm" type="button" data-act="reveal">show the explanation</button>'
    +(a.revealed?'<div style="margin-top:8px">'+esc(answerText(q))+' '+esc(q.why)+'</div>':'')+'</div>';
}
var QTYPE={num:'Numeric',text:'Short answer',choice:'Multiple choice',explain:'Explain it'};
function qHTML(w,q,i){
  var id=w.id+'-'+i,a=S.ans[id],cls='q',st='';
  if(a){
    if(a.ok===true){cls+=' ok';st='Correct';}
    else if(a.ok==='part'){cls+=' part';st='Partly';}
    else if(a.ok===false){cls+=' bad';st=q.t==='explain'?'Missed':'Try again';}
  }
  var h='<div class="'+cls+'" data-q="'+id+'"><div class="q-h"><span class="lbl">Q'+(i+1)+' · '+QTYPE[q.t]+'</span><span class="st">'+st+'</span></div><p class="prompt">'+q.q+'</p>';
  if(q.t==='choice'){
    h+='<div class="opts">';
    q.o.forEach(function(o,j){
      var chk=a&&a.v===j,m=chk?(a.ok===true?' right':' wrong'):'';
      h+='<label class="opt'+m+'"><input type="radio" name="r-'+id+'" value="'+j+'"'+(chk?' checked':'')+'><span>'+esc(o)+'</span></label>';
    });
    h+='</div>';
  } else if(q.t==='explain'){
    h+='<textarea id="t-'+id+'" placeholder="Write your answer in your own words…">'+(a&&a.v?esc(a.v):'')+'</textarea>';
  } else {
    h+='<div class="ans"><input type="text" id="i-'+id+'" autocomplete="off" spellcheck="false" placeholder="'+(q.t==='num'?'Your number':'Your answer')+'" value="'+(a&&a.v!=null?esc(a.v):'')+'">'
      +(q.unit?'<span class="unit">'+esc(q.unit)+'</span>':'')+'</div>';
  }
  return h+'<div class="actions"><button class="btn primary sm" type="button" data-act="check">'+(q.t==='explain'?'Compare with model answer':'Check')+'</button>'
    +'<span class="err" role="alert"></span></div><div class="out">'+outHTML(q,a)+'</div></div>';
}
