// Snowball layer: what each section carries in, what it unlocks, Ember milestones,
// one practical case per section traced through five lenses, and what each problem set builds on.
var EMBER = {
w0:{ms:"Set Ember's latency budget: a message should cross your lab in under 200 ms, and you can now measure where the time goes. By the end, Ember 1.0 is clients that find it by name (4.1), chat servers (5.1) behind your load balancer (11.1), end-to-end encryption (6.1), logins (10.2), and a firewall and detectors on every node (8.2, 8.3).", carry:[["Setup","Your lab VM and tools"]], unlock:[["w3","Window sizes come from the bandwidth-delay product"],["w13","Why QUIC saves a round trip"]]},
w1:{ms:"Ember's lab LAN: you can explain every frame Ember's hosts send, and your 1.3 detector watches for anyone lying about the gateway.", carry:[["w0","Bits, signals and the latency budget"]], unlock:[["w2","Routing between Ember's subnets"],["w8","Layer 2 threats in Ember's threat model"]]},
w2:{ms:"Ember's address plan: clients, servers, sensors and management each get their own subnet, and every site summarizes to one route.", carry:[["w1","Frames only reach one hop, so something has to route"],["w1","1.1 Switchboard: table lookups, now done with prefixes"]], unlock:[["w7","Ember Regions, the multi-site design"],["w11","The same plan as cloud VPC subnets"]]},
w3:{ms:"Ember's first wire protocol: your reliable-UDP transport from 3.1 carries messages in the lab. In section 5 Ember moves to TCP, and in 13.2 you compare both with QUIC.", carry:[["w0","The bandwidth-delay product sizes your window"],["w2","Packets can be dropped or reordered on any hop"]], unlock:[["w5","Ember's server uses TCP sockets"],["w13","Compare your protocol with QUIC"]]},
w4:{ms:"Ember gets a name: in the final project your resolver answers for ember.lab itself, and clients speak HTTP to it.", carry:[["w2","Addresses and routing"],["w3","TCP carries HTTP"]], unlock:[["w6","TLS protects Ember's HTTP"],["w11","Your resolver steers users to the nearest Ember node"]]},
w5:{ms:"Ember v0.1 ships: the 5.1 chat server is Ember's core, running inside the container you build by hand in 5.3.", carry:[["w3","TCP is a byte stream, so you frame messages yourself"],["w4","Clients find the server by name"]], unlock:[["w6","End-to-end encryption for Ember messages"],["w11","Three Ember servers behind a load balancer"]]},
w6:{ms:"Ember's encryption design: you build the key exchange in 6.1, and its stretch wires it into Ember's clients so the server relays only ciphertext, with signatures proving who's who.", carry:[["w5","Ember's server relays messages it shouldn't be able to read"],["w4","TLS was a black box; now you open it"]], unlock:[["w8","Threat-model Ember's keys"],["w12","Hide who talks to whom, not just what is said"]]},
w7:{ms:"Ember Regions: a design doc for running Ember across two data centers and a growing number of edge sites.", carry:[["w2","Your address plan"],["w5","What Ember's servers need to reach"],["w6","Where keys and certificates live"]], unlock:[["w8","Threat-model this design"],["w11","Implement its load balancing and failover"]]},
w8:{ms:"Ember is defended: a threat model, a default-deny firewall on every node, and your scan detector feeding the logs.", carry:[["w7","The Ember Regions design you're defending"],["w1","Your ARP detector"],["w3","Thinking in flows and ports"]], unlock:[["w9","Test these defenses in the lab"],["w10","Secure Ember's web login"]]},
w9:{ms:"Ember gets audited: you scan your own Ember lab deployment, fix what you find, and write it up like a professional.", carry:[["w8","The defenses you're testing"],["w5","Ember's services and ports"]], unlock:[["w10","Flaws inside the application itself"],["final","The red-team step of your capstone"]]},
w10:{ms:"Ember gets accounts: a web login with safe sessions and per-user access control (10.2).", carry:[["w6","Password hashing and secure transport"],["w9","Root-cause thinking"]], unlock:[["w11","Sessions across many servers"],["final","Ember's web client"]]},
w11:{ms:"Ember scales out: three Ember nodes behind your load balancer, with Raft deciding which node owns each chat room.", carry:[["w5","The Ember server"],["w7","The Ember Regions design"],["w4","Your resolver"]], unlock:[["w13","A fast-path filter in front of the balancer"],["final","Ember 1.0"]]},
w12:{ms:"Ember minimizes metadata: relays learn as little as possible about who talks to whom.", carry:[["w6","Ember's encryption"],["w11","Ember's multi-node relays"]], unlock:[["w13","Write Ember's protocol as an RFC"],["final","The privacy section of your threat model"]]},
w13:{ms:"Ember's fast path and spec: an XDP filter protects Ember's port, and your RFC documents the Ember protocol.", carry:[["w3","Your transport protocol"],["w8","Your detection logic"],["w11","The load balancer it protects"]], unlock:[["final","Ember 1.0"]]}
};

