/* Part 5: in-browser Python editor (Pyodide, loaded on first Run) */
var PYODIDE='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/', RUN_LIMIT=10000;
var HARNESS=[
'import json, traceback',
'def raises(exc, fn, *a, **k):',
'    try:',
'        fn(*a, **k)',
'    except exc:',
'        return True',
'    except Exception as e:',
'        return type(e).__name__',
'    return False',
'def _fp_err(e):',
'    line = [f.lineno for f in traceback.extract_tb(e.__traceback__) if f.filename == "solution.py"]',
'    return type(e).__name__ + ": " + str(e) + (" (line %d)" % line[-1] if line else "")',
'def _fp_run(code):',
'    try:',
'        exec(compile(code, "solution.py", "exec"), {"__name__": "__main__", "raises": raises})',
'    except BaseException as e:',
'        print("".join(traceback.format_exception(type(e), e, e.__traceback__.tb_next)).rstrip())',
'def _fp_submit(code, tests):',
'    out = []',
'    for t in json.loads(tests):',
'        ns = {"__name__": "solution", "raises": raises}',
'        r = {"ok": False}',
'        try:',
'            exec(compile(code, "solution.py", "exec"), ns)',
'            if t.get("pre"):',
'                exec(t["pre"], ns)',
'            got = eval(t["run"], ns)',
'            r["got"] = repr(got)',
'            r["ok"] = bool(got == eval(t["want"], ns))',
'        except BaseException as e:',
'            r["err"] = _fp_err(e)',
'        out.append(r)',
'    return json.dumps(out)'].join('\n');

/* Runs inside the worker; serialized with toString, so it can't use outer variables. */
function pyWorker(){
  var py=null,buf=[];
  self.onmessage=function(e){
    var m=e.data;
    if(m.kind==='init'){
      try{importScripts(m.base+'pyodide.js');}catch(err){self.postMessage({type:'fail',msg:'Couldn\'t download Python. Check your connection and try again.'});return;}
      loadPyodide({indexURL:m.base}).then(function(p){
        py=p;py.setStdout({batched:function(s){buf.push(s);}});py.setStderr({batched:function(s){buf.push(s);}});
        py.runPython(m.harness);self.postMessage({type:'ready'});
      },function(){self.postMessage({type:'fail',msg:'Python failed to start. Reload the page and try again.'});});
      return;
    }
    buf=[];var res=null;
    try{
      if(m.kind==='run')py.globals.get('_fp_run')(m.code);
      else res=JSON.parse(py.globals.get('_fp_submit')(m.code,m.tests));
      self.postMessage({type:'done',out:buf.join('\n'),results:res});
    }catch(err){self.postMessage({type:'done',out:buf.join('\n')+'\n'+String(err),results:null});}
  };
}

var PY={w:null,ready:false,job:null,timer:0};
function pyStart(){
  var url=URL.createObjectURL(new Blob(['('+pyWorker.toString()+')()'],{type:'text/javascript'}));
  PY.w=new Worker(url);PY.ready=false;
  PY.w.onmessage=function(e){
    var m=e.data,j=PY.job;
    if(m.type==='ready'){PY.ready=true;if(j)pySend(j);return;}
    if(m.type==='fail'){PY.w.terminate();PY.w=null;PY.job=null;if(j)j.cb({fail:m.msg});return;}
    clearTimeout(PY.timer);PY.job=null;if(j)j.cb(m);
  };
  PY.w.postMessage({kind:'init',base:PYODIDE,harness:HARNESS});
}
function pySend(j){
  j.status('Running…');
  PY.timer=setTimeout(function(){
    PY.w.terminate();PY.w=null;PY.job=null;
    j.cb({fail:'Stopped after '+RUN_LIMIT/1000+' seconds. Look for an infinite loop.'});
  },RUN_LIMIT);
  PY.w.postMessage({kind:j.kind,code:j.code,tests:j.tests});
}
function pyRun(j){
  PY.job=j;
  if(!PY.w){j.status('Loading Python. The first run downloads about 10 MB…');pyStart();}
  else if(PY.ready)pySend(j);
}

function ideStarter(p){return p.starter||TESTS[p.id].stub||'';}
function ideRows(code){return Math.min(40,Math.max(10,code.split('\n').length+2));}
function ideHTML(p){
  var code=S.code[p.id]!=null?S.code[p.id]:ideStarter(p);
  return '<div class="ps"><h4>Try it here</h4><div class="ide" data-ide="'+p.id+'"><div class="ide-bar"><span>Python</span>'
    +'<span class="ide-keys">Tab indents · Ctrl+Enter runs</span><button class="btn sm" type="button" data-ide-act="reset">Reset</button></div>'
    +'<textarea class="ide-code" spellcheck="false" autocapitalize="off" autocomplete="off" rows="'+ideRows(code)+'" aria-label="Your solution to problem '+esc(p.id)+'">'+esc(code)+'</textarea>'
    +'<div class="ide-foot"><span class="ide-st" role="status"></span><button class="btn sm" type="button" data-ide-act="run">Run</button>'
    +'<button class="btn primary sm" type="button" data-ide-act="submit">Submit</button></div><div class="ide-out" hidden></div></div></div>';
}

