var WEEKS = [];

WEEKS.push({
id:"w0", num:0, layer:"Layer 1 · Physics", title:"Signals", h1:"Signals: a network is physics with rules",
blurb:"Bits as voltage, light and radio. Latency vs bandwidth, and why you can't buy your way under the speed of light.",
big:"Every network moves <b>bits</b> as changes in something physical: voltage, light, or radio waves. Two numbers describe any link. <b>Latency</b> is how long one bit takes to arrive, and it has a floor set by the speed of light. <b>Bandwidth</b> is how many bits fit through per second. You can buy more bandwidth. You can't buy less latency.",
strip:{type:"shell", cmd:"ping -c 3 1.1.1.1", note:"round-trip time = physics + queues + processing"},
ideas:[
["Encoding","Bits become signals by agreeing what a change means. Manchester encoding puts a transition in every bit, so the receiver never loses track of the clock.","A receiver samples the line at fixed intervals and decides what each sample means. If the signal stays flat through a long run of identical bits, the receiver’s clock drifts and it loses count. Manchester fixes this by splitting every bit into two halves with a transition in the middle. In IEEE 802.3, a 0 is high-then-low and a 1 is low-then-high, so the letter A (<code>01000001</code>) becomes 16 levels with an edge inside every bit. The price is bandwidth: 10 Mbps Ethernet signals at 20 million levels per second. You implement exactly this in 0.2, and the same idea, agreeing on what a change means, runs under every link Ember will use."],
["Latency has four parts","Propagation (distance), transmission (size ÷ bandwidth), queuing (waiting behind others) and processing (the device thinking). Learn to ask which one is slow.","Propagation is distance divided by signal speed, about 5 µs per km in fiber. Transmission is packet size divided by link rate: a 1,500-byte packet on a 1 Mbps link takes 12,000 bits ÷ 1,000,000 bits/s = 12 ms, but only 1.2 µs at 10 Gbps. Queuing is time spent behind other packets in a router’s buffer, and it swings wildly under load. Processing is the device reading headers and deciding, usually microseconds. A ping that should take 20 ms but takes 90 ms is almost never a propagation problem. In 0.1 you name which part explains each city’s gap, and the same habit tells you where Ember’s 200 ms budget goes."],
["Bandwidth-delay product","Bandwidth × round-trip time is how much data is “in the air” at once. Fast, long links hold a lot, which is why TCP needs big windows.","A sender can’t know a byte arrived until the acknowledgment comes back, one round trip later. Everything sent in that time is in flight and unconfirmed. Multiply the link rate by the RTT to see how much that is. A 1 Gbps path with an 80 ms RTT holds 10⁹ × 0.08 = 80 million bits, or 10 MB. A sender that stops after 64 KB and waits leaves that link idle more than 99% of the time. Geostationary satellite links, with RTTs near 600 ms, make the problem impossible to ignore. Week 3 sizes your sliding window from this number, and Ember’s transport performs well or badly because of it."],
["Errors are normal","Every medium corrupts bits sometimes. Checksums and CRCs detect it, and higher layers decide whether to resend.","Noise, interference, a damaged cable or a weak Wi-Fi signal can flip bits in transit. The fix is to send a short value computed from the data, so the receiver can recompute it and compare. Ethernet ends every frame with a 4-byte CRC-32 in the FCS field, which catches every single-bit error and every burst of 32 bits or fewer. A frame that fails the check is silently dropped. Ethernet never resends it. Recovery belongs to a higher layer, like TCP in week 3. In 0.2 you add a checksum to your Manchester decoder and test it against injected corruption, the same split of duties Ember relies on."]],
psets:[
{id:"0.1", title:"Speed of Light", lang:"Python",
problem:"Write a function that returns the theoretical minimum round-trip time for a one-way fiber distance. Then measure real pings to five cities and explain the gap.",
input:"<code>distance_km</code>: one-way path length in kilometers (float).", output:"Minimum round-trip time in milliseconds, rounded to 1 decimal.",
examples:[{i:"distance_km = 10000", o:"100.0", why:"2 × 10,000 km ÷ 200,000 km/s = 0.1 s = 100 ms."},{i:"distance_km = 640", o:"6.4", why:"Detroit to Chicago is a few hundred km by road, but fiber paths are longer than straight lines."}],
constraints:["0 < distance_km ≤ 40,000","Light in fiber travels at about 200,000 km/s (two-thirds of c)"],
starter:`def min_rtt_ms(distance_km: float) -> float:
    """Theoretical minimum round-trip time over fiber, in ms."""
    # TODO
    ...`,
hints:["Fiber's refractive index slows light to about two-thirds of its vacuum speed.","Round trip means the distance is traveled twice."],
accept:["Your function returns the example outputs exactly","A table of 5 cities: straight-line distance, theoretical RTT, measured RTT","One sentence per city explaining the gap using the four parts of latency"],
stretch:["Compute each city's “path inflation” (measured ÷ theoretical) and explain which cities are worst and why."]},
{id:"0.2", title:"Clockwork", lang:"Python",
problem:"Implement Manchester encoding and decoding. Each bit becomes two signal levels. Using the IEEE 802.3 convention, a 0 is high-then-low and a 1 is low-then-high. Bits are sent most significant bit first.",
input:"<code>encode(data: bytes)</code> and <code>decode(levels: list[int])</code>", output:"<code>encode</code> returns a list of 0/1 levels, two per bit. <code>decode</code> returns the original bytes, or raises <code>ValueError</code> on an invalid pair.",
examples:[{i:"encode(b'A')", o:"[1,0, 0,1, 1,0, 1,0, 1,0, 1,0, 1,0, 0,1]", why:"'A' is 0x41 = 01000001. Each 0 becomes 1,0 and each 1 becomes 0,1."},{i:"decode([1,1, 0,1])", o:"ValueError", why:"[1,1] has no mid-bit transition, so it can't be a valid bit."}],
constraints:["len(data) ≤ 100,000 bytes","Run in O(n)","len(levels) must be a multiple of 16 for a whole number of bytes"],
starter:`def encode(data: bytes) -> list[int]:
    ...

def decode(levels: list[int]) -> bytes:
    ...

if __name__ == "__main__":
    import os
    msg = os.urandom(1000)
    assert decode(encode(msg)) == msg
    print("round trip ok")`,
hints:["Loop over bytes, then over bit positions 7 down to 0 using (byte >> i) & 1.","For error detection, append one checksum byte (the sum of all bytes mod 256) before encoding and verify it after decoding."],
accept:["Round trip holds for 1,000 random byte strings","Invalid level pairs raise ValueError","With 1 random level flipped per 100, your checksum or pair check catches every corrupted message"],
stretch:["Replace the checksum with a CRC-32 you write yourself, and assert it matches zlib.crc32."]},
{id:"0.3", title:"Never Underestimate a Truck", lang:"Any",
problem:"You must move 500 TB from Detroit to Chicago (about 450 km). Compare a 10 Gbps link with a truck of drives averaging 75 km/h. Write a function that returns the hours for each and the truck's effective bandwidth in Gbps.",
input:"<code>size_tb, link_gbps, distance_km, speed_kmh</code>", output:"(link_hours, truck_hours, truck_gbps), each to 1 decimal.",
examples:[{i:"size_tb=100, link_gbps=1, distance_km=400, speed_kmh=80", o:"(222.2, 5.0, 44.4)", why:"100 TB = 8×10¹⁴ bits ÷ 10⁹ = 800,000 s. The truck takes 5 h = 18,000 s, and 8×10¹⁴ ÷ 18,000 = 44.4 Gbps."}],
constraints:["Use decimal units: 1 TB = 10¹² bytes","Ignore loading time for the base problem"],
accept:["Your function reproduces the example","You report all three numbers for the 500 TB case","One paragraph on what the truck is terrible at, using this week's vocabulary"],
stretch:["Add 6 hours of loading and unloading. At what data size does the link win?"]}],
check:[
{t:"num", q:"A fiber path is 10,000 km one way. What's the minimum possible round-trip time?", a:100, tol:1, unit:"ms", why:"2 × 10,000 km ÷ 200,000 km/s = 0.1 s."},
{t:"num", q:"How long does it take to put one 1,500-byte packet onto a 1 Mbps link (transmission delay)?", a:12, tol:0.5, unit:"ms", why:"1,500 × 8 = 12,000 bits ÷ 1,000,000 bits/s = 0.012 s."},
{t:"num", q:"A 1 Gbps link has an 80 ms round-trip time. How much data is in flight when it's full (the bandwidth-delay product)?", a:10, tol:0.2, unit:"MB", why:"10⁹ bits/s × 0.08 s = 8×10⁷ bits = 10 MB."},
{t:"choice", q:"Which part of latency can't be reduced by buying better equipment?", o:["Queuing delay","Transmission delay","Propagation delay","Processing delay"], a:2, why:"Propagation is distance ÷ the speed of light in the medium. Only moving the endpoints closer helps."},
{t:"explain", q:"In two or three sentences: why does Manchester encoding make it easy for the receiver to stay in sync with the sender's clock?", model:"Every bit has a transition in the middle, so the signal never stays flat for long, even in a long run of identical bits. The receiver uses those guaranteed transitions to re-time its own clock on every bit. The cost is twice the signaling rate for the same data rate."}],
reads:[["High Performance Browser Networking, ch. 1","https://hpbn.co/primer-on-latency-and-bandwidth/"],["Julia Evans' zines","https://jvns.ca/"]]
});

