WEEKS.push({
id:"w7", num:7, layer:"Architecture", title:"Network design", h1:"Design: building networks that fail well",
blurb:"Hierarchy, blast radius, WAN choices and segmentation, applied to Ember across two data centers and many edge sites.",
big:"Every component will fail eventually. Good design assumes that and asks two questions: <b>what breaks when this breaks</b>, and <b>how fast do we notice and recover</b>? Redundancy, segmentation and simple, repeatable patterns keep one failure from becoming an outage.",
strip:{type:"shell", cmd:"containerlab deploy -t ring.clab.yml", note:"your network as a text file you can version"},
ideas:[
["Hierarchy","Campus networks use core, distribution and access layers. Data centers use leaf-spine, where every leaf is two hops from any other. Each pattern trades cost for predictability."],
["Blast radius","The set of things that break when one thing breaks. Shrink it with segmentation, redundant paths and fewer shared dependencies."],
["WAN choices","MPLS, internet VPNs, SD-WAN and cellular backup each trade cost, control and resilience. Most real networks mix them."],
["Observability","You can't fix what you can't see. Plan monitoring (SNMP, flow data, syslog, synthetic tests) as part of the design, not after it."]],
lenses:{design:"Standardize. 119 identical stores are easier to run than 119 clever ones.", protect:"Segmentation is a security control. Payment card systems (PCI DSS) must be isolated from everything else.", attack:"In a flat network, one compromised device can reach everything. Most large breaches spread laterally through exactly that."},
psets:[
{id:"7.1", title:"Storefront", kind:"Design", diff:"Hard", time:"~8 hrs", lang:"Design doc + diagram",
problem:"Design the complete network for the 119-store chain you addressed in week 2. Write it as a design doc another engineer could build from.",
task:["Goals and non-goals","Store LAN: switching, VLANs, wireless","WAN: primary and backup paths, and failover behavior","Divisional office and data center connectivity","Payment isolation: a table of every allowed flow (source, destination, port, reason)","Decisions, with the alternatives you rejected and why","Open risks"],
constraints:["A store must keep selling during a primary WAN outage","Failover in under 60 seconds","Payment systems reachable only from registers and the payment processor","One technician can deploy a new store in one day"],
accept:["A peer can build store 120 from your doc without asking you anything","Every PCI flow is in the table, and everything else is denied","Your diagram matches your flow table"]},
{id:"7.2", title:"What Breaks", kind:"Analyze", diff:"Medium", time:"~3 hrs", lang:"Table",
problem:"Run a failure-mode analysis on your Ember Regions design.",
task:["List ten failures, including: a store switch, the primary WAN link, a core router, DNS, a power circuit, an expired certificate, and a bad configuration push to all stores.","For each: blast radius, how you detect it, time to recover, and one design change that shrinks it."],
accept:["No single failure in your final design takes down all 119 stores","The “bad config push” row has a real answer (staged rollout, canary stores, automatic rollback)"]},
{id:"7.3", title:"Converge", kind:"Build", diff:"Hard", time:"~5 hrs", lang:"containerlab + FRRouting",
problem:"Build a four-router OSPF ring, break a link during a continuous ping, and measure how long traffic is lost before it reroutes. Then make it faster.",
input:"A containerlab topology (starter below) and FRR configs you write.", output:"Packets lost and milliseconds of outage, before and after tuning.",
examples:[{i:"default OSPF timers (hello 10 s, dead 40 s), link r1–r2 cut", o:"≈ 400 pings lost at 0.1 s interval (~40 s outage)", why:"The neighbor isn't declared dead until the dead timer expires. Your numbers will vary."}],
constraints:["Ping every 0.1 s from a host behind r1 to a host behind r3","Cut the link with ip link set ... down inside one router"],
starter:`name: ring
topology:
  nodes:
    r1: {kind: linux, image: quay.io/frrouting/frr:9.1.0}
    r2: {kind: linux, image: quay.io/frrouting/frr:9.1.0}
    r3: {kind: linux, image: quay.io/frrouting/frr:9.1.0}
    r4: {kind: linux, image: quay.io/frrouting/frr:9.1.0}
  links:
    - endpoints: ["r1:eth1", "r2:eth1"]
    - endpoints: ["r2:eth2", "r3:eth1"]
    - endpoints: ["r3:eth2", "r4:eth1"]
    - endpoints: ["r4:eth2", "r1:eth2"]`,
hints:["BFD detects a dead link in milliseconds instead of waiting for OSPF's dead timer.","An interface going down is detected instantly. A silent failure, like a dead box in the middle of the path, is the hard case. Test both."],
accept:["Before-and-after numbers for both the interface-down and silent-failure cases","Failover time at least halved","One paragraph on the trade-off you made (CPU, false positives, flapping)"]}],
check:[
{t:"num", q:"A store has two independent WAN links, each available 99% of the time. What's the store's availability, assuming either link is enough?", a:99.99, tol:0.005, unit:"%", why:"Both are down 1% × 1% = 0.01% of the time."},
{t:"choice", q:"In a leaf-spine data center, how many hops is it from any leaf switch to any other?", o:["1","2 (leaf → spine → leaf)","Depends on the rack","4"], a:1, why:"That predictability is the point of the design."},
{t:"choice", q:"What does putting POS registers in their own VLAN with strict ACLs mainly achieve?", o:["Faster checkout","Smaller blast radius and PCI scope; compromised devices can't reach registers","Fewer IP addresses used","Better Wi-Fi coverage"], a:1, why:"Segmentation limits lateral movement and shrinks what auditors must review."},
{t:"explain", q:"Name one single point of failure common in real store networks, and how you'd remove it.", model:"A good answer names something concrete, like a single WAN circuit, a single core switch, a single power circuit or UPS, or one DHCP/DNS server at the data center. The fix adds independence: a second path from a different carrier or medium (LTE), a redundant switch, local DHCP, or a dual power feed. It also says how failover happens and how you'd know it happened."}],
reads:[["containerlab","https://containerlab.dev/"],["FRRouting docs","https://docs.frrouting.org/"]]
});