function ideResults(p,res){
  var n=res.filter(function(r){return r.ok;}).length,all=n===res.length,ex=0,hid=0;
  var h='<div class="ide-sum '+(all?'ok':'bad')+'">'+(all?'All tests passed':'Some tests failed')+' · '+n+' / '+res.length+'</div>';
  res.forEach(function(r,i){
    var t=TESTS[p.id].tests[i],name=t.hide?'Hidden test '+(++hid):'Example '+(++ex);
    h+='<div class="ide-t '+(r.ok?'ok':'bad')+'"><span class="mk">'+(r.ok?'✓':'✗')+'</span>'+name;
    if(!r.ok)h+='<div class="ide-d"><b>Input</b><pre>'+esc(t.show||((t.pre?t.pre+'\n':'')+t.run))+'</pre><b>Expected</b><pre>'+esc(t.want)+'</pre>'
      +'<b>'+(r.err?'Error':'Got')+'</b><pre>'+esc(r.err||r.got)+'</pre></div>';
    h+='</div>';
  });
  return {html:h,all:all};
}
function ideGo(box,kind){
  var id=box.getAttribute('data-ide'),p=findPset(id),st=box.querySelector('.ide-st'),out=box.querySelector('.ide-out');
  var btns=box.querySelectorAll('[data-ide-act=run],[data-ide-act=submit]');
  if(PY.job)return;
  btns.forEach(function(b){b.disabled=true;});out.hidden=true;
  pyRun({kind:kind,code:box.querySelector('.ide-code').value,tests:JSON.stringify(TESTS[id].tests),
    status:function(t){st.textContent=t;},
    cb:function(m){
      btns.forEach(function(b){b.disabled=false;});st.textContent='';out.hidden=false;
      if(m.fail){out.innerHTML='<div class="ide-sum bad">'+esc(m.fail)+'</div>';return;}
      var h=m.out?'<pre class="ide-log">'+esc(m.out)+'</pre>':'';
      if(kind==='run'){out.innerHTML=h||'<div class="ide-note">Ran with no output. Add print() calls, or Submit to run the tests.</div>';return;}
      var r=ideResults(p,m.results);out.innerHTML=r.html+h;
      if(r.all&&!S.done[id]){
        S.done[id]=1;save();
        var cb=box.closest('.prob').querySelector('[data-done]');cb.checked=true;
        box.closest('.prob').classList.add('done');renderSide(CUR);updateChip();
      }
    }});
}
function findPset(id){for(var i=0;i<WEEKS.length;i++)for(var j=0;j<WEEKS[i].psets.length;j++)if(WEEKS[i].psets[j].id===id)return WEEKS[i].psets[j];}

/* Editor keys: Tab / Shift+Tab indent, Enter keeps indentation, Ctrl+Enter runs, Esc leaves the editor. */
function ideInsert(ta,text){
  if(!document.execCommand||!document.execCommand('insertText',false,text)){ta.setRangeText(text,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input',{bubbles:true}));}
}
function ideIndent(ta,out){
  var v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,ls=v.lastIndexOf('\n',s-1)+1;
  if(!out&&s===e){ideInsert(ta,'    ');return;}
  var le=v.indexOf('\n',e>s&&v[e-1]==='\n'?e-1:e);if(le<0)le=v.length;
  var lines=v.slice(ls,le).split('\n').map(function(l){return out?l.replace(/^ {1,4}/,''):'    '+l;}).join('\n');
  ta.setSelectionRange(ls,le);ideInsert(ta,lines);ta.setSelectionRange(ls,ls+lines.length);
}
document.addEventListener('keydown',function(e){
  var ta=e.target;if(!ta.classList||!ta.classList.contains('ide-code'))return;
  if(e.key==='Tab'){e.preventDefault();ideIndent(ta,e.shiftKey);}
  else if(e.key==='Escape')ta.blur();
  else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ideGo(ta.closest('.ide'),'run');}
  else if(e.key==='Enter'){
    var v=ta.value,ls=v.lastIndexOf('\n',ta.selectionStart-1)+1,line=v.slice(ls,ta.selectionStart);
    var ind=line.match(/^ */)[0]+(/:\s*$/.test(line)?'    ':'');
    e.preventDefault();ideInsert(ta,'\n'+ind);
  }
});
var ideSaveT=0;
document.addEventListener('input',function(e){
  var ta=e.target;if(!ta.classList||!ta.classList.contains('ide-code'))return;
  S.code[ta.closest('.ide').getAttribute('data-ide')]=ta.value;ta.rows=ideRows(ta.value);
  clearTimeout(ideSaveT);ideSaveT=setTimeout(save,400);
});
document.addEventListener('click',function(e){
  var t=e.target,act=t.getAttribute&&t.getAttribute('data-ide-act');if(!act)return;
  var box=t.closest('.ide');
  if(act!=='reset'){ideGo(box,act);return;}
  if(t.getAttribute('data-arm')!=='1'){
    t.setAttribute('data-arm','1');t.textContent='Click again to reset';
    setTimeout(function(){if(t.isConnected){t.removeAttribute('data-arm');t.textContent='Reset';}},3000);return;
  }
  t.removeAttribute('data-arm');t.textContent='Reset';
  var id=box.getAttribute('data-ide'),ta=box.querySelector('.ide-code');
  delete S.code[id];save();ta.value=ideStarter(findPset(id));ta.rows=ideRows(ta.value);box.querySelector('.ide-out').hidden=true;
});
