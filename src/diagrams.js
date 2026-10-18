// One diagram per section. Single dark theme, so literal token hexes are used.
var C = {ink:'#ebebea', body:'#c9c8c4', muted:'#9b9a97', coral:'#8b7cf6', coralInk:'#b3a5ff', teal:'#5fc4ad', amber:'#ffa344', red:'#ff7b72', box:'#2a2a2a', deep:'#161616', line:'rgba(255,255,255,.2)'};
function svgWrap(id, h, label, body){
  return '<svg viewBox="0 0 720 '+h+'" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg">'
   + '<defs><marker id="m'+id+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+C.body+'"/></marker>'
   + '<marker id="c'+id+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+C.coral+'"/></marker></defs>'
   + body + '</svg>';
}
function T(x,y,s,o){o=o||{};return '<text x="'+x+'" y="'+y+'" font-size="'+(o.s||13)+'" fill="'+(o.c||C.ink)+'" text-anchor="'+(o.a||'middle')+'"'+(o.w?' font-weight="'+o.w+'"':'')+(o.m?' font-family="JetBrains Mono, monospace"':'')+'>'+s+'</text>';}
function R(x,y,w,h,o){o=o||{};return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(o.r||8)+'" fill="'+(o.f||C.box)+'" stroke="'+(o.st||C.line)+'"'+(o.dash?' stroke-dasharray="5 5"':'')+' stroke-width="'+(o.sw||1)+'"/>';}
function L(x1,y1,x2,y2,id,o){o=o||{};var col=o.c||C.body;return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="'+(o.w||1.5)+'"'+(o.dash?' stroke-dasharray="5 5"':'')+(o.end===false?'':' marker-end="url(#'+(o.coral?'c':'m')+id+')"')+(o.start?' marker-start="url(#'+(o.coral?'c':'m')+id+')"':'')+'/>';}

var DIAGRAMS = {};

DIAGRAMS.w0 = {cap:'A link holds many bits at once (top). The delay for any one bit is four separate costs added together (bottom). Only propagation is fixed by physics.', svg:(function(){var i='0',b='';
  b+=R(20,40,120,52)+T(80,63,'Your laptop')+T(80,80,'sender',{s:11.5,c:C.muted});
  b+=R(580,40,120,52)+T(640,63,'Server')+T(640,80,'receiver',{s:11.5,c:C.muted});
  b+=L(140,66,578,66,i);
  for(var x=170;x<=530;x+=40){b+='<rect x="'+x+'" y="60" width="12" height="12" rx="2" fill="'+C.coral+'" opacity=".9"/>';}
  b+=T(360,32,'bits in flight = bandwidth × round-trip time',{s:12.5,c:C.muted});
  b+=T(20,128,'One-way delay is four costs added together:',{a:'start'});
  b+='<rect x="20" y="140" width="300" height="28" fill="'+C.coral+'"/><rect x="320" y="140" width="140" height="28" fill="'+C.teal+'"/><rect x="460" y="140" width="160" height="28" fill="'+C.amber+'"/><rect x="620" y="140" width="80" height="28" fill="#6f6e69"/>';
  b+=T(170,192,'Propagation')+T(390,192,'Transmission')+T(540,192,'Queuing')+T(660,192,'Processing');
  b+=T(170,209,'distance ÷ speed of light',{s:12,c:C.muted})+T(390,209,'size ÷ bandwidth',{s:12,c:C.muted})+T(540,209,'waiting behind others',{s:12,c:C.muted})+T(660,209,'device work',{s:12,c:C.muted});
  return svgWrap(i,225,'Latency diagram: bits in flight across a link, and one-way delay split into propagation, transmission, queuing and processing',b);})()};

DIAGRAMS.w1 = {cap:'Host A sends a frame to D. The switch records "A is on port 1" from the source address, but has never seen D, so it floods the frame out every other port. Once D replies, the switch learns D too and stops flooding.', svg:(function(){var i='1',b='';
  b+=R(60,30,420,70,{r:10})+T(270,58,'Switch',{s:14,w:600});
  var cx=[120,230,340,450],n=['A','B','C','D'];
  for(var k=0;k<4;k++){b+=T(cx[k],88,'port '+(k+1),{s:11.5,c:C.muted});b+=R(cx[k]-45,200,90,40)+T(cx[k],225,'Host '+n[k]);}
  b+=L(120,198,120,103,i,{coral:true,c:C.coral,w:2});
  b+=T(130,155,'frame A → D',{s:12,c:C.coralInk,a:'start'});
  for(var k=1;k<4;k++){b+=L(cx[k],100,cx[k],197,i,{dash:true,c:C.muted});}
  b+=T(285,155,'flood',{s:12,c:C.muted})+T(395,155,'flood',{s:12,c:C.muted});
  b+=L(482,60,527,60,i,{dash:true,coral:true,c:C.coral});
  b+=R(530,30,170,150,{f:C.deep})+T(548,54,'MAC table',{a:'start',w:600});
  b+=T(548,80,'MAC',{s:11.5,c:C.muted,a:'start'})+T(620,80,'Port',{s:11.5,c:C.muted,a:'start'});
  b+='<line x1="540" y1="88" x2="690" y2="88" stroke="'+C.line+'"/>';
  b+=T(548,112,'A',{m:1,c:C.coralInk,a:'start'})+T(620,112,'1 · learned',{s:12.5,c:C.coralInk,a:'start'});
  b+=T(548,138,'D',{m:1,c:C.muted,a:'start'})+T(620,138,'unknown',{s:12.5,c:C.muted,a:'start'});
  return svgWrap(i,260,'Learning switch: a frame from host A to unknown host D is flooded while the switch learns A is on port 1',b);})()};

DIAGRAMS.w2 = {cap:'Four routes all match 10.40.12.7. The router picks the one with the most matching bits, the /24, so the packet goes to Site 12. The default route only wins when nothing more specific exists.', svg:(function(){var i='2',b='';
  b+=R(20,112,180,56)+T(110,134,'Packet')+T(110,154,'dst 10.40.12.7',{s:12.5,m:1,c:C.coralInk});
  b+=L(200,140,236,140,i);
  b+=R(240,20,460,240,{f:C.deep,r:10});
  b+=T(258,44,'PREFIX',{s:11,c:C.muted,a:'start',w:600})+T(440,44,'NEXT HOP',{s:11,c:C.muted,a:'start',w:600})+T(590,44,'MATCH?',{s:11,c:C.muted,a:'start',w:600});
  b+='<rect x="241" y="183" width="458" height="41" fill="rgba(139,124,246,.16)" stroke="'+C.coral+'"/>';
  var rows=[['0.0.0.0/0','Internet edge','✓ 0 bits'],['10.0.0.0/8','Core','✓ 8 bits'],['10.40.0.0/16','Division','✓ 16 bits'],['10.40.12.0/24','Site 12','✓ 24 bits · wins'],['10.41.0.0/16','Division B','✗ no match']];
  for(var k=0;k<5;k++){var y=56+k*42+25;var col=k==3?C.coralInk:(k==4?C.muted:C.ink);
    b+=T(258,y,rows[k][0],{m:1,s:12.5,c:col,a:'start'})+T(440,y,rows[k][1],{c:col,a:'start'})+T(590,y,rows[k][2],{s:12.5,c:col,a:'start'});
    if(k<4&&k!=2&&k!=3)b+='<line x1="250" y1="'+(56+(k+1)*42)+'" x2="690" y2="'+(56+(k+1)*42)+'" stroke="'+C.line+'" opacity=".5"/>';}
  b+='<line x1="250" y1="56" x2="690" y2="56" stroke="'+C.line+'"/>';
  return svgWrap(i,280,'Longest prefix match: destination 10.40.12.7 matches four routes and the /24 wins',b);})()};

DIAGRAMS.w3 = {cap:'Three packets set up the connection, and each side confirms the other\'s starting sequence number plus one. Data can only flow after a full round trip, which is why new connections feel slow on long links.', svg:(function(){var i='3',b='';
  b+=T(200,34,'Client',{w:600})+T(560,34,'Server',{w:600});
  b+='<line x1="200" y1="46" x2="200" y2="290" stroke="'+C.line+'" stroke-width="2"/><line x1="560" y1="46" x2="560" y2="290" stroke="'+C.line+'" stroke-width="2"/>';
  b+=L(200,70,557,104,i)+T(380,76,'SYN · seq = 1000',{s:12.5,m:1});
  b+=L(560,122,203,156,i)+T(380,130,'SYN-ACK · seq = 5000, ack = 1001',{s:12.5,m:1});
  b+=L(200,174,557,208,i)+T(380,180,'ACK · ack = 5001',{s:12.5,m:1});
  b+=L(200,228,557,262,i,{coral:true,c:C.coral,w:2})+T(380,234,'data: GET / HTTP/1.1',{s:12.5,m:1,c:C.coralInk});
  b+='<path d="M180 70 H172 V156 H180" fill="none" stroke="'+C.amber+'" stroke-width="1.5"/>';
  b+=T(162,110,'1 round trip',{s:12.5,c:C.amber,a:'end'})+T(162,126,'before any data',{s:12,c:C.muted,a:'end'});
  return svgWrap(i,300,'TCP three-way handshake: SYN, SYN-ACK, ACK, then data, costing one round trip',b);})()};

DIAGRAMS.w4 = {cap:'Your laptop asks one question. The recursive resolver does the legwork: the root points it to .com, .com points it to example.com\'s name server, and that server gives the address. Every answer is cached, so the next lookup usually skips most of this.', svg:(function(){var i='4',b='';
  b+=R(20,118,120,54)+T(80,140,'Your laptop')+T(80,157,'stub resolver',{s:11.5,c:C.muted});
  b+=R(220,118,150,54)+T(295,140,'Recursive resolver')+T(295,157,'does the legwork',{s:11.5,c:C.muted});
  b+=L(140,135,218,135,i)+T(180,127,'1 · query',{s:11.5,c:C.muted});
  b+=L(218,158,142,158,i)+T(180,177,'8 · answer',{s:11.5,c:C.muted});
  b+=R(520,20,180,52)+T(610,42,'Root server')+T(610,60,'→ try the .com servers',{s:11.5,c:C.muted});
  b+=R(520,119,180,52)+T(610,141,'.com TLD server')+T(610,159,'→ try example.com\'s NS',{s:11.5,c:C.muted});
  b+=R(520,218,180,52,{st:C.teal})+T(610,240,'Authoritative NS')+T(610,258,'93.184.215.14',{s:12,m:1,c:C.teal});
  b+=L(370,128,518,48,i,{start:true})+T(452,104,'2 · 3',{s:11.5,c:C.muted});
  b+=L(370,145,518,145,i,{start:true})+T(444,138,'4 · 5',{s:11.5,c:C.muted});
  b+=L(370,162,518,242,i,{start:true})+T(452,186,'6 · 7',{s:11.5,c:C.muted});
  return svgWrap(i,290,'DNS resolution: a recursive resolver queries the root, the .com TLD, then the authoritative name server',b);})()};

DIAGRAMS.w5 = {cap:'Programs live in user space and can\'t touch hardware. Every network operation crosses the syscall boundary into the kernel, which runs TCP/IP and drives the network card. Containers share this one kernel, while VMs each bring their own.', svg:(function(){var i='5',b='';
  b+=R(20,20,680,86,{f:'#1e1e1e',r:10})+T(36,40,'USER SPACE',{s:11,c:C.muted,a:'start',w:600});
  b+=R(60,52,140,40)+T(130,77,'curl')+R(230,52,140,40)+T(300,77,'nginx')+R(400,52,170,40)+T(485,77,'your chat server');
  b+='<line x1="20" y1="124" x2="700" y2="124" stroke="'+C.coral+'" stroke-width="1.5" stroke-dasharray="6 5"/>';
  b+=T(36,118,'syscall boundary: socket() · connect() · send() · recv()',{s:12,c:C.coralInk,a:'start',m:1});
  b+=R(20,134,680,96,{f:'#1e1e1e',r:10})+T(36,154,'KERNEL',{s:11,c:C.muted,a:'start',w:600});
  b+=R(60,166,130,44)+T(125,193,'TCP/IP stack')+R(210,166,130,44)+T(275,193,'Scheduler')+R(360,166,130,44)+T(425,193,'Memory')+R(510,166,170,44)+T(595,193,'Device drivers');
  b+=R(20,246,680,40,{f:'#1e1e1e',r:10})+T(360,271,'Hardware: network card · CPU · RAM · disk',{c:C.muted});
  b+=L(125,93,125,163,i,{coral:true,c:C.coral,w:2})+L(125,211,125,244,i,{coral:true,c:C.coral,w:2});
  return svgWrap(i,300,'Operating system layers: user-space programs cross the syscall boundary into the kernel, which drives the hardware',b);})()};

DIAGRAMS.w6 = {cap:'Alice and Bob each keep a secret and send only g raised to it. Each combines the other\'s public value with their own secret and gets the same number, 2. Eve sees everything on the wire and still can\'t compute it, but she could stand in the middle unless Bob\'s value is signed.', svg:(function(){var i='6',b='';
  b+=T(110,30,'Alice',{w:600})+T(360,30,'The public wire',{w:600})+T(610,30,'Bob',{w:600});
  b+='<rect x="250" y="44" width="220" height="222" rx="10" fill="'+C.deep+'" stroke="'+C.muted+'" stroke-dasharray="5 5"/>';
  b+=T(360,72,'p = 23, g = 5',{m:1,s:12.5})+T(360,90,'agreed in public',{s:11.5,c:C.muted});
  b+=R(20,56,180,44,{st:C.amber})+T(110,83,'secret a = 6',{m:1,s:12.5,c:C.amber});
  b+=R(20,120,180,44)+T(110,147,'A = 5⁶ mod 23 = 8',{m:1,s:12.5});
  b+=R(20,216,180,44,{st:C.teal})+T(110,243,'s = 19⁶ mod 23 = 2',{m:1,s:12.5,c:C.teal});
  b+=R(520,56,180,44,{st:C.amber})+T(610,83,'secret b = 15',{m:1,s:12.5,c:C.amber});
  b+=R(520,120,180,44)+T(610,147,'B = 5¹⁵ mod 23 = 19',{m:1,s:12.5});
  b+=R(520,216,180,44,{st:C.teal})+T(610,243,'s = 8¹⁵ mod 23 = 2',{m:1,s:12.5,c:C.teal});
  b+=L(200,132,517,132,i)+T(360,124,'A = 8',{m:1,s:12.5});
  b+=L(520,154,203,154,i)+T(360,172,'B = 19',{m:1,s:12.5});
  b+=T(360,226,'Eve sees p, g, A, B',{s:12.5,c:C.coralInk})+T(360,244,'but never a, b or s',{s:12,c:C.muted});
  return svgWrap(i,280,'Diffie-Hellman key exchange with small numbers: both sides compute shared secret 2 while an eavesdropper sees only public values',b);})()};

DIAGRAMS.w7 = {cap:'Ember runs in two data centers that can each carry the full load, and every edge site has two paths, one to each. Each function gets its own segment, and traffic between segments must pass the site firewall, so a compromised sensor can’t reach Ember’s servers. As drawn, the single site router and site switch are still single points of failure for that site, and 7.2 asks what you’d change.', svg:(function(){var i='7',b='';
  b+=R(60,16,240,46)+T(180,36,'Data center A')+T(180,53,'Ember nodes + database',{s:11.5,c:C.muted});
  b+=R(420,16,240,46)+T(540,36,'Data center B')+T(540,53,'Ember nodes + replica',{s:11.5,c:C.muted});
  b+=L(300,39,418,39,i,{start:true})+T(360,31,'replication',{s:11.5,c:C.muted});
  b+='<rect x="20" y="126" width="680" height="214" rx="12" fill="none" stroke="'+C.muted+'" stroke-dasharray="5 5"/>'+T(36,146,'EDGE SITE 12',{s:11,c:C.muted,a:'start',w:600});
  b+=L(180,62,298,146,i,{start:true})+T(232,106,'primary',{s:12,c:C.body,a:'end'});
  b+=L(540,62,422,146,i,{start:true,coral:true,c:C.coral,dash:true})+T(488,106,'backup · LTE',{s:12,c:C.coralInk,a:'start'});
  b+=R(210,148,300,42)+T(360,174,'Site router / firewall');
  b+=L(360,190,360,213,i);
  b+=R(260,216,200,38)+T(360,240,'Site switch');
  var xs=[40,200,360,520],nm=['Ember servers','Operators','Sensors / IoT','Visitor Wi-Fi'];
  for(var k=0;k<4;k++){b+='<line x1="360" y1="254" x2="'+(xs[k]+70)+'" y2="291" stroke="'+C.line+'" stroke-width="1.5"/>';
    b+=(k==0?R(xs[k],292,140,36,{f:'rgba(139,124,246,.16)',st:C.coral}):R(xs[k],292,140,36))+T(xs[k]+70,315,nm[k],{c:k==0?C.coralInk:C.ink});}
  return svgWrap(i,350,'Ember Regions: two data centers with replication, and an edge site dual-homed to both with four segmented networks',b);})()};

DIAGRAMS.w8 = {cap:'Traffic passes a default-deny firewall into a DMZ, and each tier only accepts the port it needs from the tier in front of it. An IDS watches a copy of the traffic, and every layer sends logs to one place where people can search them.', svg:(function(){var i='8',b='';
  b+=T(375,24,'DMZ',{s:11,c:C.muted,w:600})+T(585,24,'INTERNAL · SEGMENTED',{s:11,c:C.muted,w:600});
  b+=R(20,40,100,50)+T(70,70,'Internet');
  b+=R(160,40,120,50,{st:C.coral})+T(220,61,'Firewall')+T(220,78,'default deny',{s:11.5,c:C.coralInk});
  b+=R(320,40,110,50)+T(375,70,'Web tier')+R(470,40,100,50)+T(520,70,'App tier')+R(610,40,90,50)+T(655,70,'Database');
  b+=L(120,65,158,65,i)+L(280,65,318,65,i)+L(430,65,468,65,i)+L(570,65,608,65,i);
  b+=T(139,57,'any',{s:11,c:C.muted,m:1})+T(299,57,'443',{s:11,c:C.muted,m:1})+T(449,57,'8080',{s:11,c:C.muted,m:1})+T(589,57,'5432',{s:11,c:C.muted,m:1});
  b+=L(299,70,299,148,i,{dash:true,c:C.muted,w:1.2});
  b+=R(230,150,140,44)+T(300,170,'IDS sensor')+T(300,186,'copy of traffic',{s:11.5,c:C.muted});
  b+=R(450,150,250,44,{st:C.teal})+T(575,170,'SIEM')+T(575,186,'logs and alerts in one place',{s:11.5,c:C.muted});
  b+=L(370,172,448,172,i,{dash:true,c:C.muted,w:1.2})+L(400,90,478,148,i,{dash:true,c:C.muted,w:1.2})+L(525,90,555,148,i,{dash:true,c:C.muted,w:1.2})+L(655,90,640,148,i,{dash:true,c:C.muted,w:1.2});
  return svgWrap(i,210,'Defense in depth: firewall, DMZ web tier, internal app and database tiers with per-port rules, an IDS sensor and a SIEM collecting logs',b);})()};

DIAGRAMS.w9 = {cap:'An intrusion is a chain of steps, and each step has a control that can break it. In the 2017 Equifax breach, a missed patch let attackers in, weak segmentation let them reach many databases, and an expired certificate on an inspection device let the data leave unseen for 76 days.', svg:(function(){var i='9',b='';
  b+=T(20,22,'Attacker\'s path →',{s:12,c:C.muted,a:'start'});
  var xs=[20,160,300,440,580],st=[['Recon'],['Initial access'],['Persistence'],['Lateral','movement'],['Objective']],ct=[['Shrink attack','surface'],['MFA +','patching'],['EDR +','baselines'],['Segment','the network'],['Egress','filtering']];
  for(var k=0;k<5;k++){var cx=xs[k]+56;
    b+=R(xs[k],34,112,50)+(st[k].length==1?T(cx,63,st[k][0]):T(cx,55,st[k][0])+T(cx,72,st[k][1]));
    if(k<4)b+=L(xs[k]+112,59,xs[k+1]-2,59,i);
    b+='<line x1="'+cx+'" y1="84" x2="'+cx+'" y2="128" stroke="'+C.muted+'" stroke-dasharray="4 4"/>';
    var hl=k==3;b+=(hl?R(xs[k],130,112,56,{f:'rgba(139,124,246,.16)',st:C.coral}):R(xs[k],130,112,56,{f:C.deep}))+T(cx,154,ct[k][0],{s:12.5,c:hl?C.coralInk:C.body})+T(cx,171,ct[k][1],{s:12.5,c:hl?C.coralInk:C.body});}
  b+=T(20,212,'Defenders win by breaking any one link.',{s:12,c:C.muted,a:'start'});
  return svgWrap(i,225,'A simplified attack chain: recon, initial access, persistence, lateral movement and objective, each with a defensive control below it',b);})()};

DIAGRAMS.w10 = {cap:'A user named O\'Brien breaks the concatenated query, because their apostrophe ends the string early and the rest gets parsed as SQL. An attacker uses the same flaw on purpose. Parameterized queries send the value separately, so it can never become code.', svg:(function(){var i='10',b='';
  b+=R(20,16,330,220,{f:C.deep,r:10})+R(370,16,330,220,{f:C.deep,r:10});
  b+=T(40,44,'Concatenated',{s:14,w:600,c:C.red,a:'start'})+T(40,62,'input pasted into the query text',{s:12,c:C.muted,a:'start'});
  b+=T(40,100,'SELECT id FROM users',{m:1,s:13,a:'start'});
  b+='<text x="40" y="122" font-size="13" font-family="JetBrains Mono, monospace" fill="'+C.ink+'">WHERE name = \'O\'<tspan fill="'+C.red+'">Brien\'</tspan></text>';
  b+=T(40,178,'✗ The quote ends the string early.',{s:13,c:C.red,a:'start'})+T(40,198,'Brien\' is parsed as SQL: syntax error.',{s:12,c:C.muted,a:'start'});
  b+=T(390,44,'Parameterized',{s:14,w:600,c:C.teal,a:'start'})+T(390,62,'query and data sent separately',{s:12,c:C.muted,a:'start'});
  b+=T(390,100,'SELECT id FROM users',{m:1,s:13,a:'start'})+T(390,122,'WHERE name = ?',{m:1,s:13,a:'start'});
  b+='<text x="390" y="146" font-size="12.5" fill="'+C.muted+'">value bound: <tspan font-family="JetBrains Mono, monospace" fill="'+C.teal+'">O\'Brien</tspan></text>';
  b+=T(390,178,'✓ The value can never become code.',{s:13,c:C.teal,a:'start'})+T(390,198,'Any name works, apostrophes included.',{s:12,c:C.muted,a:'start'});
  return svgWrap(i,250,'Concatenated SQL breaks on the name O\'Brien while a parameterized query handles it safely',b);})()};

DIAGRAMS.w11 = {cap:'A partition splits a five-node cluster. Only the side with a majority (3 of 5) can elect a leader and accept writes, and the minority refuses rather than risk two conflicting leaders. This is CAP in one picture: during the split, the minority gives up availability to stay consistent.', svg:(function(){var i='11',b='';
  b+='<line x1="360" y1="16" x2="360" y2="200" stroke="'+C.coral+'" stroke-width="1.5" stroke-dasharray="6 5"/>'+T(368,30,'network partition',{s:12,c:C.coralInk,a:'start'});
  b+='<line x1="100" y1="90" x2="250" y2="90" stroke="'+C.line+'" stroke-width="1.5"/><line x1="100" y1="90" x2="175" y2="170" stroke="'+C.line+'" stroke-width="1.5"/><line x1="250" y1="90" x2="175" y2="170" stroke="'+C.line+'" stroke-width="1.5"/><line x1="480" y1="110" x2="620" y2="110" stroke="'+C.line+'" stroke-width="1.5"/>';
  function node(x,y,lab,lead){return '<circle cx="'+x+'" cy="'+y+'" r="26" fill="'+(lead?C.coral:C.box)+'" stroke="'+(lead?C.coral:C.line)+'"/>'+T(x,y+4.5,lab,{s:13,w:600,c:lead?'#ffffff':C.ink});}
  b+=node(100,90,'N1')+node(250,90,'N2',true)+node(175,170,'N3')+node(480,110,'N4')+node(620,110,'N5');
  b+=T(250,52,'leader, term 4',{s:12,c:C.coralInk});
  b+=T(175,226,'3 of 5 · majority ✓',{s:13,c:C.teal,w:600})+T(175,244,'elects a leader, accepts writes',{s:12,c:C.muted});
  b+=T(550,226,'2 of 5 · minority ✗',{s:13,c:C.red,w:600})+T(550,244,'no leader, refuses writes',{s:12,c:C.muted});
  return svgWrap(i,256,'Raft during a network partition: three nodes keep a leader, two nodes cannot elect one',b);})()};

DIAGRAMS.w12 = {cap:'A VPN hides you from your ISP but the VPN server sees both who you are and where you go. Tor splits that knowledge so no single relay sees both. Neither hides timing patterns from someone watching both ends.', svg:(function(){var i='12',b='';
  function row(y,boxes){var s='';for(var k=0;k<boxes.length;k++){var bx=boxes[k];s+=R(bx[0],y,bx[1],44,bx[4]?{st:C.coral}:{})+T(bx[0]+bx[1]/2,y+27,bx[2]);
    if(bx[3]){s+=T(bx[0]+bx[1]/2,y+64,bx[3][0],{s:12,c:bx[4]?C.coralInk:C.muted})+T(bx[0]+bx[1]/2,y+80,bx[3][1],{s:12,c:bx[4]?C.coralInk:C.muted});}
    if(k<boxes.length-1){s+=L(bx[0]+bx[1],y+22,boxes[k+1][0]-2,y+22,i);}}return s;}
  b+=T(20,28,'VPN',{s:13,w:600,a:'start'});
  b+=row(40,[[20,100,'You'],[160,110,'Your ISP',['your IP ✓','destination ✗']],[370,130,'VPN server',['your IP ✓','destination ✓'],1],[580,120,'Website',['your IP ✗','VPN\'s IP ✓']]]);
  b+=T(20,166,'Tor',{s:13,w:600,a:'start'});
  b+=row(178,[[20,100,'You'],[160,100,'Guard',['your IP ✓','destination ✗']],[300,100,'Middle',['your IP ✗','destination ✗']],[440,100,'Exit',['your IP ✗','destination ✓']],[580,120,'Website',['your IP ✗','exit\'s IP ✓']]]);
  return svgWrap(i,280,'Who sees what: a VPN server sees both your IP and destination, while in Tor no single relay sees both',b);})()};

DIAGRAMS.w13 = {cap:'XDP runs your code in the network driver, before the kernel has spent any memory or CPU on the packet. Dropping there is far cheaper than dropping in nftables, after the stack has already processed it. That\'s how modern DDoS filters and load balancers hit line rate.', svg:(function(){var i='13',b='';
  b+=R(20,40,100,52)+T(70,62,'Network card')+T(70,79,'packet arrives',{s:11.5,c:C.muted});
  b+=R(150,40,140,52,{f:'rgba(139,124,246,.16)',st:C.coral})+T(220,62,'XDP hook',{c:C.coralInk})+T(220,79,'your eBPF code',{s:11.5,c:C.muted});
  b+=R(320,40,150,52)+T(395,62,'Kernel stack')+T(395,79,'routing, nftables',{s:11.5,c:C.muted});
  b+=R(500,40,90,52)+T(545,70,'Socket')+R(620,40,80,52)+T(660,70,'App');
  b+=L(120,66,148,66,i)+L(290,66,318,66,i)+L(470,66,498,66,i)+L(590,66,618,66,i);
  b+=L(220,92,220,138,i,{coral:true,c:C.coral,w:2})+T(220,158,'XDP_DROP',{s:12.5,m:1,c:C.coralInk})+T(220,175,'before memory is allocated',{s:12,c:C.muted});
  b+=L(395,92,395,138,i,{c:C.muted})+T(395,158,'nftables drop',{s:12.5,m:1,c:C.body})+T(395,175,'after the stack did the work',{s:12,c:C.muted});
  return svgWrap(i,195,'Packet path: network card, XDP hook, kernel stack, socket and app, with cheap drops at XDP versus later drops in nftables',b);})()};