WEEKS.push({
id:"w8", num:8, layer:"Blue team", title:"Defense", h1:"Defense: assume someone is already inside",
blurb:"Threat modeling, default-deny firewalls, zero trust and detection you can actually tune.",
big:"Prevention eventually fails, so defense has three jobs: <b>make attacks harder</b>, <b>see them when they happen</b> and <b>limit what they can reach</b>. Start with a threat model so you defend the right things, then layer controls so no single mistake is fatal.",
strip:{type:"shell", cmd:"sudo nft list ruleset", note:"every allow rule is a decision you should be able to defend"},
ideas:[
["Threat modeling","What are we protecting, from whom, and how could it go wrong? STRIDE is a checklist: spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege."],
["Default deny","Allow only traffic that's known to be needed, and drop everything else. It's the single most effective firewall habit."],
["Zero trust","Being on the internal network shouldn't mean being trusted. Check identity and device health on every request."],
["Detection","Logs and alerts only help when someone writes rules that separate normal from suspicious, then tunes out the noise."]],
lenses:{design:"Put security controls where the trust boundaries are, which you find by drawing data flows.", protect:"Layer controls: firewall, segmentation, authentication, logging. Each one catches what the last one missed.", attack:"Attackers go after what you didn't model: the vendor connection, the forgotten test server, the shared admin password."},
psets:[
{id:"8.1", title:"Threat Model", kind:"Analyze", diff:"Medium", time:"~3 hrs", lang:"Diagram + table",
problem:"Apply STRIDE to the card-payment flow in your Ember Regions design.",
task:["Draw the data flow from register to payment processor, marking every trust boundary.","For each component and flow, list the STRIDE threats that apply.","Name the control for each threat, or explicitly accept the risk.","Rank your top five risks by likelihood × impact."],
accept:["Every threat has a control or a written risk acceptance","Your top risk is something you'd actually fund first"]},
{id:"8.2", title:"Default Deny", kind:"Build", diff:"Medium", time:"~3 hrs", lang:"nftables + bash",
problem:"Write a firewall for a lab web server, then write tests that prove it does exactly what you intended.",
input:"Policy: HTTPS from anywhere. SSH only from the management subnet 10.40.250.0/24. Everything else inbound is dropped and logged.", output:"A ruleset plus a test script that prints PASS/FAIL for each case.",
examples:[{i:"curl -sk https://web-lab   (from any host)", o:"PASS: 443 open", why:""},{i:"ssh web-lab   (from 10.40.250.10)", o:"PASS: ssh allowed from mgmt", why:""},{i:"ssh web-lab   (from 10.40.12.5)", o:"PASS: ssh blocked from client LAN", why:"Blocked is the expected result, so the test passes."}],
constraints:["Policy drop on the input chain","Allow established and related return traffic","Rate-limit the drop log so it can't flood the disk"],
starter:`table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    # TODO: HTTPS from anywhere
    # TODO: SSH only from 10.40.250.0/24
    # TODO: log what you drop (rate-limited)
  }
}`,
accept:["Every test passes, including the blocked cases","Dropped packets show up in the log","You can explain each line of the ruleset"]},
{id:"8.3", title:"Something's Knocking", kind:"Detect", diff:"Medium", time:"~4 hrs", lang:"Python",
problem:"Write a port-scan detector. Given connection records sorted by time, return every source that contacted at least <code>N</code> distinct (destination, port) pairs within any <code>W</code>-second window.",
input:"<code>records</code>: list of (ts, src, dst, dport). <code>n</code>: int. <code>w</code>: seconds.", output:"A sorted list of flagged source IPs.",
examples:[{i:"records = [(0,'a','h1',22), (1,'a','h1',80), (2,'a','h1',443),\n           (5,'b','h2',443), (30,'b','h2',443)]\ndetect(records, n=3, w=10)", o:"['a']", why:"a touched 3 distinct ports in 2 seconds. b only ever touched 1 pair."}],
constraints:["Up to 10⁶ records","O(n) overall using a sliding window per source","Count distinct (dst, dport) pairs, not raw connections"],
starter:`from collections import defaultdict, deque, Counter

def detect(records, n, w):
    windows = defaultdict(deque)   # src -> deque of (ts, (dst, dport))
    counts = defaultdict(Counter)  # src -> Counter of pairs in window
    flagged = set()
    for ts, src, dst, dport in records:
        ...
    return sorted(flagged)`,
hints:["When a record falls out of the window, decrement its pair's count, and delete the key when it hits zero so len(counts[src]) stays accurate.","Test on your own lab: scan one of your VMs from another and feed in the Zeek conn.log."],
accept:["The example passes","It flags a real scan of your own lab","Silent during an hour of normal traffic, or you explain each false positive and how you tuned it"]},
{id:"8.4", title:"Logs Tell Stories", kind:"Investigate", diff:"Hard", time:"~6 hrs", lang:"Splunk BOTS",
problem:"Reconstruct an incident from logs using Splunk's public Boss of the SOC dataset, which was built for exactly this practice.",
task:["Find the first sign of trouble.","Trace how it spread.","Identify what was accessed or taken.","Note when it could have been detected, and by which log source."],
accept:["A timeline someone who never saw a log could follow","Two detections you'd write that would have caught it earlier"]}],
check:[
{t:"text", q:"An attacker changes prices in messages between the register and the server. Which STRIDE category is that?", acc:["tampering","t"], why:"Tampering means modifying data in transit or at rest."},
{t:"choice", q:"What does a default-deny firewall policy mean?", o:["Block known-bad IPs","Drop everything not explicitly allowed","Deny all outbound traffic","Require a password for every packet"], a:1, why:"The safe failure mode is closed: anything you forgot to allow stays blocked."},
{t:"choice", q:"Which signal best indicates a port scan?", o:["One source sending a lot of bytes to one port","One source touching many distinct ports or hosts in a short time","Many sources reaching port 443","A single failed login"], a:1, why:"Breadth across ports or hosts in a short window is the signature."},
{t:"explain", q:"How does zero trust differ from a traditional perimeter model?", model:"A perimeter model trusts anything inside the network once it's past the firewall. Zero trust treats the network location as meaningless: every request must prove who the user is and that the device is healthy, and gets only the access that request needs. So a compromised internal machine doesn't automatically reach everything."}],
reads:[["Zeek docs","https://docs.zeek.org/"],["Splunk BOTS v3 dataset","https://github.com/splunk/botsv3"],["OWASP threat modeling","https://owasp.org/www-community/Threat_Modeling"]]
});