var LENSCASE = {
w0:{t:"A surgeon operating a robot 1,500 km away",
 think:"The robot must follow the surgeon's hand fast enough to feel instant, roughly under 150 ms round trip. Fiber over 1,500 km already costs about 15 ms before anything else, so the rest of the budget goes to queues, encoding and processing.",
 design:"Use a dedicated or prioritized path, keep control packets small so transmission time is tiny, and measure jitter, not just average latency. Put the video encoder and controller close to the network edge to cut processing delay.",
 protect:"Run two physically separate fiber routes, so one cut cable can't stop a procedure. Encrypt and authenticate the control stream so commands can't be injected.",
 attack:"An attacker doesn't need to break the encryption, only add delay. Flooding a shared link raises queuing delay past the budget, which is why critical traffic gets its own lane.",
 innovate:"Predictive control lets the robot anticipate motion and hide some latency. Low-orbit satellite links trade fiber's fixed path for a shorter, moving one."},
w1:{t:"A dorm floor where the internet dies every evening",
 think:"Forty students share one switch per floor, and every evening the network crawls, then recovers. Symptoms like this usually live at layer 2: broadcasts, loops, or a device lying about addresses.",
 design:"Give each floor its own VLAN so one floor's problem can't flood the building. Run Rapid Spanning Tree, and make student ports edge ports with BPDU Guard, so a cheap switch looped across two wall jacks gets its port shut down instead of starting a storm. Storm control is the backstop.",
 protect:"DHCP snooping stops a student's home router from handing out addresses. Dynamic ARP inspection stops anyone from claiming to be the gateway.",
 attack:"In your lab, show that one host answering ARP for the gateway pulls the whole segment's traffic through it. That's the pattern you'd search a capture for.",
 innovate:"Many campuses now give each student a private network segment on shared infrastructure, so neighbors can't see each other at layer 2 at all."},
w2:{t:"Two companies merge, and both use 10.0.0.0/8",
 think:"Each company's routing is correct on its own, but now the same prefixes point to two different places. Longest prefix match can't tell them apart.",
 design:"Renumber one side in phases, using NAT at the boundary as a temporary bridge. A clean, summarizable plan for the combined company is the real fix.",
 protect:"During the migration, route filters keep each side from accidentally announcing the other's prefixes and capturing its traffic.",
 attack:"Ambiguous routing helps attackers: traffic can land on the wrong side, and logs become hard to trust because one address can mean two hosts.",
 innovate:"IPv6 gives every organization globally unique space, turning a merger into a routing exercise instead of a renumbering project."},
w3:{t:"A video call over a train's flaky Wi-Fi",
 think:"The link loses packets in bursts and its delay swings constantly. The call needs to stay understandable, not perfect.",
 design:"Send media over UDP with forward error correction and a jitter buffer. The app adjusts its bitrate to measured loss, which is congestion control in another form.",
 protect:"Media is encrypted per packet (SRTP), so losing one packet doesn't stop the next one from being decrypted.",
 attack:"Spoofed or replayed packets can disrupt a call. Sequence numbers and authentication tags let the receiver reject them.",
 innovate:"QUIC-based media transports, and devices that use Wi-Fi and cellular at the same time, keep calls alive through tunnels."},
w4:{t:"A news site during breaking news",
 think:"Traffic jumps fifty-fold in minutes. The origin server can't serve it alone, and every cache miss lands on it.",
 design:"Put the site behind a CDN with long cache lifetimes for articles and short ones for the live page. Lower DNS TTLs ahead of planned events so traffic can be shifted quickly.",
 protect:"Use two DNS providers so one provider's outage doesn't take the site down. Lock the origin so only the CDN can reach it.",
 attack:"Floods are often timed to big news and aimed at uncacheable URLs, forcing every request through to the origin.",
 innovate:"Edge computing renders pages at the CDN, so the origin becomes a data store rather than a web server."},
w5:{t:"A game server for 10,000 players",
 think:"Each player sends small updates 30 times a second. The bottleneck isn't bandwidth, it's handling 300,000 small events per second without stalling.",
 design:"Run one event loop per CPU core instead of one thread per player, and split players across processes by map region. Keep hot state in memory.",
 protect:"Run each game process as an unprivileged user in its own container, so a bug in one doesn't expose the host.",
 attack:"A malformed packet that crashes the parser takes down everyone on that server. Fuzz the input parser before launch.",
 innovate:"Newer kernel interfaces like io_uring cut syscall overhead, which matters when every microsecond is multiplied by 300,000."},
w6:{t:"Clinics sending lab results to a hospital",
 think:"Results must stay private, arrive unmodified, and provably come from the real lab.",
 design:"Use mutual TLS: both clinic and hospital present certificates from a private certificate authority the organization controls.",
 protect:"Rotate certificates automatically with short lifetimes. Forward secrecy keeps past results safe if a key leaks later.",
 attack:"The usual failure isn't broken math. It's an expired certificate that someone “fixes” by turning verification off.",
 innovate:"Post-quantum key exchange matters here, because medical records stay sensitive for decades and traffic recorded today could be decrypted later."},
w7:{t:"A city's emergency dispatch network",
 think:"Emergency calls must be answered even when parts of the network fail. Availability is the requirement everything else serves.",
 design:"Run two dispatch centers in different locations, each able to carry the whole load. Give every site two network paths from different carriers.",
 protect:"Keep dispatch systems on their own segment, isolated from city office networks and email.",
 attack:"In real incidents, ransomware on a city's office network has disabled dispatch systems that weren't separated from it.",
 innovate:"Next-generation emergency systems run over IP, adding text and video while importing internet-style risks into a life-safety system."},
w8:{t:"A small firm's remote-access server",
 think:"Ten employees work from home through one VPN server exposed to the internet. That server is the firm's whole attack surface.",
 design:"Expose only the VPN port, require multi-factor login, and put the server in a segment that reaches only what remote workers need.",
 protect:"Ship VPN and login logs off the box, and alert on logins from new countries or bursts of failures.",
 attack:"Unpatched VPN appliances are one of the most common ways ransomware groups get in. Patching quickly is the main defense.",
 innovate:"Zero-trust access replaces the VPN with per-application checks, so one stolen login doesn't open the whole network."},
w9:{t:"A forgotten device in your own lab",
 think:"A Raspberry Pi set up two years ago still runs SSH with its original password. You've forgotten it exists. An attacker wouldn't.",
 design:"Keep an inventory: every device on the network has an owner and a purpose.",
 protect:"Change default credentials on day one, use SSH keys, and scan your own network monthly against the inventory.",
 attack:"From a second lab VM, scan your own subnet, find the forgotten device, confirm the weak login, then fix it and scan again.",
 innovate:"Continuous asset discovery tools do this automatically and alert the moment a new device appears."},
w10:{t:"A school's online grade portal",
 think:"Students log in to see their grades, and the page URL includes the student's ID.",
 design:"Every request checks, on the server, that the logged-in user owns the record they're asking for.",
 protect:"Write tests that try to read another student's record and must fail. Log every access-denied event.",
 attack:"Changing the ID in the URL to see someone else's grades is broken access control, the most common serious web flaw.",
 innovate:"Policy-as-code engines centralize who-can-see-what rules, so they're written once instead of scattered across every route."},
w11:{t:"A ride-sharing dispatch service when two data centers lose contact",
 think:"Both data centers are still running and both still have riders and drivers, but they can't talk to each other.",
 design:"Decide in advance. If a driver could be assigned twice, choose consistency: the minority side refuses new assignments.",
 protect:"Health checks and automatic failover at the load balancer steer riders to the healthy side.",
 attack:"An attacker who can cause a partition, for example by flooding the link between sites, can force the system into its degraded mode. Plan for that mode.",
 innovate:"Globally consistent databases with tightly synchronized clocks make some of these trade-offs cheaper than they used to be."},
w12:{t:"A journalist protecting a confidential source",
 think:"Even if every message is encrypted, a record that the journalist's phone talked to the source's phone can expose the source.",
 design:"Use systems that hide who talks to whom, such as Tor-based drop systems, not just what is said.",
 protect:"Minimize stored metadata: disappearing messages, and no contact lists synced to the cloud.",
 attack:"Timing alone (“the source's phone was active right before the story ran”) can identify a source without breaking any encryption.",
 innovate:"Mixnets add cover traffic and delays to break timing correlation, trading speed for stronger privacy."},
w13:{t:"A small hosting provider under a flood attack",
 think:"Millions of junk packets per second hit one service's address, and the servers spend all their CPU just receiving them.",
 design:"Drop bad traffic as early as possible: upstream scrubbing for huge floods, and XDP on the servers for the rest.",
 protect:"Rate-limit per source with an eBPF program, and keep known-good clients flowing with an allowlist.",
 attack:"Attackers change patterns as filters adapt, so detection has to update automatically, not wait for someone to type a rule mid-incident.",
 innovate:"Programmable switches can now run the same filtering logic in hardware at full line rate."}
};

