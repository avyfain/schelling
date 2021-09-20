(function(){

var world_width = 400,
	world_height = 400,
	controlbox_width = 400,
	controlbox_height = 400,
	n_grid_x = 12,
	n_grid_y = 12,
	margin = 10;
	
var display = d3.selectAll("#microbe_display").append("svg")
	.attr("width",world_width)
	.attr("height",world_height)
	.attr("class","explorable_display")
	
var controls = d3.selectAll("#microbe_controls").append("svg")
	.attr("width",controlbox_width)
	.attr("height",controlbox_height)
	.attr("class","explorable_widgets")	
	
var display  = d3.select("#schelling_display").append("svg")
		.attr("id", "svg")
		.attr("width", world_width)
		.attr("height", world_height)
		.attr("class","explorable_display")
		.style("background","rgb(148,148,148)")


var controls = d3.selectAll("#schelling_controls").append("svg")
		.attr("width",controlbox_width)
		.attr("height",controlbox_height)
		.attr("class","explorable_widgets")

	
var g = widget.grid(controlbox_width,controlbox_height,n_grid_x,n_grid_y);

/*controls.selectAll(".grid").data(g.lattice()).enter().append("circle")
	.attr("class","grid")
	.attr("transform",function(d){
		return "translate("+d.x+","+d.y+")"
	})
	.attr("r",1)
	.style("fill","black")
	.style("stroke","none")*/

//fixed parameters 
	
var N = 50,
	agent_size = 1,
	personscale=0.18;

// this are the default values for the slider variables

var densities = [0.3,0.5,0.8],
	N_groups = [2,3,4],
	def_tolerance = 0.9;
	
var playblock = g.block({x0:3,y0:10,width:0,height:0});
var buttonblock = g.block({x0:2,y0:7,width:2,height:0}).Nx(2);
var radioblock = g.block({x0:3,y0:0,width:4,height:3}).Nx(2);
var sliderblock = g.block({x0:1,y0:4.5,width:10,height:3});
var plotblock = g.block({x0:6.5,y0:7,width:5,height:4});
	
// here are the buttons

var playpause = { id:"b1", name:"", actions: ["play","pause"], value: 0};
var back = { id:"b2", name:"", actions: ["back"], value: 0};
var reset = { id:"b3", name:"", actions: ["rewind"], value: 0};

var playbutton = [
	widget.button(playpause).size(g.x(3)).symbolSize(0.6*g.x(3)).update(runpause)
]

var buttons = [
	widget.button(back).update(resetsystem),
	widget.button(reset).update(resetparameters)
]

var tolerance = {id:"tolerance", name: "Tolerance", range: [0.2,1], value: def_tolerance};

var sliderwidth = sliderblock.w(),
	handleSize = 12, 
	trackSize = 8;

var slider = [
	widget.slider(tolerance).width(sliderwidth).trackSize(trackSize).handleSize(handleSize)
]

// radios

var density = {id:"density", name:"density", choices: ["30 %","50 %", "80 %"], value:0}
var types = {id:"density", name:"# of classes", choices: ["2 Types","3 Types", "4 Types"], value:0}


var radios = [
	widget.radio(density).size(radioblock.h()).label("right")
	.shape("circle").buttonSize(26).buttonInnerSize(18).fontSize(16).update(fullreset),
	widget.radio(types).size(radioblock.h()).label("right")
	.shape("circle").buttonSize(26).buttonInnerSize(18).fontSize(16).update(fullreset)
	
]
	
// darkness parameters

var pb = controls.selectAll(".button .playbutton").data(playbutton).enter().append(widget.buttonElement)
	.attr("transform",function(d,i){return "translate("+playblock.x(0)+","+playblock.y(i)+")"});	

var bu = controls.selectAll(".button .others").data(buttons).enter().append(widget.buttonElement)
	.attr("transform",function(d,i){return "translate("+buttonblock.x(i)+","+buttonblock.y(0)+")"});	

var spsl = controls.selectAll(".slider").data(slider).enter().append(widget.sliderElement)
	.attr("transform",function(d,i){return "translate("+sliderblock.x(0)+","+sliderblock.y(i)+")"});

var rad = controls.selectAll(".radio .input").data(radios).enter().append(widget.radioElement)
	.attr("transform",function(d,i){return "translate("+radioblock.x(i)+","+radioblock.y(0)+")"});	
		
/////////////////////////
// this is the agent data	
/////////////////////////



var X = d3.scaleLinear().range([0,world_width]);
var Y = d3.scaleLinear().range([0,world_height]);
var C = d3.scaleOrdinal().domain(d3.range(N_groups)).range(["black","white","darkred","rgb(0,0,140)"]);


var sc_x = d3.scaleLinear().domain([0,500]).range([0, plotblock.w()]);
var sc_y = d3.scaleLinear().domain([0,100]).range([0,-plotblock.h()]);

var xAxis = d3.axisBottom(sc_x).tickFormat("");
var yAxis = d3.axisLeft(sc_y).tickFormat("");

var plt = controls.append("g").attr("class","plot")
	.attr("transform","translate("+plotblock.x(0)+","+plotblock.y(0)+")")

	
	
plt.append("g").call(xAxis).attr("class","xaxis").attr("transform","translate(0,"+(-plotblock.h()/2*0)+")");;
plt.append("g").call(yAxis).attr("class","yaxis")

plt.append("text").text("time").attr("transform","translate("+sc_x(250)+","+20+")")
	.style("text-anchor","middle").style("font-size",12)	

plt.append("text").text("% unhappy").attr("transform","translate("+(-20)+","+(sc_y(50))+")rotate(-90)")
	.style("text-anchor","middle").style("font-size",12)



G = lattice.square(N).scale(1);
nodes = G.nodes;

X.domain([0,N]);
Y.domain([0,N]);

agents = [];

var unhappyfraction; 
var plotline = d3.line().x(function(d){return sc_x(d.x)}).y(function(d){return sc_y(d.y)});


initialize();

var agent = display.selectAll(".agent").data(agents,function(d){return d.index}).enter().append("g").attr("class","agent").attr("id",function(d){return "id_"+d.index})
	.attr("transform",function(d){return "translate("+X(d.home.x+0.5)+","+Y(d.home.y+0.5)+")"})

unhappyfraction = [{x:0	,y:fracofunhap()}];
var curve = plt.append("path").datum(unhappyfraction)
	.attr("d",plotline).attr("class","plotline")
	.style("fill","none").style("stroke","darkred").style("stroke-width",3)

function initialize(){
	agents = d3.range(Math.floor(N*N*densities[density.value])).map(function(d,i){
		return {index: i}
	});

	let rd = d3.shuffle(d3.range(nodes.length));

	nodes.forEach(function(d){
		d.tenant = undefined;
	})

	agents.forEach(function(a,i){
		a.type = Math.floor(N_groups[types.value] * Math.random());
		a.home = nodes[rd[i]];
		nodes[rd[i]].tenant = a;
	})
	
}


	


var men = agent.append("circle").attr("r",3)
//	.style("stroke","black")
//	.style("stroke-width","0.5")
	.style("fill",function(d){return C(d.type)})
	
          
/*var men = agent.append("path").attr("class","man")
		.attr("d",moman)
		.attr("transform",function(d){
					return "translate(0,0)scale("+personscale+")"
		})
		.style("stroke-width",""+0.5/personscale+"px")
	.style("stroke","none")
	.style("fill",function(d){return C(d.type)})
*/
var tick=0;


// functions for the action buttons

function fullreset(){
		tick=0;
	agent.remove();
	curve.remove();
	
	initialize();
	agent = display.selectAll(".agent").data(agents,function(d){return d.index}).enter().append("g").attr("class","agent").attr("id",function(d){return "id_"+d.index})
		.attr("transform",function(d){return "translate("+X(d.home.x+0.5)+","+Y(d.home.y+0.5)+")"})

	unhappyfraction = [{x:0	,y:fracofunhap()}];
	sc_x.domain([0,500])
	curve = plt.append("path").datum(unhappyfraction)
		.attr("d",plotline).attr("class","plotline")
		.style("fill","none").style("stroke","darkred").style("stroke-width",3)
	
	men = agent.append("circle").attr("r",3)
		.style("fill",function(d){return C(d.type)})
}

function runpause(d){ 
	if (d.value == 1) {
		t = d3.interval(runsim,10)
	} else {
		t.stop()
	}
 }

function resetsystem(){

	tick=0;
	initialize();
	display.selectAll(".agent").data(agents,function(d){return d.index})
	.attr("transform",function(d){return "translate("+X(d.home.x+0.5)+","+Y(d.home.y+0.5)+")"})

	unhappyfraction = [{x:0	,y:fracofunhap()}];
	sc_x.domain([0,500])
	curve.datum(unhappyfraction).attr("d",plotline)
	
}

function resetparameters(){
	slider[0].click(def_tolerance);
}

function fracofunhap(){
	return agents.filter(function(a){return a.unhappy}).length / agents.length * 100
}

function runsim(){
	
	tick++;
	
	happiness();
	let candidates = d3.shuffle(agents.filter(function(d){return d.unhappy}))

	if (candidates.length > 0){
			move(candidates[0])
	} else {
		playbutton[0].click()
	}
	
	unhappyfraction.push({x:tick,y:fracofunhap()});
	if(unhappyfraction.length>500){
		sc_x.domain([tick-500,tick])
		d3.select(".xaxis").call(xAxis);
		unhappyfraction.shift();
	}
	
	
	d3.select(".plotline").datum(unhappyfraction).attr("d",plotline);
	
}

function happiness(){
	agents.forEach(function(a){
		let neighbors = a.home.neighbors;
		let occupied = neighbors.filter(function(n){ return n.tenant != undefined})
		let likes = 0;
		let unlikes = 0;
		
		a.unhappy = true;
		
		if (occupied.length > 0) {

			likes = occupied.filter(function(n){ return n.tenant.type == a.type})
			unlikes = occupied.filter(function(n){ return n.tenant.type != a.type})
			a.unhappy = unlikes.length / (unlikes.length + likes.length) > tolerance.value
		
		} 
		
		
	})
}

function move(a){
	
		
		
		
			

			var unoccupied = nodes.filter(function(x){
				return x.tenant == undefined && 
				x.neighbors.filter(function(n){return n.tenant == undefined}).length != 0;		
			})
			
			let target = d3.shuffle(unoccupied)[0];

			a.home.tenant = undefined;
			a.home = target;
						
			target.tenant = a;
			
		
		
	display.select("#id_"+a.index).transition().duration(1000)
			.attr("transform",function(d){return "translate("+X(d.home.x+0.5)+","+Y(d.home.y+0.5)+")"})
	
	
	
		
}


function man(){
return "M53.5,476c0,14,6.833,21,20.5,21s20.5-7,20.5-21V287h21v189c0,14,6.834,21,20.5,21c13.667,0,20.5-7,20.5-21V154h10v116c0,7.334,2.5,12.667,7.5,16s10.167,3.333,15.5,0s8-8.667,8-16V145c0-13.334-4.5-23.667-13.5-31   s-21.5-11-37.5-11h-82c-15.333,0-27.833,3.333-37.5,10s-14.5,17-14.5,31v133c0,6,2.667,10.333,8,13s10.5,2.667,15.5,0s7.5-7,7.5-13   V154h10V476M61.5,42.5c0,11.667,4.167,21.667,12.5,30S92.333,85,104,85s21.667-4.167,30-12.5S146.5,54,146.5,42   c0-11.335-4.167-21.168-12.5-29.5C125.667,4.167,115.667,0,104,0S82.333,4.167,74,12.5S61.5,30.833,61.5,42.5z" 
	
}
function moman(){
	return "m 86.404,373.316 c 0.179,-1.446 -0.778,-7.529 -1.646,-7.783 -6.137,-1.796 -8.735,0.04 -13.021,-24.246 -4.069,-23.05 -4.491,-26.342 -3.592,-30.982 0.015,-0.081 1.142,-1.032 -0.375,-1.048 -1.516,-0.016 -3.414,-9.858 -2.918,-10.851 0.202,-0.405 2.13,-3.541 4.415,-0.926 2.285,2.614 2.395,10.43 1.572,11.777 -0.458,0.748 1.311,0.662 1.421,0.823 3.635,5.341 5.463,36.595 6.661,37.343 1.197,0.748 -0.395,-25.893 -1.919,-31.58 -1.524,-5.688 -1.225,-39.741 0,-44.452 1.245,-4.789 2.966,-29.934 3.864,-30.233 0.898,-0.3 1.198,1.744 1.647,-0.251 0.449,-1.994 -11.076,-9.029 -11.225,-13.219 -0.15,-4.191 3.546,-3.532 6.839,-2.634 3.293,0.898 10.672,7.124 10.971,10.566 0.299,3.442 -3.741,5.775 -1.796,6.585 0.898,0.375 1.192,-0.086 2.076,1.198 0.618,0.898 -2.3,49.241 0.394,52.983 2.694,3.741 3.816,7.783 4.565,-0.15 0.748,-7.932 0.972,-50.214 2.619,-51.561 1.646,-1.347 1.933,0.374 0.973,-1.572 -0.961,-1.945 -2.096,-6.136 -1.048,-6.735 1.048,-0.598 10.592,-6.874 11.03,-6.973 9.28,-2.096 7.978,1.735 7.828,4.13 -0.149,2.394 -10.926,9.878 -11.824,10.925 -0.898,1.048 -0.575,0.796 -0.299,1.348 0,0 0.32,-0.015 1.497,0.299 1.122,0.299 -0.599,19.158 0.299,23.648 0.898,4.49 1.347,40.261 0.599,45.2 -0.749,4.939 -6.137,32.927 -3.742,32.927 1.612,0 4.766,-37.022 8.831,-38.764 1.047,-0.449 0.873,-0.894 1.122,-0.973 0.224,-0.071 -0.652,-7.559 2.267,-10.132 0.521,-0.459 3.02,-0.752 3.367,-0.42 3.443,3.293 -3.059,10.754 -2.79,10.926 0.469,0.299 0.931,1.171 0.97,1.197 2.697,1.796 -9.127,50.589 -17.078,54.63 -2.137,1.086 -5.37,-0.3 -5.519,1.796 -0.15,2.095 -0.42,5.664 -0.449,6.286 -0.036,0.748 8.178,1.824 5.717,19.358 -0.599,4.266 -15.085,7.259 -16.464,1.796 -1.946,-7.708 4.161,-20.256 4.161,-20.256 z"
}


})()