WEEKS.push({
id:"w9", num:9, layer:"Red team · lab only", title:"Offense, in the lab", h1:"Offense: thinking like an attacker to defend better",
blurb:"The kill chain, attack surface and root causes, practiced only on systems built for it.",
big:"Attackers don't see layers. They see <b>assumptions</b>: a service that trusts its input, a password nobody changed, a vendor connection nobody watches. Learning the attacker's loop (find what's exposed, find a weakness, use it, expand) makes you a far better designer and defender. Everything here happens on your own systems or on platforms built for practice.",
strip:{type:"shell", cmd:"nmap -sV 192.168.56.0/24", note:"your own lab subnet only"},
ideas:[
["The kill chain","Recon, initial access, persistence, lateral movement, objective. Defenders win by breaking any one link, and the earlier the better."],
["Attack surface","Everything reachable is a possible way in: open ports, web apps, VPNs, email, vendors. Shrinking it is often the cheapest defense."],
["Common root causes","Default credentials, unpatched software, trusting user input and over-broad permissions explain most real breaches."],
["Write-ups","Professionals document every finding as: what, how it was found, impact, root cause and fix. That habit separates testing from vandalism."]],
lenses:{design:"Every exposed service needs an owner and a reason to exist.", protect:"Test your own defenses the way an attacker would, then fix what you find.", attack:"Stay inside the rules of engagement: written permission, defined scope, and a report at the end."},
psets:[
{id:"9.1", title:"Bandit", kind:"CTF", diff:"Easy", time:"~8 hrs", lang:"SSH + Linux shell",
problem:"Complete OverTheWire Bandit levels 0 through 20. It's a free, legal wargame. Each level hides the password to the next one, and finding it teaches a Linux, SSH, permissions or networking skill.",
input:"<code>ssh bandit0@bandit.labs.overthewire.org -p 2220</code> (password: bandit0)", output:"The password for each next level, found by you.",
constraints:["Don't search for walkthroughs. Use man pages and the hints on each level page","Don't publish the passwords; the site asks you not to"],
hints:["Most early levels are about reading files that are hard to find or hard to open (odd names, hidden files, permissions).","Later levels introduce netcat, openssl, and comparing files. Read man nc and man diff."],
accept:["You reach level 21","A notes file with one line per level naming the concept it taught","You can explain every level without looking at your notes"]},
{id:"9.2", title:"Mirror", kind:"Harden", diff:"Medium", time:"~4 hrs", lang:"nmap + your lab",
problem:"See your own lab the way an attacker would, then shrink its attack surface.",
task:["Scan your own lab subnet with service detection and list every open port and version.","For each service, decide: needed, needed but restrict, or remove.","Apply the changes: uninstall, bind to localhost, firewall, or patch.","Scan again and compare."],
constraints:["Only your own lab network"],
accept:["A before-and-after table of open ports","Every remaining port has a written reason to exist","At least one finding traced to its root cause (for example, a package that installed a service you didn't need)"]},
{id:"9.3", title:"Through the HVAC", kind:"Write-up", diff:"Medium", time:"~3 hrs", lang:"Writing",
problem:"Map the 2013 Target breach to the kill chain using the public U.S. Senate Commerce Committee report.",
task:["Trace each stage, from the HVAC vendor's stolen credentials to card data leaving the network.","At each stage, name the control that could have stopped or detected it. Several existed, and alerts did fire.","Compare with your Ember Regions design and threat model."],
accept:["A stage-by-stage table: attacker action, missed control, what would have worked","You name the earliest point where segmentation would have ended the attack","An honest paragraph on whether your design would have stopped it"]}],
check:[
{t:"choice", q:"How did attackers first get into Target's network in 2013?", o:["A zero-day in the payment terminals","Credentials stolen from an HVAC vendor","A rogue employee","An unpatched web server"], a:1, why:"A third-party vendor's access was the way in."},
{t:"choice", q:"Which kill-chain stage does network segmentation disrupt most directly?", o:["Recon","Initial access","Lateral movement","Persistence"], a:2, why:"Segmentation limits where a compromised host can reach."},
{t:"text", q:"Which nmap flag probes open ports to identify service versions?", acc:["-sv","sv","-s v"], why:"-sV runs version detection."},
{t:"explain", q:"Why does a professional finding always include the root cause and the fix, not just the exploit?", model:"The goal is to make the system safer, not to prove you got in. The root cause shows which class of problem to fix everywhere, such as default passwords as a practice rather than one device. The fix makes the report actionable for the people who own the system. Without both, a finding is just a list of break-ins."}],
reads:[["OverTheWire Bandit","https://overthewire.org/wargames/bandit/"],["MITRE ATT&CK","https://attack.mitre.org/"],["picoCTF","https://picoctf.org/"]]
});