WEEKS.push({
id:"w1", num:1, layer:"Layer 2 · Data link", title:"Links & switching", h1:"Links: getting a frame across one hop",
blurb:"MAC addresses, how switches learn, VLANs, ARP and the loops that melt networks.",
big:"Layer 2 delivers a <b>frame</b> to a neighbor on the same link, using <b>MAC addresses</b> burned into each network card. A <b>switch</b> learns which MAC lives on which port by watching source addresses, then forwards only where needed. It works by trusting everyone on the wire, which is both why it's simple and why it can be abused.",
strip:{type:"wire", cells:[["Dst MAC","6 bytes",2],["Src MAC","6 bytes",2],["802.1Q tag","4 · optional",1.4],["EtherType","2 bytes",1.2],["Payload","46–1500 bytes (MTU)",5],["FCS","4 · CRC",1]], cap:"Ethernet II frame · EtherType 0x0800 = IPv4, 0x0806 = ARP, 0x86DD = IPv6"},
ideas:[
["MAC learning","The switch sees a frame from MAC X on port 3 and writes “X is on 3.” Unknown destination? It floods the frame out every other port. Entries age out so moved devices get relearned.","The switch keeps a table mapping MAC addresses to ports, often called the CAM or MAC table. Each arriving frame teaches it one fact: the source MAC lives on the port the frame came in on. Then it looks up the destination. A hit sends the frame out one port. A miss, or the broadcast address <code>ff:ff:ff:ff:ff:ff</code>, floods it everywhere else. Entries commonly expire after 300 seconds, so a monitor that moves from one hospital ward’s wall jack to another gets relearned. The table is finite, which is why a lab MAC-flooding attack can force a switch to flood everything, and why port security caps MACs per port. You build this switch in 1.1, aging included."],
["ARP","Hosts know IP addresses but frames need MACs. ARP broadcasts “who has 10.0.0.1?” and believes whoever answers. There is no authentication.","When a host wants to reach <code>10.0.0.1</code> on its own subnet, it broadcasts an ARP request (EtherType <code>0x0806</code>) asking who owns that address. The owner replies by unicast, and the asker caches the answer for seconds to minutes, depending on the OS. Run <code>ip neigh</code> to see the cache. Nothing in a reply proves it’s genuine, and many hosts accept replies they never asked for. That’s how ARP spoofing in a lab puts an attacker between a host and its gateway. The fix lives in the switch: dynamic ARP inspection checks replies against DHCP snooping records. You watch the exchange in 1.2 and detect the lie in 1.3."],
["VLANs","One physical switch, many logical ones. An 802.1Q tag marks which VLAN a frame belongs to. Trunk ports carry many VLANs, access ports carry one.","A VLAN is a separate broadcast domain on shared hardware. On a trunk link, the switch inserts a 4-byte 802.1Q tag between the source MAC and the EtherType. Twelve bits of that tag carry the VLAN ID, giving 4,094 usable VLANs, since 0 and 4095 are reserved. Access ports strip the tag, so end devices never see it. A frame on VLAN 20 can’t reach VLAN 30 without passing through a router. A hospital might put infusion pumps, staff laptops and guest Wi-Fi on separate VLANs, so a compromised guest phone can’t even ARP for a pump. Ember’s week 2 address plan gives each role its own subnet, usually backed by its own VLAN."],
["Loops and STP","Ethernet has no time-to-live, so a loop lets a broadcast circle forever and melts the network. Spanning Tree blocks redundant links until they're needed.","Switches flood broadcasts out every port, and nothing in an Ethernet header counts hops. With two paths between switches, one broadcast comes back around, gets flooded again, and multiplies on every lap until links and switch CPUs saturate. That’s a broadcast storm. Spanning Tree Protocol (802.1D) elects a root bridge, computes one loop-free tree, and puts redundant ports into a blocking state. If an active link fails, a blocked one takes over. Classic STP takes 30 to 50 seconds to converge, while Rapid STP (802.1w) usually takes a few seconds or less. One patch cable joining two wall jacks can start a storm. The 1.1 stretch lets you count the copies yourself."]],
psets:[
{id:"1.1", title:"Switchboard", lang:"Python",
problem:"Implement a learning switch. <code>handle(frame, in_port, now)</code> returns the list of ports the frame should leave on. Learn the source MAC's port, forward to a known destination, flood unknown or broadcast destinations to every port except the one it came in on, and forget entries older than <code>aging_s</code> seconds.",
input:"<code>frame</code>: dict with <code>src</code> and <code>dst</code> MACs. <code>in_port</code>: int 1..N. <code>now</code>: seconds (float).", output:"A sorted list of output ports. Empty if the destination is on the same port it came in on.",
examples:[
{i:"sw = LearningSwitch(4, aging_s=300)\nsw.handle({'src':'A','dst':'D'}, 1, now=0)", o:"[2, 3, 4]", why:"D is unknown, so flood everywhere except port 1. The switch learns A is on port 1."},
{i:"sw.handle({'src':'D','dst':'A'}, 4, now=1)", o:"[1]", why:"A was learned on port 1. The switch also learns D is on port 4."},
{i:"sw.handle({'src':'A','dst':'D'}, 1, now=2)", o:"[4]", why:"Both are known now, so no flooding."},
{i:"sw.handle({'src':'A','dst':'D'}, 1, now=400)", o:"[2, 3, 4]", why:"D was last seen at t=1, more than 300 s ago, so its entry has aged out."}],
constraints:["1 ≤ N ≤ 48 ports","Broadcast MAC ff:ff:ff:ff:ff:ff always floods","O(1) average time per frame"],
starter:`class LearningSwitch:
    BROADCAST = "ff:ff:ff:ff:ff:ff"

    def __init__(self, num_ports: int, aging_s: float):
        self.ports = list(range(1, num_ports + 1))
        self.aging_s = aging_s
        self.table = {}  # mac -> (port, last_seen)

    def handle(self, frame: dict, in_port: int, now: float) -> list[int]:
        # 1. learn  2. look up (respect aging)  3. forward or flood
        ...`,
hints:["Learn first, then look up. A frame can teach you about its own source before you decide where it goes.","An entry is valid only if now − last_seen ≤ aging_s."],
accept:["All four examples pass in order","A frame whose destination is on its own input port returns []","You can explain in one sentence why the first frame to a new host is always flooded"],
stretch:["Add VLANs. Each port has a VLAN ID and flooding stays inside the frame's VLAN.","Connect two switches in a loop, send one broadcast, and count how many copies exist after 10 steps."]},
{id:"1.2", title:"Who Has?", lang:"Wireshark",
problem:"Watch ARP happen on your own network and explain every field.",
task:["Clear your ARP cache: <code>sudo ip neigh flush all</code> (Linux) or <code>arp -d *</code> (Windows, as admin).","Start a Wireshark capture with the display filter <code>arp</code>.","Ping your default gateway once.","Run <code>ip neigh</code> and compare with before."],
accept:["A screenshot of the request and the reply with each field labeled","You explain why the request goes to ff:ff:ff:ff:ff:ff and the reply is unicast","You explain what would happen if a second device also answered"]},
{id:"1.3", title:"Liar's Table", lang:"Python + scapy",
problem:"Write a detector that flags when an IP address suddenly claims a different MAC address, the signature of ARP spoofing. First solve it on plain data, then run it on real captures.",
input:"<code>replies</code>: list of (time, ip, mac) tuples in time order.", output:"List of alerts as (time, ip, old_mac, new_mac).",
examples:[{i:"[(0,'10.0.0.1','aa:aa'), (5,'10.0.0.7','bb:bb'), (9,'10.0.0.1','cc:cc'), (12,'10.0.0.1','cc:cc')]", o:"[(9, '10.0.0.1', 'aa:aa', 'cc:cc')]", why:"The gateway's MAC changed at t=9. The repeat at t=12 isn't new, so no second alert."}],
constraints:["Up to 10⁶ replies","One pass, O(n)"],
starter:`def detect(replies):
    seen = {}      # ip -> mac
    alerts = []
    for t, ip, mac in replies:
        ...
    return alerts

# Real data: from scapy.all import rdpcap, ARP
# for p in rdpcap("arp.pcap"):
#     if ARP in p and p[ARP].op == 2:   # is-at (reply)
#         ...`,
hints:["Run it on ARP captures from the Wireshark SampleCaptures page.","Legitimate changes happen too, like a replaced network card or a failover pair. Think about how to tell them apart."],
accept:["The example returns exactly one alert","It runs on a real pcap and prints readable alerts","One paragraph: which switch feature makes this attack fail at the port, and why your detector still adds value"]}],
check:[
{t:"choice", q:"A switch receives a frame for a destination MAC that isn't in its table. What does it do?", o:["Drops the frame","Sends it back out the port it arrived on","Floods it out every port except the one it arrived on","Sends an ARP request"], a:2, why:"Flooding guarantees delivery, and the reply teaches the switch where the destination lives."},
{t:"text", q:"What EtherType value identifies an ARP frame? (hex)", acc:["0x0806","0806","0x806","806"], why:"0x0806 is ARP and 0x0800 is IPv4."},
{t:"num", q:"What's the maximum payload of a standard (non-jumbo) Ethernet frame?", a:1500, tol:0, unit:"bytes", why:"1500 bytes is the classic Ethernet MTU."},
{t:"choice", q:"Why does ARP spoofing work?", o:["ARP is encrypted with a weak key","Hosts accept ARP replies without any authentication","Switches forward ARP to the internet","MAC addresses are random"], a:1, why:"ARP has no way to prove a reply is genuine, so the most recent answer wins."},
{t:"explain", q:"Why is a loop catastrophic at layer 2 but survivable at layer 3?", model:"IP packets carry a TTL that drops at each router, so a looping packet dies after a bounded number of hops. Ethernet frames have no TTL, so a broadcast in a loop is copied forever and multiplies until the links and switches are saturated. That's why Spanning Tree exists."}],
reads:[["Wireshark sample captures","https://wiki.wireshark.org/SampleCaptures"],["Kurose & Ross, Computer Networking","https://gaia.cs.umass.edu/kurose_ross/"]]
});

