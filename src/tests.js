/* In-browser Python tests, keyed by problem set id.
   stub: editor starter when the problem has no `starter`.
   tests: {pre: setup statements, run: expression, want: expected value, show: optional display text, hide: true for hidden tests}.
   A test passes when eval(run) == eval(want). raises(Exc, fn, *args) is available in tests. */
var TESTS={
"0.1":{tests:[
  {run:"min_rtt_ms(10000)", want:"100.0"},
  {run:"min_rtt_ms(640)", want:"6.4"},
  {run:"min_rtt_ms(40000)", want:"400.0", hide:true},
  {run:"min_rtt_ms(123.4)", want:"1.2", hide:true},
  {run:"min_rtt_ms(1)", want:"0.0", hide:true}]},

"0.2":{tests:[
  {run:"encode(b'A')", want:"[1,0, 0,1, 1,0, 1,0, 1,0, 1,0, 1,0, 0,1]"},
  {run:"raises(ValueError, decode, [1,1, 0,1])", want:"True", show:"decode([1,1, 0,1])  # should raise ValueError"},
  {run:"encode(b'')", want:"[]", hide:true},
  {run:"decode(encode(b'hello'))", want:"b'hello'", hide:true},
  {run:"decode(encode(bytes(range(256)))) == bytes(range(256))", want:"True", hide:true},
  {run:"raises(ValueError, decode, [0,0]*8)", want:"True", show:"decode([0,0]*8)  # should raise ValueError", hide:true}]},

"0.3":{stub:`def truck_vs_link(size_tb: float, link_gbps: float, distance_km: float, speed_kmh: float) -> tuple:
    """Return (link_hours, truck_hours, truck_gbps), each rounded to 1 decimal."""
    ...`, tests:[
  {run:"truck_vs_link(100, 1, 400, 80)", want:"(222.2, 5.0, 44.4)"},
  {run:"truck_vs_link(500, 10, 450, 75)", want:"(111.1, 6.0, 185.2)", hide:true},
  {run:"truck_vs_link(1, 1, 100, 100)", want:"(2.2, 1.0, 2.2)", hide:true}]},

"1.1":{tests:[
  {pre:"sw = LearningSwitch(4, aging_s=300)", run:"sw.handle({'src':'A','dst':'D'}, 1, now=0)", want:"[2, 3, 4]"},
  {pre:"sw = LearningSwitch(4, aging_s=300)\nsw.handle({'src':'A','dst':'D'}, 1, now=0)", run:"sw.handle({'src':'D','dst':'A'}, 4, now=1)", want:"[1]"},
  {pre:"sw = LearningSwitch(4, aging_s=300)\nsw.handle({'src':'A','dst':'D'}, 1, now=0)\nsw.handle({'src':'D','dst':'A'}, 4, now=1)", run:"sw.handle({'src':'A','dst':'D'}, 1, now=2)", want:"[4]"},
  {pre:"sw = LearningSwitch(4, aging_s=300)\nsw.handle({'src':'A','dst':'D'}, 1, now=0)\nsw.handle({'src':'D','dst':'A'}, 4, now=1)\nsw.handle({'src':'A','dst':'D'}, 1, now=2)", run:"sw.handle({'src':'A','dst':'D'}, 1, now=400)", want:"[2, 3, 4]"},
  {pre:"sw = LearningSwitch(4, aging_s=300)\nsw.handle({'src':'A','dst':'B'}, 1, now=0)\nsw.handle({'src':'B','dst':'X'}, 1, now=1)", run:"sw.handle({'src':'A','dst':'B'}, 1, now=2)", want:"[]", hide:true},
  {pre:"sw = LearningSwitch(4, aging_s=300)", run:"sw.handle({'src':'A','dst':'ff:ff:ff:ff:ff:ff'}, 2, now=0)", want:"[1, 3, 4]", hide:true},
  {pre:"sw = LearningSwitch(3, aging_s=10)\nsw.handle({'src':'D','dst':'A'}, 3, now=0)", run:"sw.handle({'src':'A','dst':'D'}, 1, now=10)", want:"[3]", hide:true}]},

"1.3":{tests:[
  {run:"detect([(0,'10.0.0.1','aa:aa'), (5,'10.0.0.7','bb:bb'), (9,'10.0.0.1','cc:cc'), (12,'10.0.0.1','cc:cc')])", want:"[(9, '10.0.0.1', 'aa:aa', 'cc:cc')]"},
  {run:"detect([])", want:"[]", hide:true},
  {run:"detect([(0,'x','m1'), (1,'y','m2'), (2,'y','m2')])", want:"[]", hide:true},
  {run:"detect([(0,'g','a'), (1,'g','b'), (2,'g','a')])", want:"[(1, 'g', 'a', 'b'), (2, 'g', 'b', 'a')]", hide:true}]},

"2.1":{tests:[
  {pre:"t = RoutingTable()\nt.add('0.0.0.0/0', 'isp')\nt.add('10.0.0.0/8', 'core')\nt.add('10.40.0.0/16', 'division')\nt.add('10.40.12.0/24', 'site12')", run:"t.lookup('10.40.12.7')", want:"'site12'"},
  {pre:"t = RoutingTable()\nt.add('0.0.0.0/0', 'isp')\nt.add('10.0.0.0/8', 'core')\nt.add('10.40.0.0/16', 'division')\nt.add('10.40.12.0/24', 'site12')", run:"t.lookup('10.40.99.1')", want:"'division'"},
  {pre:"t = RoutingTable()\nt.add('0.0.0.0/0', 'isp')\nt.add('10.0.0.0/8', 'core')\nt.add('10.40.0.0/16', 'division')\nt.add('10.40.12.0/24', 'site12')", run:"t.lookup('8.8.8.8')", want:"'isp'"},
  {pre:"t = RoutingTable()", run:"t.lookup('1.2.3.4')", want:"None", hide:true},
  {pre:"t = RoutingTable()\nt.add('10.0.0.0/8', 'core')", run:"t.lookup('11.0.0.1')", want:"None", hide:true},
  {pre:"t = RoutingTable()\nt.add('10.0.0.0/8', 'a')\nt.add('10.1.2.3/32', 'h')", run:"(t.lookup('10.1.2.3'), t.lookup('10.1.2.4'))", want:"('h', 'a')", hide:true},
  {pre:"t = RoutingTable()\nt.add('192.168.1.0/24', 'lan')\nt.add('192.168.0.0/16', 'site')", run:"(t.lookup('192.168.1.9'), t.lookup('192.168.2.9'))", want:"('lan', 'site')", hide:true}]},

"3.2":{stub:`def simulate(rates: list[float], capacity: float, rounds: int) -> list[list[float]]:
    """AIMD: each round, halve every rate if the total exceeds capacity, else add 1 to each."""
    ...`, tests:[
  {run:"simulate([10, 60], 100, 3)", want:"[[11, 61], [12, 62], [13, 63]]"},
  {run:"simulate([45, 60], 100, 1)", want:"[[22.5, 30.0]]"},
  {run:"simulate([50, 50], 100, 1)", want:"[[51, 51]]", hide:true},
  {run:"simulate([60, 60], 100, 2)", want:"[[30.0, 30.0], [31.0, 31.0]]", hide:true},
  {run:"simulate([1], 100, 0)", want:"[]", hide:true}]},

"6.1":{tests:[
  {run:"(dh_public(5, 23, 6), dh_public(5, 23, 15))", want:"(8, 19)"},
  {run:"(dh_shared(19, 6, 23), dh_shared(8, 15, 23))", want:"(2, 2)"},
  {run:"(dh_public(5, 23, 4), dh_shared(10, 4, 23))", want:"(4, 18)", hide:true},
  {pre:"import secrets\np = 2**127 - 1\na = secrets.randbelow(p - 2) + 1\nb = secrets.randbelow(p - 2) + 1", run:"dh_shared(dh_public(3, p, b), a, p) == dh_shared(dh_public(3, p, a), b, p)", want:"True", show:"# random 127-bit secrets a, b\ndh_shared(dh_public(3, p, b), a, p) == dh_shared(dh_public(3, p, a), b, p)", hide:true}]},

"8.3":{tests:[
  {run:"detect([(0,'a','h1',22), (1,'a','h1',80), (2,'a','h1',443), (5,'b','h2',443), (30,'b','h2',443)], n=3, w=10)", want:"['a']"},
  {run:"detect([(0,'a','h',22)] * 5, n=2, w=10)", want:"[]", hide:true},
  {run:"detect([(0,'a','h',1), (20,'a','h',2), (40,'a','h',3)], n=3, w=10)", want:"[]", hide:true},
  {run:"detect([(0,'s','h1',22), (1,'s','h2',22), (2,'s','h3',22)], n=3, w=10)", want:"['s']", hide:true},
  {run:"detect([(0,'z','h',1), (0,'b','h',1), (1,'z','h',2), (1,'b','h',2)], n=2, w=10)", want:"['b', 'z']", hide:true},
  {run:"detect([(0,'a','h',1), (1,'a','h',2), (15,'a','h',3), (16,'a','h',1)], n=3, w=10)", want:"[]", hide:true}]}
};