WEEKS.push({
id:"w10", num:10, layer:"Layer 7 · Security", title:"App security", h1:"Application security: where most breaches actually start",
blurb:"Injection, XSS, sessions and broken access control, and why it's all one mistake.",
big:"Firewalls let web traffic through by design, so the application becomes the front door. Nearly every web vulnerability is the same mistake: <b>treating data as instructions</b>. When user input ends up inside a database query, a web page or a shell command without being kept separate from the code, the user gets to write part of your program.",
strip:{type:"shell", cmd:"docker run -p 3000:3000 bkimminich/juice-shop", note:"an intentionally vulnerable app, on your machine"},
ideas:[
["Injection","Building a SQL query by pasting strings together lets input change the query's meaning. Parameterized queries keep data and code separate."],
["Cross-site scripting","The same mistake in HTML: input rendered as markup runs as script in other users' browsers. Output encoding and a Content Security Policy prevent it."],
["Sessions and auth","After login, a cookie is your identity. Protect it with <code>Secure</code>, <code>HttpOnly</code> and <code>SameSite</code>, and check permissions on every request, not just in the menu."],
["The OWASP Top 10","A ranked list of the most common web risks. Broken access control has been number one since 2021."]],
lenses:{design:"Use frameworks that make the safe thing the default: ORMs, auto-escaping templates, built-in CSRF protection.", protect:"Test access control explicitly: can user A see user B's data? Write that test before shipping.", attack:"Practice on apps built to be broken (Juice Shop, PortSwigger labs), then trace each bug to the code that caused it."},
psets:[
{id:"10.1", title:"Data, Not Code", kind:"Break-fix", diff:"Easy", time:"~3 hrs", lang:"Python + sqlite3",
problem:"This login function breaks for a real customer named O'Brien. Explain why, fix it properly, and fix the password storage while you're there.",
input:"<code>login(db, username, password)</code>", output:"The user's id, or None if the credentials are wrong. It must never raise on unusual but valid input.",
examples:[{i:"login(db, \"O'Brien\", \"correct horse\")   # before the fix", o:"sqlite3.OperationalError: syntax error", why:"The apostrophe ends the string literal early, and the rest is parsed as SQL."},{i:"login(db, \"O'Brien\", \"correct horse\")   # after the fix", o:"7", why:"The name is passed as a parameter, so it's only ever treated as data."}],
constraints:["Use ? placeholders, never string formatting, for anything in a query","Store passwords with argon2 or bcrypt, never a plain or fast hash","Compare in constant time (the password library does this for you)"],
starter:`import sqlite3, hashlib

def login(db, username, password):
    q = f"SELECT id FROM users WHERE name='{username}' AND pw_hash='{hashlib.md5(password.encode()).hexdigest()}'"
    row = db.execute(q).fetchone()
    return row[0] if row else None`,
hints:["With placeholders, the query text never changes. Only the values do.","Look up the user by name first, then verify the password hash in Python with the password library."],
accept:["O'Brien can log in, and wrong passwords return None","No query in your code is built with + or f-strings","You complete the Apprentice-level SQL injection labs on PortSwigger Web Security Academy","One paragraph on why parameterization fixes the whole bug class, not just this instance"]},
{id:"10.2", title:"Session", kind:"Build", diff:"Medium", time:"~5 hrs", lang:"Flask or Express",
problem:"Build a small notes app with login that you'd trust with your own account.",
task:["Registration, login and logout, with argon2 password hashing","Session cookie with Secure, HttpOnly and SameSite=Lax","CSRF tokens on every form that changes state","A notes page where each user can only see and edit their own notes"],
constraints:["Every route checks ownership on the server, not just by hiding links"],
accept:["An automated test proves user A gets 403/404 for user B's note","That test fails if you delete the ownership check","You audit against the OWASP Authentication and Session Management cheat sheets and fix what you find"]},
{id:"10.3", title:"Juice Shop", kind:"CTF", diff:"Medium", time:"~8 hrs", lang:"Browser + DevTools",
problem:"Run OWASP Juice Shop locally and solve ten challenges from its scoreboard. It's an intentionally vulnerable shop that tracks your progress.",
input:"<code>docker run -p 3000:3000 bkimminich/juice-shop</code>, then open localhost:3000", output:"Ten solved challenges on the scoreboard, plus write-ups.",
constraints:["Run it locally only","Start with one- and two-star challenges, then go up"],
accept:["Ten challenges solved","Each write-up gives: vulnerability class, root cause, and the code change that fixes it","A developer could fix all ten from your write-ups without asking you"]}],
check:[
{t:"choice", q:"A login query is built by concatenating strings, and a user named O'Brien tries to log in. What happens?", o:["It works normally","The apostrophe ends the string early and the query breaks","The database escapes it automatically","The user is logged in as admin"], a:1, why:"Input changed the structure of the query. That's the bug class in its most innocent form."},
{t:"text", q:"Which cookie attribute stops JavaScript from reading the cookie?", acc:["httponly","http only","http-only"], why:"HttpOnly cookies are sent with requests but hidden from document.cookie."},
{t:"choice", q:"What's number one on the OWASP Top 10 (2021)?", o:["Injection","Broken access control","Cryptographic failures","Security misconfiguration"], a:1, why:"Users reaching data or actions they shouldn't is the most common serious flaw."},
{t:"explain", q:"Why do parameterized queries fix SQL injection as a class, not just one bug?", model:"The query's structure is fixed and sent separately from the values, so the database never parses user input as SQL, whatever characters it contains. You no longer depend on correctly escaping every possible input in every place. One consistent practice removes the whole category."}],
reads:[["PortSwigger Web Security Academy","https://portswigger.net/web-security"],["OWASP Top 10","https://owasp.org/www-project-top-ten/"],["OWASP Cheat Sheets","https://cheatsheetseries.owasp.org/"]]
});