WEEKS.push({
id:"w2", num:2, layer:"Layer 3 · Network", title:"Addressing & routing", h1:"Routing: getting a packet across the world",
blurb:"IP prefixes, longest-prefix match, subnet planning, BGP, and why NAT happened.",
big:"Layer 2 only reaches neighbors. <b>IP</b> gives every host a hierarchical address, so routers can forward without knowing every host, only every <b>prefix</b>. Each router asks one question per packet: which entry in my table matches this destination most specifically? The internet is millions of routers asking that question independently.",
strip:{type:"wire", cells:[["Ver","4 bits",.7],["IHL","4 bits",.7],["DSCP/ECN","8 bits",1],["Total len","16 bits",1.4],["ID + frag","32 bits",1.4],["TTL","8 bits",.8],["Protocol","8 bits",1],["Checksum","16 bits",1.2],["Src IP","32 bits",1.8],["Dst IP","32 bits",1.8]], cap:"IPv4 header · Protocol 6 = TCP, 17 = UDP, 1 = ICMP · TTL drops by 1 at each router"},
ideas:[
["Prefixes and subnets","<code>10.40.12.0/24</code> means the first 24 bits are the network. A smaller number after the slash means a bigger network. Subnetting is choosing where to draw that line.","An IPv4 address is 32 bits. The prefix length says how many leading bits name the network, and the rest number hosts. A /24 leaves 8 host bits: 2⁸ = 256 addresses, minus the network and broadcast addresses, for 254 usable hosts. A /27 leaves 5 bits, so 32 addresses and 30 hosts. To find a network address, keep the prefix bits and zero the rest. For <code>10.40.77.130/22</code>, a /22 groups the third octet in blocks of 4, and 77 falls in the 76–79 block, so the network is <code>10.40.76.0</code>. In 2.2 you carve Ember’s <code>10.40.0.0/16</code> into one /24 per site, then slice each /24 by role."],
["Longest prefix match","A /32 beats a /24, which beats a /0. The default route (<code>0.0.0.0/0</code>) is the answer of last resort.","A routing table often holds several entries that contain the same destination. The router picks the one with the most matching leading bits, because that’s the most specific information it has. With <code>10.0.0.0/8</code>, <code>10.40.0.0/16</code> and <code>10.40.12.0/24</code> installed, a packet to <code>10.40.12.7</code> takes the /24, and one to <code>10.40.99.1</code> falls back to the /16. A plain list has to check every entry. A binary trie walks at most 32 bits and remembers the last match it passed. Backbone routers do this in hardware for roughly a million IPv4 prefixes at line rate. You build both versions in 2.1, reusing the table idea from your 1.1 switch."],
["Routing protocols","Inside an organization, OSPF lets routers share a map and compute shortest paths. Between organizations, BGP shares policy rather than shortest paths, and runs on trust.","OSPF is a link-state protocol. Every router floods a description of its links to the others, so each holds the same map and runs Dijkstra’s shortest-path algorithm on it. BGP connects autonomous systems, each identified by a number (Cloudflare is AS13335). A BGP router announces which prefixes it can reach and the AS path to them, and every network applies its own policy about what to accept and prefer. By default, nobody checks those claims. In 2008 a false announcement for YouTube’s prefix took it offline worldwide for about two hours. RPKI now lets routers reject announcements from origins that aren’t authorized. Ember Regions in week 7 builds its WAN on these ideas."],
["TTL and ICMP","TTL kills a packet after N hops so loops can't last forever. The router that kills it sends back an ICMP message, which traceroute uses on purpose.","Every IPv4 header has an 8-bit TTL field, typically starting at 64 on Linux and 128 on Windows. Each router decrements it, and a router that brings it to zero drops the packet and returns an ICMP Time Exceeded message (type 11) to the sender. Traceroute sends probes with TTL 1, then 2, then 3, so each router along the path reveals itself in turn. A hop showing <code>* * *</code> usually means that router doesn’t answer ICMP or rate-limits it, not that the path is broken. You build this tool in 2.3 with scapy, and it becomes your first move when an Ember site goes unreachable."],
["NAT","IPv4 ran out of addresses, so NAT hides many private hosts behind one public address by rewriting ports. It broke end-to-end connectivity, a theme that keeps coming back.","A NAT router keeps a translation table. When <code>192.168.1.20:51000</code> opens a connection, the router rewrites the source to its public address and a free port, say <code>203.0.113.5:40001</code>, and remembers the mapping so replies can be rewritten back. One public IPv4 address can front thousands of private hosts this way. The catch is that nobody outside can start a connection inward, because no mapping exists until someone inside sends first. That’s why game consoles, video calls and peer-to-peer apps need tricks like hole punching. It’s also why Ember clients connect out to Ember’s servers instead of directly to each other."],
["IPv6","128-bit addresses end the shortage: no NAT needed, no broadcast, new neighbor discovery. Same ideas, new details.","An IPv6 address is 128 bits, written as eight groups of four hex digits, like <code>2001:db8::1</code>, where <code>::</code> stands for one run of zero groups. An organization often gets a /48 and each LAN a /64, which leaves 2⁶⁴ addresses per subnet, enough for hosts to pick their own addresses (SLAAC). Neighbor Discovery over ICMPv6 replaces ARP, and multicast replaces broadcast. The base header is a fixed 40 bytes, and routers no longer fragment packets. Prefixes and longest-prefix match work exactly as in IPv4. So does the trust problem: Neighbor Discovery believes its neighbors just like ARP, so RA Guard plays the role that ARP inspection plays in IPv4."]],
psets:[
{id:"2.1", title:"Longest Prefix", lang:"Python",
problem:"Implement a routing table that supports adding prefixes and looking up the next hop for an address using longest prefix match. Build a linear version first, then a binary trie, and benchmark them.",
input:"<code>add(prefix: str, next_hop: str)</code>, then <code>lookup(ip: str)</code>.", output:"The next hop of the most specific matching prefix, or <code>None</code>.",
examples:[{i:"t = RoutingTable()\nt.add('0.0.0.0/0', 'isp')\nt.add('10.0.0.0/8', 'core')\nt.add('10.40.0.0/16', 'division')\nt.add('10.40.12.0/24', 'site12')\nt.lookup('10.40.12.7')", o:"'site12'", why:"Four prefixes match and the /24 is longest."},{i:"t.lookup('10.40.99.1')", o:"'division'", why:"The /24 doesn't match 10.40.99.x, so the /16 wins."},{i:"t.lookup('8.8.8.8')", o:"'isp'", why:"Only the default route matches."}],
constraints:["Up to 10⁶ prefixes","Trie lookup: at most 32 steps per address","Don't use the ipaddress module's network lookups in the trie version (converting strings is fine)"],
starter:`import ipaddress

def to_bits(ip: str) -> int:
    return int(ipaddress.IPv4Address(ip))

class RoutingTable:
    def __init__(self):
        self.root = {}   # trie node: {'0': node, '1': node, 'hop': next_hop}

    def add(self, prefix: str, next_hop: str) -> None:
        ...

    def lookup(self, ip: str):
        ...`,
hints:["Walk the trie bit by bit from the most significant bit. Remember the last node that had a next hop, and return it when you can't go further.","For the benchmark, time 100,000 random lookups with both versions."],
accept:["All three examples pass","The linear and trie versions agree on 100,000 random lookups","You report both timings and explain the speedup in big-O terms"],
stretch:["Load a real BGP table snapshot from RouteViews. Report the number of prefixes and your lookup speed."]},
{id:"2.2", title:"Carve", lang:"Spreadsheet or Markdown",
problem:"Write the address plan for Ember's private network. Ember will eventually run in up to 200 sites (data centers and edge locations), all inside <code>10.40.0.0/16</code>. Every site needs these networks:",
task:["Ember servers: up to 40 hosts","Operator workstations: up to 20","Sensors / IoT: up to 60 devices","Network management: up to 15 devices","Visitor Wi-Fi: up to 200 clients"],
constraints:["Every site must summarize to exactly one route at the core","Site N's subnets must be derivable from N alone","Must fit 200 sites inside the /16","Warning: naively, the numbers don't fit. Decide what doesn't need to live in 10.40.0.0/16."],
hints:["A /16 holds 256 /24s. If each site gets a /24, there's room for 200 sites and some to spare.","Visitor Wi-Fi only needs the internet, not Ember. Where else could those addresses come from?"],
accept:["A table of every network with its prefix size and the reason for that size","A formula: site N → which /24, and which slice of it holds Ember's servers","A paragraph on visitor Wi-Fi, naming the security benefit of your choice"]},
{id:"2.3", title:"Hops", lang:"Python + scapy (run as root)",
problem:"Write your own traceroute. Send probes with TTL 1, 2, 3 and so on, and record which router answers each with ICMP Time Exceeded, until the destination answers or you reach the hop limit.",
input:"<code>traceroute(dst: str, max_hops: int = 30)</code>", output:"A list of (ttl, router_ip or None, rtt_ms or None).",
examples:[{i:"traceroute('1.1.1.1', max_hops=4)", o:"[(1, '192.168.1.1', 1.8), (2, '100.64.0.1', 9.4), (3, None, None), (4, '1.1.1.1', 14.2)]", why:"Your addresses will differ. None means no reply within the timeout."}],
constraints:["3 probes per TTL, 2-second timeout each","Stop when the destination itself replies","Only trace public hosts or your own lab"],
starter:`from scapy.all import IP, ICMP, sr1
import time

def traceroute(dst, max_hops=30):
    hops = []
    for ttl in range(1, max_hops + 1):
        start = time.time()
        reply = sr1(IP(dst=dst, ttl=ttl) / ICMP(), timeout=2, verbose=0)
        ...
    return hops`,
hints:["ICMP type 11 is Time Exceeded. Type 0 is Echo Reply, meaning you reached the destination."],
accept:["Your output matches the system traceroute's hop list for three distant sites","You explain at least one hop that shows * * *"]}],
check:[
{t:"num", q:"How many usable host addresses are in a /26?", a:62, tol:0, unit:"hosts", why:"2⁶ = 64 addresses, minus the network and broadcast addresses."},
{t:"text", q:"What's the network address of 172.16.45.200/20?", acc:["172.16.32.0"], why:"A /20 groups the third octet in blocks of 16. 45 falls in the 32–47 block."},
{t:"choice", q:"A router has 10.40.0.0/16, 10.40.12.0/24, 10.40.12.128/25 and 0.0.0.0/0. Which route does 10.40.12.200 use?", o:["0.0.0.0/0","10.40.0.0/16","10.40.12.0/24","10.40.12.128/25"], a:3, why:"200 ≥ 128, so the /25 matches, and it's the longest."},
{t:"num", q:"If every site gets its own /24, how many sites fit in 10.40.0.0/16?", a:256, tol:0, unit:"sites", why:"2^(24−16) = 256."},
{t:"explain", q:"Why does it matter that each site summarizes to a single route?", model:"The core only needs one route per site instead of one per subnet, so tables stay small and lookups fast. A change inside a site doesn't ripple out to every router. Troubleshooting gets easier too, because the address tells you which site you're looking at."}],
reads:[["RouteViews","https://www.routeviews.org/"],["RPKI documentation","https://rpki.readthedocs.io/"]]
});