/* ---------- Builds: how each problem set feeds the next, and Ember ---------- */
function findWeek(id){for(var i=0;i<WEEKS.length;i++)if(WEEKS[i].id===id)return WEEKS[i];}
function addBuilds(wid,pid,txt){var w=findWeek(wid);w.psets.forEach(function(p){if(p.id===pid)p.builds=txt;});}

addBuilds("w2","2.1","Builds on 1.1: the lookup table from your switch, now matched by prefix.");
addBuilds("w3","3.1","Becomes Ember's first wire protocol. You'll compare it with QUIC in 13.2.");
addBuilds("w4","4.1","Reused in the capstone to steer users to the nearest Ember node.");
addBuilds("w5","5.1","This is Ember v0.1. Sections 6, 8, 10 and 11 all extend this server.");
addBuilds("w5","5.3","Ember v0.1 runs inside this container.");
addBuilds("w6","6.1","Stretch: add this key exchange to Ember's clients so the server only relays ciphertext.");
addBuilds("w7","7.3","The routed core for Ember Regions. 7.4 and 7.5 reuse it, and the final project's Ember in a box builds on it.");
addBuilds("w7","7.5","Builds on 2.2 and 7.3: your address formula becomes generated configs, and the canary check is your answer to 7.2's bad config push.");
addBuilds("w8","8.2","Apply this ruleset to every Ember node.");
addBuilds("w8","8.3","Point this at Ember's lab traffic. It's your first Ember alert.");
addBuilds("w9","9.2","Scan your Ember lab deployment from sections 5–8.");
addBuilds("w10","10.2","Make this Ember's account system: the notes become Ember's per-user settings.");
addBuilds("w11","11.1","Put three copies of your 5.1 Ember server behind it.");
addBuilds("w11","11.2","Use the elected leader to decide which Ember node owns each chat room.");
addBuilds("w12","12.1","Sketch how Ember's relays could use layered encryption to hide who talks to whom.");
addBuilds("w13","13.1","Attach it in front of your 11.1 load balancer and rate-limit Ember's port.");
addBuilds("w13","13.3","Write your RFC as the specification of the Ember protocol.");