WEEKS.push({
id:"w11", num:11, layer:"Systems at scale", title:"Cloud & distributed", h1:"Distributed systems: many computers pretending to be one",
blurb:"Load balancing, consensus, CAP and cloud networks defined as code.",
big:"Past a certain size, one machine isn't enough, so you spread the work across many. Now the network is inside your program, and it can be slow, lose messages or split in half. Distributed systems is the study of staying correct anyway. <b>The cloud</b> is mostly this, plus software-defined networks you configure as code.",
strip:{type:"shell", cmd:"terraform plan", note:"see the network change before anything changes"},
ideas:[
["Load balancing","Spread requests across servers and stop sending to dead ones. Layer 4 balancers route connections. Layer 7 balancers route individual requests."],
["CAP","When the network splits, you must choose: stay consistent and refuse some requests, or stay available and risk serving stale data."],
["Consensus","Raft and Paxos let a group of servers agree on one value even when some fail. Every serious database and cluster manager depends on it."],
["Cloud networking","A VPC is a virtual data center: subnets, route tables and security groups. The same week 2 ideas, configured through an API instead of cables."]],
lenses:{design:"Design for failure at every layer: multiple zones, health checks, timeouts and retries with backoff.", protect:"Security groups are default-deny firewalls attached to each machine. Use them like your week 8 rules.", attack:"Misconfigured cloud storage and over-broad identity permissions cause more cloud breaches than exploits do."},
psets:[
{id:"11.1", title:"Balance", kind:"Build", diff:"Medium", time:"~5 hrs", lang:"Python or Go",
problem:"Write an HTTP load balancer. Round-robin across backends, health-check each one, take failing backends out of rotation, and put them back when they recover.",
input:"Backends from a config list. Health check: GET /health every 2 s.", output:"Proxied responses. A log line whenever a backend changes state.",
examples:[{i:"backends: :8001 :8002 :8003\n6 requests", o:"8001, 8002, 8003, 8001, 8002, 8003", why:"Round-robin."},{i:"kill :8002, wait 5 s, send 4 requests", o:"[health] 8002 DOWN\n8001, 8003, 8001, 8003", why:"Two failed checks mark it down."}],
constraints:["Down after 2 consecutive failed checks, up after 2 consecutive successes","Proxy timeout 3 s","Don't lose in-flight requests when a backend is marked down"],
accept:["Both examples behave as shown","Killing a backend during a load test causes zero failed requests after detection","You measure how many requests fail between the kill and detection, and explain the number"],
stretch:["Add least-connections balancing and compare tail latency (p99) with round-robin."]},
{id:"11.2", title:"Elect", kind:"Build", diff:"Hard", time:"~8 hrs", lang:"Python",
problem:"Implement Raft leader election in a simulation. Five nodes, randomized election timeouts, RequestVote messages over a simulated network you can partition.",
input:"A simulation clock and a network object that can delay, drop or partition messages.", output:"A log of state changes: who became candidate, who voted for whom, and who became leader in which term.",
examples:[{i:"start 5 nodes, run 2 s", o:"t=0.21 N3 → candidate (term 1)\nt=0.22 N3 → leader (term 1, votes 4/5)", why:"Your timings will differ; one leader emerges."},{i:"partition {N1,N2,N3} | {N4,N5}, kill the leader", o:"majority side elects a new leader in term 2\nminority side: candidates keep timing out, no leader", why:"Only 3 of 5 can form a quorum."}],
constraints:["Election timeout random in 150–300 ms","Each node votes at most once per term","A candidate needs a strict majority (3 of 5)"],
hints:["Read sections 5.1–5.2 of the Raft paper. It was written to be understandable.","Write an invariant checker that runs after every event: at most one leader per term."],
accept:["Your invariant checker never fires across 1,000 randomized runs with kills and partitions","After a partition heals, the cluster converges on a single leader"]},
{id:"11.3", title:"VPC as Code", kind:"Design", diff:"Medium", time:"~4 hrs", lang:"Terraform",
problem:"Define a three-tier cloud network in Terraform. You don't need to apply it; terraform plan is enough.",
task:["Two availability zones","Public subnets for the load balancer","Private subnets for app servers, with egress via NAT","Isolated subnets for the database, with no internet route at all","Security groups allowing only LB → app on 8080 and app → DB on 5432"],
accept:["terraform validate and terraform plan succeed","Your security groups mirror the flow table from your Ember Regions design","You explain what the plan output would create, line by line"]}],
check:[
{t:"num", q:"How many nodes must agree for a 5-node Raft cluster to elect a leader?", a:3, tol:0, unit:"nodes", why:"A strict majority: floor(5/2) + 1."},
{t:"num", q:"How many node failures can a 5-node Raft cluster survive and still make progress?", a:2, tol:0, unit:"nodes", why:"With 2 down, 3 remain, which is still a majority."},
{t:"choice", q:"During a network partition, what does a consistency-first (CP) system do on the minority side?", o:["Accepts writes and merges later","Refuses requests it can't guarantee are consistent","Elects a second leader","Restarts"], a:1, why:"It gives up availability rather than risk divergent data."},
{t:"choice", q:"What can a layer 7 load balancer do that a layer 4 one can't?", o:["Route by URL path or header","Balance TCP connections","Health-check backends","Use round-robin"], a:0, why:"Layer 7 sees the HTTP request itself."},
{t:"explain", q:"Why is a 4-node consensus cluster no more fault-tolerant than a 3-node one?", model:"A majority of 4 is 3, so a 4-node cluster can lose only 1 node, the same as a 3-node cluster (majority 2). The extra node adds cost and another possible failure without adding tolerance. That's why clusters use odd sizes: 3, 5, 7."}],
reads:[["The Raft site and paper","https://raft.github.io/"],["Designing Data-Intensive Applications","https://dataintensive.net/"]]
});