WEEKS.push({
id:"w3", num:3, layer:"Layer 4 · Transport", title:"Transport", h1:"Transport: turning a lossy network into a reliable pipe",
blurb:"TCP's handshake, sliding windows and congestion control. UDP's speed and its trade-offs.",
big:"IP drops, reorders and duplicates packets and makes no promises. <b>TCP</b> builds a reliable, ordered byte stream on top by numbering every byte, acknowledging what arrives and resending what doesn't. It also slows down when the network is congested, which is what keeps the internet from collapsing. <b>UDP</b> skips all of that for speed.",
strip:{type:"wire", cells:[["Src port","16 bits",1.2],["Dst port","16 bits",1.2],["Sequence #","32 bits",2],["Ack #","32 bits",2],["Flags","SYN ACK FIN RST",1.6],["Window","16 bits",1.2],["Checksum","16 bits",1.2]], cap:"TCP header (simplified) · the window field is the receiver saying “this much, no more”"},
ideas:[
["Ports","IP finds the host, a port finds the program. A connection is identified by five values: protocol, source IP and port, destination IP and port.","A port is a 16-bit number, so 0 to 65,535. Servers listen on well-known ports (DNS on 53, HTTPS on 443), and clients get a temporary ephemeral port from the OS, by default between 32768 and 60999 on Linux. The kernel uses the five-tuple to hand each arriving segment to the right socket. Two browser tabs talking to the same server on 443 differ only in their source ports, and that’s enough to keep them apart. Firewalls and NAT tables key on the same five values. Your 3.1 transport runs over UDP, so the proxy, sender and receiver share one loopback address and are told apart by port alone."],
["The handshake","SYN, SYN-ACK, ACK. Both sides pick a starting sequence number and confirm the other's. It costs one round trip before any data moves.","The client sends a SYN with a random initial sequence number, say 4000. The server replies SYN-ACK with its own number, say 9000, and ack 4001, because a SYN consumes one sequence number. The client answers ACK 9001, and data can flow. Random starting numbers make it hard for an off-path attacker to inject fake segments. On a 100 ms path the handshake alone costs 100 ms before the first byte of a request, and TLS 1.3 adds another round trip on top. That’s a real slice of Ember’s 200 ms budget, and it’s why QUIC, which you compare with your own protocol in week 13, combines the two."],
["Sliding window","Waiting for each ACK wastes the pipe. Instead, keep a window of unacknowledged data in flight, sized to the bandwidth-delay product from week 0.","With stop-and-wait, the sender transmits one packet and idles until its ACK returns. On a 40 ms path with 1,200-byte packets, that caps you at 1,200 ÷ 0.04 = 30,000 bytes per second, however fast the link is. A sliding window lets N packets be unacknowledged at once, and each ACK slides the window forward to free room for another. To fill a 1 Gbps link at 30 ms, the window must hold 10⁹ × 0.03 = 30 million bits, or 3.75 MB. TCP’s 16-bit window field tops out at 64 KB, so a window-scale option multiplies it for fast, long paths. In 3.1 you measure the jump from window 1 to 64 yourself."],
["Congestion control","Speed up a little each round trip and cut sharply on loss (AIMD). Flows doing this converge to a fair share. Newer algorithms like BBR measure the path instead of guessing.","TCP keeps a congestion window alongside the receiver’s window and sends no more than the smaller of the two. In congestion avoidance it adds about one packet per round trip, and on loss it halves the window. Picture two flows at 10 and 60 sharing a link of 100. Both add 1 per round until the total passes 100, then both halve. Adding the same amount leaves the gap between them unchanged, but every halving cuts it in half, so they converge on a fair share. BBR, developed at Google, instead estimates bottleneck bandwidth and minimum RTT and paces to match. You simulate AIMD in 3.2 and score fairness with Jain’s index."]],
psets:[
{id:"3.1", title:"Reliable", lang:"Python",
problem:"Build reliable file transfer over UDP. A provided proxy randomly drops and delays packets. Your sender and receiver must still deliver the file byte-for-byte. Implement stop-and-wait first, then a sliding window, and compare their throughput.",
input:"<code>python sender.py FILE HOST PORT --window N</code> and <code>python receiver.py PORT OUTFILE</code>", output:"OUTFILE identical to FILE. The sender prints throughput in KB/s.",
examples:[{i:"proxy loss=0.2 · window=1 · 1 MB file", o:"done: 1048576 bytes, 38 KB/s", why:"Stop-and-wait: one packet in flight, so each loss costs a full timeout."},{i:"proxy loss=0.2 · window=16 · 1 MB file", o:"done: 1048576 bytes, 410 KB/s", why:"Many packets in flight keep the pipe busy. Your numbers will differ."}],
constraints:["Payload ≤ 1,200 bytes per packet","Loss up to 20%, delays up to 50 ms, reordering allowed","Header: sequence number, ack number, flags (DATA, ACK, FIN)","No TCP sockets anywhere"],
starter:`# lossy_proxy.py: sits between sender and receiver on localhost
import random, socket, threading

def run(listen_port, dst_port, loss=0.2, max_delay=0.05):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.bind(("127.0.0.1", listen_port))
    dst = ("127.0.0.1", dst_port)
    client = None
    while True:
        data, addr = s.recvfrom(65535)
        target = dst if addr != dst else client
        if addr != dst:
            client = addr
        if target is None or random.random() < loss:
            continue  # dropped
        threading.Timer(random.uniform(0, max_delay), s.sendto, (data, target)).start()

# header suggestion: struct.pack("!IIB", seq, ack, flags)`,
hints:["Number packets, not bytes, to keep it simple. The receiver acks the highest in-order packet it has (cumulative ACK).","On timeout, go-back-N resends everything after the last acknowledged packet. It's simple and correct, and you can make it smarter later."],
accept:["sha256sum of input and output match at 0%, 5% and 20% loss","A table of throughput for window 1, 4, 16 and 64 at each loss rate","You explain the shape of the curve using the bandwidth-delay product"],
stretch:["Add selective acknowledgments so only missing packets are resent.","Replace the fixed timeout with an adaptive one based on measured RTT (Jacobson/Karels)."]},
{id:"3.2", title:"Fair Share", lang:"Python + matplotlib",
problem:"Simulate AIMD congestion control and show that flows converge to a fair share. Each round: if the total rate exceeds capacity, every flow halves its rate (it saw loss). Otherwise every flow adds 1.",
input:"<code>simulate(rates: list[float], capacity: float, rounds: int)</code>", output:"History: a list of rate lists, one per round.",
examples:[{i:"simulate([10, 60], 100, 3)", o:"[[11, 61], [12, 62], [13, 63]]", why:"Total stays under 100, so both add 1 each round."},{i:"simulate([45, 60], 100, 1)", o:"[[22.5, 30.0]]", why:"45 + 60 = 105 > 100, so both halve."}],
constraints:["Plot both flows over 300 rounds","Report Jain's fairness index: (Σx)² ÷ (n · Σx²)"],
accept:["Both examples pass","A plot where two very unequal starting flows converge","Jain's index ≥ 0.99, averaged over the last 50 rounds","Make one flow greedy (it never halves) and explain what happens to the other"]},
{id:"3.3", title:"Handshake", lang:"Wireshark",
problem:"Capture one complete TCP connection and annotate every packet.",
task:["Start a capture filtered to <code>tcp port 80</code>.","Run <code>curl http://example.com</code>.","Label the handshake, request, response, ACKs and teardown (FIN or RST)."],
accept:["Every packet is labeled with its role","You explain each jump in the relative sequence and ack numbers","You can predict the next sequence number before clicking the next packet"]}],
check:[
{t:"choice", q:"Which flags are set in the second packet of a TCP handshake?", o:["SYN","ACK","SYN + ACK","FIN + ACK"], a:2, why:"The server acknowledges the client's SYN and sends its own SYN in the same packet."},
{t:"num", q:"A client's SYN has seq = 1000. What ack number does the server send back?", a:1001, tol:0, unit:"", why:"A SYN consumes one sequence number, so the server expects 1001 next."},
{t:"num", q:"To fill a 100 Mbps link with a 40 ms RTT, how big must the window be? (1 KB = 1,000 bytes)", a:500, tol:5, unit:"KB", why:"100×10⁶ × 0.04 = 4×10⁶ bits = 500,000 bytes."},
{t:"choice", q:"In AIMD, what does a flow do when it detects loss?", o:["Adds 1 to its rate","Stops for one second","Cuts its rate by half","Doubles its rate"], a:2, why:"Additive increase, multiplicative decrease."},
{t:"explain", q:"Why do voice calls usually use UDP instead of TCP?", model:"A late voice packet is useless, because the conversation has moved on. TCP would hold up everything behind a lost packet while it retransmits (head-of-line blocking), adding delay and jitter. With UDP, the app can conceal a small gap and keep going."}],
reads:[["RFC 9293 · TCP","https://www.rfc-editor.org/rfc/rfc9293"],["HPBN ch. 2 · TCP","https://hpbn.co/building-blocks-of-tcp/"]]
});