WEEKS.push({
id:"w12", num:12, layer:"Metadata", title:"Privacy & anonymity", h1:"Privacy: encryption hides what you say, not who you talk to",
blurb:"Metadata, VPNs, onion routing and the timing analysis that limits them all.",
big:"TLS hides content, but the network still sees <b>metadata</b>: who connects to whom, when, how often and how much. That's often enough to know what you're doing. Tools like <b>VPNs</b> and <b>Tor</b> each hide part of that picture from part of the network, and none of them hides all of it from everyone.",
strip:{type:"shell", cmd:"sudo tcpdump -n port 53", note:"your DNS queries, readable by anyone on the path"},
ideas:[
["VPNs move trust","A VPN hides your traffic from your local network and ISP, but the VPN provider now sees all of it. You haven't removed the observer, only chosen a different one."],
["Onion routing","Tor splits knowledge across three relays so no single relay knows both who you are and where you're going."],
["Traffic correlation","An observer at both ends can match timing and volume patterns, even through encryption. That's Tor's fundamental limit, by design."],
["The cost of hiding","Padding and delays defeat analysis but cost bandwidth and speed. Every privacy system picks a point on that curve."]],
lenses:{design:"Decide who you're hiding from before choosing a tool. Different threat models need different tools.", protect:"Minimize the metadata you create: encrypted DNS, fewer third-party requests, short log retention.", attack:"Correlation and fingerprinting turn innocent-looking metadata into identification. Assume patterns leak."},
psets:[
{id:"12.1", title:"Onion", kind:"Build", diff:"Medium", time:"~5 hrs", lang:"Python + cryptography",
problem:"Build a toy three-hop onion router on your own machine. The client wraps a message in three layers of encryption, and each relay peels exactly one layer, logs what it can see, and forwards the rest.",
input:"<code>wrap(message: bytes, keys: list[bytes]) -> bytes</code> and <code>peel(blob: bytes, key: bytes) -> (next_hop, inner)</code>", output:"The final relay recovers the original message. Each relay's log shows only its neighbors.",
examples:[{i:"keys = [k_guard, k_middle, k_exit]\nblob = wrap(b'hello', keys)\npeel → peel → peel", o:"guard log:  from=client  to=middle\nmiddle log: from=guard   to=exit\nexit log:   from=middle  message=b'hello'", why:"No single log contains both “client” and the message."}],
constraints:["Three relay processes on localhost, each listening on its own port","Use Fernet from the cryptography library for each layer","Each layer contains the next hop's address plus the inner blob"],
starter:`from cryptography.fernet import Fernet
import json

def wrap(message: bytes, keys: list[bytes], hops: list[str]) -> bytes:
    # innermost layer first: the exit's layer holds the message
    blob = message
    for key, nxt in zip(reversed(keys), reversed(hops)):
        ...
    return blob

def peel(blob: bytes, key: bytes) -> tuple[str, bytes]:
    ...`,
accept:["The message arrives intact","The three relay logs prove the split-knowledge property","One paragraph on what this toy is missing compared with real Tor (circuit setup, fixed cell sizes, guard pinning)"]},
{id:"12.2", title:"Shadows", kind:"Simulate", diff:"Hard", time:"~4 hrs", lang:"Python + numpy",
problem:"Show how timing alone can link encrypted flows, then measure what it costs to stop it. Everything here is synthetic data you generate yourself.",
input:"50 synthetic users, each sending packets at random times through a simulated relay that adds random delay.", output:"Matching accuracy (input flow → output flow), and a plot of accuracy against added delay.",
examples:[{i:"relay delay uniform(0, 10 ms)", o:"accuracy ≈ 0.9+", why:"Small delays barely blur the timing patterns."},{i:"relay delay uniform(0, 2 s) + cover traffic", o:"accuracy falls toward 1/50", why:"Your exact numbers will differ."}],
constraints:["Match flows by correlating binned packet counts","Report the latency cost of each defense setting"],
accept:["A plot of privacy (lower accuracy) against latency cost","One paragraph on why low-latency systems like Tor accept this weakness"]},
{id:"12.3", title:"What Your Queries Say", kind:"Observe", diff:"Easy", time:"~2 hrs", lang:"tcpdump",
problem:"See your own metadata.",
task:["Capture your own DNS queries for a few hours of normal use.","Write what a stranger could infer from the query list alone.","Turn on DNS over HTTPS in your browser or OS, capture again, and confirm the local network can no longer read the queries."],
accept:["A short list of inferences from your own queries (keep anything personal private)","A sentence naming exactly who can see your DNS before and after the change"]}],
check:[
{t:"choice", q:"What does a Tor guard (entry) relay know about you?", o:["Your IP address and your destination","Your IP address but not your destination","Your destination but not your IP","Nothing at all"], a:1, why:"The guard is your first hop, so it sees you, but the destination is still wrapped in two more layers."},
{t:"choice", q:"With a commercial VPN, who can see both your real IP and the sites you visit?", o:["Your ISP","The VPN provider","The websites","Nobody"], a:1, why:"A VPN moves trust from your ISP to the provider. It doesn't remove it."},
{t:"choice", q:"What does a traffic correlation attack on Tor require?", o:["Breaking AES","Running the directory authorities","Seeing traffic at both ends of the circuit","Your Tor password"], a:2, why:"Timing and volume at the entry side line up with the exit side."},
{t:"explain", q:"Why doesn't Tor add heavy padding and delays to defeat timing analysis?", model:"Heavy padding and multi-second delays would make browsing painfully slow and use far more bandwidth from volunteer relays. Fewer people would use it, which shrinks the crowd you're hiding in. Tor deliberately chose low latency for usability, accepting that an observer at both ends can correlate flows."}],
reads:[["Tor specifications","https://spec.torproject.org/"],["WireGuard whitepaper","https://www.wireguard.com/papers/wireguard.pdf"]]
});