WEEKS.push({
id:"w4", num:4, layer:"Layer 7 · Application", title:"Names & the web", h1:"Names and the web: what happens when you type a URL",
blurb:"DNS as a distributed database, HTTP as plain text, and what a CDN actually does.",
big:"People use names, networks use numbers. <b>DNS</b> is a global distributed database that turns one into the other by asking a chain of servers, each knowing only its own piece of the name. <b>HTTP</b> is a plain-text conversation of requests and responses riding on top. Almost everything else in a browser exists to make those two steps faster or safer.",
strip:{type:"wire", cells:[["ID","16 bits",1.2],["Flags","QR opcode AA TC RD RA rcode",2.2],["QDCOUNT","questions",1],["ANCOUNT","answers",1],["NSCOUNT","authority",1],["ARCOUNT","additional",1],["Question","name · type · class",2]], cap:"DNS message header (RFC 1035) · usually UDP port 53"},
ideas:[
["The resolution chain","Root servers know who runs <code>.com</code>. The <code>.com</code> servers know who runs <code>example.com</code>. That server knows the address. Caching at every step keeps it fast.","Your device asks a recursive resolver, run by your ISP or a service like <code>1.1.1.1</code>, to do the work. With an empty cache, the resolver asks a root server, which refers it to the <code>.com</code> servers, which refer it to <code>example.com</code>’s authoritative servers, which return the A record. There are only 13 root server names, but anycast spreads them across well over a thousand machines worldwide. Every answer carries a TTL, and the resolver caches referrals too, so the next <code>.com</code> lookup skips the root entirely. Most queries never leave the cache. You build this exact walk in 4.1, and it’s how <code>ember.lab</code> gets resolved."],
["HTTP is text","A method, a path, headers, a blank line, then a body. HTTP/2 and HTTP/3 change the packaging for speed, but the meaning stays the same.","An HTTP/1.1 request is lines of text ending in CRLF: a request line like <code>GET /index.html HTTP/1.1</code>, then headers such as <code>Host: example.com</code>, then an empty line, then an optional body. The response mirrors it: a status line such as <code>HTTP/1.1 200 OK</code>, headers, an empty line, and the body. Status codes group by first digit: 2xx success, 3xx redirect, 4xx client error, 5xx server error. HTTP/2 packs the same messages into binary frames over one TCP connection, and HTTP/3 carries them over QUIC on UDP. You type a request by hand in 4.2, and Ember’s clients speak this same format to <code>ember.lab</code>."],
["TLS in one breath","Before HTTP talks, the client and server agree on keys, and the server proves its identity with a certificate. Week 6 opens this box.","In TLS 1.3, the client’s first message carries a key share for a Diffie-Hellman exchange and the cipher suites it supports. The server answers with its own key share, its certificate chain, and a signature over the handshake proving it holds the certificate’s private key. Both sides derive the same session keys, and encrypted HTTP can start after one round trip. The browser checks that the certificate names the site and chains to a root it already trusts. Run <code>openssl s_client -connect example.com:443</code> in 4.2 and you can see each of these pieces. Week 6 builds them from scratch, and then Ember’s HTTP gets the same protection."],
["CDNs","Put copies of content close to users and latency drops. DNS often decides which copy you get.","A CDN runs caching servers in hundreds of cities. When you look up a CDN-hosted name, the CDN’s authoritative DNS server often answers with the address of a node near your resolver. Other CDNs use anycast, announcing the same IP from every site and letting BGP carry you to the closest one. Either way, content that would cross the Pacific at around 150 ms round trip might come from a server 10 ms away. During a breaking-news spike, the origin sees only a small fraction of requests because the edges serve cached copies. In the capstone your 4.1 resolver plays this role, steering users to the nearest Ember node."]],
psets:[
{id:"4.1", title:"Resolver", lang:"Python (socket + struct only)",
problem:"Write an iterative DNS resolver from scratch. Start at a root server, follow referrals down to the authoritative server, and return the IPv4 address. Print each step so you can watch the chain.",
input:"<code>resolve(name: str) -> str</code>", output:"An IPv4 address string. Print one line per server asked.",
examples:[{i:"resolve('www.example.com')", o:"198.41.0.4 (root) → referral to com\n192.5.6.30 (com) → referral to example.com\n... (example.com NS) → A 93.184.215.14\n'93.184.215.14'", why:"Real addresses will differ. What matters is the shape: root, then TLD, then authoritative."}],
constraints:["No dnspython or system resolver (except as a cross-check)","Parse name compression: a length byte whose top two bits are 11 is a pointer","Handle CNAME answers by restarting with the new name","If a referral has no glue A record, resolve the NS name first"],
starter:`import random, socket, struct

ROOT = "198.41.0.4"   # a.root-servers.net

def build_query(name: str, qtype: int = 1) -> bytes:
    header = struct.pack("!HHHHHH", random.randint(0, 65535), 0x0000, 1, 0, 0, 0)  # RD=0: we iterate
    qname = b"".join(bytes([len(p)]) + p.encode() for p in name.split(".")) + b"\\x00"
    return header + qname + struct.pack("!HH", qtype, 1)

def read_name(msg: bytes, offset: int) -> tuple[str, int]:
    # TODO: follow compression pointers; return (name, offset after the name)
    ...

def resolve(name: str) -> str:
    ...`,
hints:["Parse in order: header, questions, then answer, authority and additional records. Each record is name, type, class, TTL, length, data.","Record types: A = 1, NS = 2, CNAME = 5, AAAA = 28."],
accept:["resolve('www.wikipedia.org') prints the full referral path","The final address matches dig +short","It survives a name with a CNAME chain"],
stretch:["Add a cache that respects TTLs, and show the second lookup skips the root."]},
{id:"4.2", title:"HTTP by Hand", lang:"netcat + openssl",
problem:"Speak HTTP yourself, no browser.",
task:["<code>nc example.com 80</code>, then type <code>GET / HTTP/1.1</code>, <code>Host: example.com</code>, and a blank line.","Repeat over TLS: <code>openssl s_client -connect example.com:443 -quiet</code>","Try leaving out the Host header and note what happens."],
accept:["You explain every response header you received","You explain why Host is mandatory in HTTP/1.1"]},
{id:"4.3", title:"Every Layer of a Click", lang:"Writing",
problem:"Write the complete story of loading a web page, from keypress to pixels, one paragraph per step.",
task:["DNS lookup","ARP for the gateway","Routing across the internet","TCP handshake","TLS handshake","HTTP request and response","Rendering"],
accept:["Each paragraph names the week where its concept appears","You could give it as a 10-minute talk with no notes"]}],
check:[
{t:"choice", q:"With an empty cache, which server does an iterative resolver ask first?", o:["The .com TLD server","A root server","The authoritative server","Your ISP's router"], a:1, why:"Only the root knows where the top-level domains live."},
{t:"num", q:"What port does DNS normally use?", a:53, tol:0, unit:"", why:"UDP 53, falling back to TCP 53 for large answers."},
{t:"text", q:"Which DNS record type holds an IPv6 address?", acc:["aaaa","quad a","quad-a"], why:"A is IPv4 and AAAA is IPv6 (four times as long)."},
{t:"choice", q:"Why is the Host header mandatory in HTTP/1.1?", o:["To encrypt the request","Many websites can share one IP address","It replaces DNS","Routers need it to forward packets"], a:1, why:"Virtual hosting: the server needs to know which site you meant."},
{t:"explain", q:"What do you gain and lose by setting a 30-second DNS TTL instead of 1 day?", model:"With a short TTL, changes such as failing over to a backup site reach clients within seconds. The cost is far more queries, adding load on your name servers and a little latency for users who miss the cache. A long TTL is cheap and fast but leaves old answers in caches for up to a day."}],
reads:[["RFC 1035 · DNS","https://www.rfc-editor.org/rfc/rfc1035"],["What happens when…","https://github.com/alex/what-happens-when"]]
});