WEEKS.push({
id:"w13", num:13, layer:"Innovate", title:"The frontier", h1:"The frontier: where networking is being reinvented",
blurb:"eBPF and XDP, programmable switches, QUIC, and post-quantum key exchange.",
big:"For decades, network behavior was fixed inside vendor hardware. That's changing. You can now <b>program the network itself</b>: run code inside the Linux kernel's packet path, redefine how switches parse packets, and replace TCP with protocols built in user space. People who understand the fundamentals are the ones designing what comes next.",
strip:{type:"shell", cmd:"sudo bpftool prog list", note:"code running inside the kernel's network stack"},
ideas:[
["eBPF and XDP","Small, verified programs run inside the kernel on every packet, before the normal stack sees it. They power load balancers, firewalls and monitoring at line rate."],
["SDN and P4","Separate the control plane (the brain) from the data plane (the muscle). P4 lets you define what a switch even considers a header."],
["QUIC and HTTP/3","TCP and TLS rebuilt on top of UDP: faster handshakes, no head-of-line blocking, and connections that survive switching networks."],
["Post-quantum crypto","Future quantum computers could break today's key exchange. New algorithms like ML-KEM are already deployed in TLS alongside the classic ones."]],
lenses:{design:"Programmable data planes let you build exactly the forwarding behavior you need, at the cost of owning that code.", protect:"eBPF powers modern runtime security and observability tools, but loading eBPF itself requires high privilege. Guard it.", attack:"Every new layer of programmability is new attack surface. That's why the eBPF verifier exists."},
psets:[
{id:"13.1", title:"Line Rate", kind:"Build", diff:"Hard", time:"~6 hrs", lang:"C (eBPF) + bpftool",
problem:"Write an XDP program that counts packets by IP protocol in a BPF map, attach it to an interface in your lab, and print the counts every second from user space. Then make it drop ICMP.",
input:"Packets arriving on a veth interface in your lab.", output:"Per-second counts of TCP, UDP and ICMP packets. With the drop flag on, pings fail while other traffic flows.",
examples:[{i:"ping -i 0.2 + curl in a loop, for 5 s", o:"tcp=412 udp=6 icmp=25", why:"Your counts will differ."}],
constraints:["Use a BPF_MAP_TYPE_PERCPU_ARRAY indexed by protocol number","Bounds-check every header access, or the verifier will reject the program","Only attach to interfaces in your own lab"],
starter:`#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 256);
    __type(key, __u32);
    __type(value, __u64);
} proto_count SEC(".maps");

SEC("xdp")
int count_proto(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *end  = (void *)(long)ctx->data_end;
    // TODO: parse ethhdr, check h_proto == ETH_P_IP, parse iphdr,
    //       bump proto_count[iph->protocol]
    return XDP_PASS;
}
char LICENSE[] SEC("license") = "GPL";`,
hints:["Every pointer you dereference must first be checked with something like if ((void *)(eth + 1) > end) return XDP_PASS;.","Attach with ip link set dev veth0 xdp obj prog.o sec xdp, and read the map with bpftool map dump."],
accept:["The verifier accepts your program","Counts match what you generated","ICMP drop works, and you can explain why dropping in XDP is cheaper than dropping in nftables (see the diagram)"]},
{id:"13.2", title:"One Round Trip", kind:"Capture", diff:"Medium", time:"~3 hrs", lang:"Wireshark",
problem:"Compare HTTP/2 over TCP with HTTP/3 over QUIC for the same site, and count the round trips before the first byte of the page arrives.",
task:["Set <code>SSLKEYLOGFILE</code> so Wireshark can decrypt your own browser's traffic.","Capture a fresh visit with HTTP/3 enabled, then with HTTP/3 disabled.","Count round trips before the first HTTP response byte in each."],
accept:["Both captures annotated","You point at exactly where QUIC saves a round trip"]},
{id:"13.3", title:"Request for Comments", kind:"Write-up", diff:"Hard", time:"~6 hrs", lang:"Writing",
problem:"Propose an improvement to something you studied this course, written in the style of an RFC.",
task:["Pick a weakness: ARP's blind trust, BGP hijacks, DNS privacy, metadata leaks, slow failover, or your own idea.","Sections: Problem, Proposed design, Why existing fixes fall short, Deployment path, Security considerations."],
accept:["Two to four pages","The Security Considerations section explains how your own proposal could be abused","A peer can name the one change you're proposing in a sentence"]}],
check:[
{t:"choice", q:"Where does an XDP program run?", o:["In user space after the socket","In the network driver, before the kernel allocates its packet structures","Inside the web browser","On the switch's ASIC"], a:1, why:"That early position is what makes XDP drops and redirects so cheap."},
{t:"num", q:"For a brand-new connection, how many round trips does TCP + TLS 1.3 take before the client can send its HTTP request?", a:2, tol:0, unit:"RTTs", why:"One for the TCP handshake, one for the TLS handshake."},
{t:"num", q:"And for a brand-new QUIC connection (HTTP/3)?", a:1, tol:0, unit:"RTT", why:"QUIC combines the transport and crypto handshakes into one round trip."},
{t:"choice", q:"What is ML-KEM for?", o:["Compressing packets","Post-quantum key exchange (key encapsulation)","Load balancing","Signing DNS records"], a:1, why:"It's the NIST-standardized post-quantum key encapsulation mechanism, already deployed in hybrid TLS."},
{t:"explain", q:"Summarize your RFC idea in three sentences: the problem, the change, and its biggest risk.", model:"A strong answer states one concrete problem (for example, any host can answer ARP for the gateway), one specific change (for example, switches cryptographically bind the gateway's MAC learned at provisioning), and an honest risk (key management on thousands of access switches, or breaking legitimate failover). If you can't say it in three sentences, the proposal isn't sharp enough yet."}],
reads:[["ebpf.io","https://ebpf.io/"],["p4.org","https://p4.org/"],["RFC 9000 · QUIC","https://www.rfc-editor.org/rfc/rfc9000"]]
});