WEEKS.push({
id:"w5", num:5, layer:"The machine underneath", title:"Compute", h1:"Compute: what a server actually is",
blurb:"Processes, the kernel, syscalls, sockets, and the real difference between VMs and containers.",
big:"A network only moves data between programs. Those programs run on an <b>operating system</b> that shares one CPU and one memory among many processes and guards the hardware. Programs ask the OS for everything through <b>system calls</b>, and a network socket is just another one. Virtual machines and containers are two answers to the same question: how do we safely share one computer?",
strip:{type:"shell", cmd:"strace -e trace=network curl -s example.com > /dev/null", note:"watch a program ask the kernel for the network"},
ideas:[
["Processes and memory","Each process thinks it owns all of memory. The OS and CPU translate those virtual addresses, so processes can't read each other's memory.","Memory is divided into pages, usually 4 KB each. Every process has its own page table mapping its virtual pages to physical ones, and the CPU’s memory management unit applies it on every access. Two processes can both use address <code>0x7ffd0000</code> and land in completely different RAM. A page that isn’t mapped for a process simply doesn’t exist from its point of view. Touching it causes a fault, and the kernel usually responds by killing the process with a segmentation fault. This is the first wall between programs. In 5.3 a cgroup caps how much memory your container may use, and you watch the kernel enforce that limit."],
["Kernel vs user space","The kernel can touch hardware and programs can't. A system call is the one door between them, and every security boundary depends on it.","The CPU runs in at least two privilege modes. User code runs unprivileged and can’t touch devices, page tables or other processes. When a program needs something, it puts a syscall number and arguments in registers and executes a special instruction (<code>syscall</code> on x86-64), which jumps into the kernel at a fixed entry point. The kernel checks the request and the caller’s permissions, does the work, and returns. Opening a file, sending a packet and starting a process all go through this door. A bug in the kernel’s checks undermines every boundary built on top of it. In 5.2 you watch <code>curl</code> make these calls through <code>strace</code>."],
["Sockets","<code>socket</code>, <code>bind</code>, <code>listen</code>, <code>accept</code>, <code>connect</code>, <code>send</code>, <code>recv</code>. Every networked program in every language comes down to these.","A socket is a file descriptor the kernel ties to a network endpoint. A server calls <code>socket</code>, <code>bind</code> to a port such as 9000, <code>listen</code>, then loops on <code>accept</code>, which returns a new socket for each client. A client calls <code>socket</code> and then <code>connect</code>, and the TCP handshake from week 3 happens inside that call. After that, both sides just <code>send</code> and <code>recv</code> bytes. TCP delivers a stream, not messages, so one <code>recv</code> may return half a line or three lines at once, and you must buffer and split them yourself. Your 5.1 chat server does exactly this, and it becomes Ember v0.1."],
["VMs vs containers","A VM fakes a whole computer with its own kernel. A container shares the host kernel but gets its own view of processes, files and network. It's lighter, but the wall is thinner.","A hypervisor such as KVM uses CPU virtualization features to run a full guest kernel on virtual hardware. Escaping a VM means breaking the hypervisor, a small and heavily tested target. A container is an ordinary process that the kernel fences in with namespaces (its own view of PIDs, mounts, hostname and network) and cgroups (limits on CPU and memory). It starts in milliseconds because there’s no kernel to boot. The cost is that every container makes syscalls into the same host kernel, so one kernel bug, like Dirty COW in 2016, can expose all of them. In 5.3 you build a container from <code>unshare</code>, <code>chroot</code> and a cgroup, and Ember v0.1 runs inside it."]],
psets:[
{id:"5.1", title:"Echo Chamber", lang:"Python",
problem:"Write a multi-client TCP chat server. Every line a client sends is broadcast to all other clients, prefixed with the sender's ID. Build it twice: one thread per client, then one thread using <code>selectors</code>. Load test both.",
input:"Clients connect on TCP port 9000 and send UTF-8 lines ending in \\n.", output:"Every other connected client receives <code>[id] message\\n</code>.",
examples:[{i:"client 1: hello\\n\nclient 2: hi there\\n", o:"client 2 sees: [1] hello\nclient 1 sees: [2] hi there", why:"Senders don't receive their own messages."}],
constraints:["Version 2 uses a single thread","Handle a client disconnecting mid-line","Survive 1,000 simultaneous clients"],
starter:`import selectors, socket

sel = selectors.DefaultSelector()
clients = {}   # sock -> (id, buffer)

def accept(server):
    conn, addr = server.accept()
    conn.setblocking(False)
    ...

def serve(port=9000):
    server = socket.socket()
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port)); server.listen(1024); server.setblocking(False)
    sel.register(server, selectors.EVENT_READ, accept)
    while True:
        for key, _ in sel.select():
            key.data(key.fileobj)`,
hints:["TCP is a byte stream, not messages. Buffer what you receive and split on \\n yourself.","Write a load-test script that opens 1,000 sockets and sends one line every second from each."],
accept:["Both versions pass the example","A table of memory use and message latency at 10, 100 and 1,000 clients for each version","You explain from your own numbers why event loops win"]},
{id:"5.2", title:"Syscall Safari", lang:"strace",
problem:"Trace a real program's conversation with the kernel.",
task:["<code>strace -f -e trace=network,read,write curl -s https://example.com</code>","Find the DNS lookup, the socket creation, the connect and the first data sent.","Do the same for your week 4 resolver."],
accept:["Each syscall you found is mapped to a layer from weeks 1–4","You can point at the exact syscall where the TCP handshake happens"]},
{id:"5.3", title:"Box", lang:"Linux (in a VM)",
problem:"Build a container by hand without Docker, using the same kernel features Docker uses.",
task:["Create a minimal root filesystem (for example with <code>debootstrap</code> or an Alpine minirootfs).","<code>sudo unshare --pid --mount --uts --net --fork</code>, then <code>chroot</code> into it and mount <code>/proc</code>.","Create a veth pair, move one end into the container's network namespace and give both ends IPs.","Limit its memory with a cgroup and run a program that exceeds the limit."],
accept:["ps inside your box shows its first process as PID 1","It can ping the host over the veth pair","You explain what happened when it hit the memory limit, and why a container is a weaker boundary than a VM"]}],
check:[
{t:"choice", q:"What's the key structural difference between a container and a VM?", o:["Containers can't use the network","Containers share the host's kernel; VMs run their own","VMs are always faster","Containers need special hardware"], a:1, why:"That shared kernel is why containers start fast, and why a kernel bug can break the isolation."},
{t:"text", q:"After listen(), which syscall does a server call to take the next incoming connection?", acc:["accept","accept()","accept4"], why:"accept() returns a new socket for that one connection."},
{t:"choice", q:"Why does an epoll-based server scale better than one thread per connection?", o:["epoll encrypts traffic","One thread can wait on thousands of sockets at once","It uses UDP","It skips the kernel"], a:1, why:"No per-connection thread means far less memory and context switching."},
{t:"explain", q:"Your web server must bind port 443. Describe two least-privilege steps you'd take.", model:"Run the process as a dedicated unprivileged user, granting only the capability to bind low ports (CAP_NET_BIND_SERVICE) or binding first and then dropping root. Give it read access only to the files it serves, and no shell or write access elsewhere. In a container, don't run as root and drop all unneeded capabilities."}],
reads:[["Operating Systems: Three Easy Pieces","https://pages.cs.wisc.edu/~remzi/OSTEP/"],["Beej's Guide to Network Programming","https://beej.us/guide/bgnet/"]]
});