var FINAL = {
id:"final", title:"Final project", h1:"Final project: build something real, then defend it",
blurb:"Your choice of project. It must touch at least three layers, survive your own attack, and be presented to a team that would run it.",
steps:[["Pitch","One page: the problem, who it's for, and what success looks like."],["Build","Working code or infrastructure, plus a diagram and a design doc."],["Threat model and test","STRIDE it, attack it in your own lab, and fix what you find."],["Present","A 10-minute demo and a written post-mortem of what you'd change."]],
ideas:[["Store-in-a-box","A containerlab replica of one store from your Ember Regions design, with monitoring, alerting and a live failover demo."],["Home network sensor","A Raspberry Pi running Zeek, your own detectors, and a dashboard of everything each device on your network talks to."],["Your own VPN service","WireGuard with automated key rotation, a status page, and a threat model of what the server operator can see."],["Mini CDN","Your week 4 resolver plus your week 11 load balancer, routing users to the nearest of three cache nodes and surviving node failure."]],
pset:{id:"F", title:"Final project complete", kind:"Capstone", diff:"Hard", time:"~40 hrs", lang:"Your choice",
problem:"Check this off when you've presented your project and published your post-mortem.",
accept:["Touches at least three layers of the stack","Has a design doc, a diagram and a threat model","You attacked it in your own lab and fixed at least one real finding","Presented, with a written post-mortem"]}
};