WEEKS.push({
id:"w6", num:6, layer:"Trust math", title:"Cryptography", h1:"Cryptography: talking privately on a public wire",
blurb:"Symmetric keys, key exchange, hashes, signatures, and the certificate chain the web runs on.",
big:"Everything on a network can be read or changed by whoever carries it. Cryptography gives you three guarantees anyway: <b>confidentiality</b> (only the right party can read it), <b>integrity</b> (nobody changed it) and <b>authenticity</b> (it really came from them). The math is rarely the hard part. The hard part is agreeing on keys with a stranger and knowing who that stranger is.",
strip:{type:"shell", cmd:"openssl s_client -connect example.com:443 -showcerts", note:"see the chain of trust"},
ideas:[
["Symmetric encryption","One shared key locks and unlocks (AES, ChaCha20). It's fast. The problem is getting the key to the other side.","AES encrypts 16-byte blocks under a 128-, 192- or 256-bit key. ChaCha20 instead generates a keystream that is XORed with the data. A mode decides how blocks connect. ECB encrypts each block on its own, so repeated plaintext shows through as repeated ciphertext. Modern systems use authenticated modes like AES-GCM or ChaCha20-Poly1305, which encrypt and detect tampering in one step. Brute force is not the threat: a 128-bit key has 2¹²⁸ possibilities, about 3.4 × 10³⁸. The real risks are reused nonces, weak modes and leaked keys. Cryptopals in 6.2 has you break toy ciphers yourself, which shows why every Ember message needs a well-reviewed authenticated cipher."],
["Key exchange","Diffie-Hellman lets two parties agree on a secret over a public channel. An eavesdropper sees everything and still can't compute it.","Both sides agree on a public prime p and generator g. Alice picks a secret a and sends gᵃ mod p. Bob picks b and sends gᵇ mod p. Each raises the other’s value to their own secret, and both arrive at gᵃᵇ mod p. With p = 23 and g = 5, Alice’s secret 6 gives 5⁶ mod 23 = 8, Bob’s secret 15 gives 19, and both compute 2. An eavesdropper sees 8 and 19 but would have to solve a discrete logarithm, which is infeasible at 2048 bits. Nothing here says who is on the other end, though. In 6.1 you build it, let a lab middle party break it, then fix it with a signature."],
["Hashes and MACs","A hash is a fingerprint of data. A MAC is a fingerprint only key holders can compute, which proves the message wasn't altered.","A cryptographic hash like SHA-256 maps any input to a fixed 256-bit digest. Change one input bit and about half the output bits flip, and nobody can feasibly find two inputs with the same digest. But anyone can compute a hash, so an attacker who alters a message can simply recompute it. A MAC mixes in a secret key, so only key holders can produce a valid tag. HMAC-SHA256 is the common construction, and AEAD modes like AES-GCM build one in. A hospital receiving lab results can reject any record whose tag fails. Passwords are a special case: store them with deliberately slow hashes like Argon2 or bcrypt, as Ember’s logins will in week 10."],
["Signatures and PKI","A signature proves who wrote something. Certificate authorities sign statements that a key belongs to a name, and your browser trusts a built-in list of them. That list is the whole trust model of the web.","A signature uses a key pair. The private key signs, anyone with the public key can verify, and nobody without the private key can forge one. An Ed25519 signature is just 64 bytes. A certificate is a signed statement, “this public key belongs to example.com,” issued by a certificate authority. Browsers verify a chain from the site’s leaf certificate through an intermediate up to a root they ship with. In 2011 the Dutch CA DigiNotar was breached and issued a fraudulent certificate for google.com that was used to intercept users in Iran. In 6.3 you verify a chain by hand, and Ember clients use signatures to verify each other’s keys."]],
psets:[
{id:"6.1", title:"Shared Secret", lang:"Python",
problem:"Implement Diffie-Hellman, simulate a man in the middle who reads everything, then fix it with a signature.",
input:"<code>dh_public(g, p, secret)</code> and <code>dh_shared(their_public, secret, p)</code>", output:"Integers. Both sides must compute the same shared secret.",
examples:[{i:"p, g = 23, 5\nA = dh_public(g, p, 6)\nB = dh_public(g, p, 15)\ndh_shared(B, 6, p), dh_shared(A, 15, p)", o:"A = 8, B = 19, shared = (2, 2)", why:"These match the diagram above. Check them by hand once."}],
constraints:["Use Python's built-in pow(base, exp, mod)","For the real run, use the 2048-bit MODP group 14 from RFC 3526 and secrets from the secrets module"],
starter:`import secrets

def dh_public(g: int, p: int, secret: int) -> int:
    ...

def dh_shared(their_public: int, secret: int, p: int) -> int:
    ...

# Part 2: Mallory runs two exchanges, one with Alice and one with Bob,
# and relays (and reads) every message. Show both sides "succeed".
# Part 3: Bob signs B with an Ed25519 key Alice already trusts
# (cryptography library). Alice verifies and aborts if it fails.`,
hints:["In part 2, Alice ends up sharing a key with Mallory, not Bob. Print all three keys to prove it.","Part 3 shows that authentication needs something Alice already trusts. Write down what that is."],
accept:["The example passes","The 2048-bit version gives matching secrets","Your middle-party demo shows Alice and Bob unknowingly holding different keys","Your signed version detects the middle party and aborts"]},
{id:"6.2", title:"Cryptopals Set 1", lang:"Python",
problem:"Complete the eight challenges of Cryptopals Set 1. They're built for learning: you break toy ciphers yourself and see exactly why certain designs fail.",
task:["Convert hex to base64","Fixed XOR","Single-byte XOR cipher","Detect single-character XOR","Implement repeating-key XOR","Break repeating-key XOR","AES in ECB mode","Detect AES in ECB mode"],
accept:["All eight produce the expected output","One sentence per challenge naming the design mistake that made it breakable","You can explain why ECB mode is never acceptable for real data"]},
{id:"6.3", title:"Chain of Trust", lang:"openssl",
problem:"Verify a certificate chain by hand and study what happens when trust breaks.",
task:["Download the chain for three sites: <code>openssl s_client -connect SITE:443 -showcerts</code>","Identify the leaf, intermediate and root for each.","Verify with <code>openssl verify -untrusted intermediate.pem leaf.pem</code>","Read about the 2011 DigiNotar incident."],
accept:["A diagram of one chain showing who signed what","You explain what Certificate Transparency adds and how it would have caught DigiNotar sooner"]}],
check:[
{t:"num", q:"Diffie-Hellman with p = 23, g = 5. Alice's secret is a = 4. What public value A does she send?", a:4, tol:0, unit:"", why:"5⁴ = 625, and 625 mod 23 = 4."},
{t:"num", q:"Bob's secret is b = 3, so he sends B = 5³ mod 23 = 10. What shared secret do they both compute?", a:18, tol:0, unit:"", why:"Bᵃ = 10⁴ mod 23 = 18, and Aᵇ = 4³ mod 23 = 64 mod 23 = 18."},
{t:"choice", q:"What does forward secrecy protect?", o:["Future sessions if a password leaks","Past sessions if the server's long-term key is stolen later","The certificate authority","Data stored on disk"], a:1, why:"Each session uses fresh ephemeral keys that are thrown away afterward."},
{t:"choice", q:"Why is AES in ECB mode unsafe?", o:["The key is too short","Identical plaintext blocks produce identical ciphertext blocks","It's too slow","It can't be decrypted"], a:1, why:"Patterns survive encryption. The classic example is the “ECB penguin” image."},
{t:"explain", q:"Why can't Diffie-Hellman alone protect you from a man in the middle?", model:"DH proves you share a secret with whoever you exchanged values with, not who that is. An attacker can run separate exchanges with each side and relay traffic, reading everything. Authentication, such as a signature from a key you already trust (like a CA-signed certificate), ties the exchange to the right identity."}],
reads:[["The Illustrated TLS 1.3 Connection","https://tls13.xargs.org/"],["Cryptopals","https://cryptopals.com/"],["Dan Boneh, Cryptography I","https://www.coursera.org/learn/crypto"]]
});
