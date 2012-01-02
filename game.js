var mousex = 0;
var mousey = 0;

var ctx;

var SCREENSIZE = 400;

/* Game states */
var STATE_PLAYING = 1;
var STATE_BETWEEN = 2;
var STATE_END = 3;
var STATE_WAITING = 4;

/* Score related constants */
var SCORE_ENDLEVEL = -1;
var SCORE_BILLPOINTS = 5;

var state;
var efficiency;
var score, level, iteration;
var downcursor;
var grabbed;
var gui;
var screensize = SCREENSIZE;
var paused = 0;

var playing = 0;
var methods;
var dialog_strings;
var menu_strings;
var timer = 0;
var sprites;
var grabbedos;

var NUMSCORES = 10;
var score_str;

var BILL_STATE_IN = 1;
var BILL_STATE_AT = 2;
var BILL_STATE_OUT = 3;
var BILL_STATE_DYING = 4;
var BILL_STATE_STRAY = 5;

/* Offsets from upper right of computer */
var BILL_OFFSET_X = 20;
var BILL_OFFSET_Y = 3;

/* speed at which OS drops */
var GRAVITY = 3;

/* speed of moving Bill */
var SLOW = 0;
var FAST = 1;

var WCELS = 4;                 /* # of bill walking animation frames */
var DCELS = 5;                 /* # of bill dying animation frames */
var ACELS = 13;                /* # of bill switching OS frames */

var billwidth, billheight;

var OS_OFFSET = 4;			/* offset of screen from 0,0 */
var COMPUTER_TOASTER = 0;	/* computer 0 is a toaster */

var MIN_PC = 6;		/* type >= MIN_PC means the computer is a PC */

var cpuname = ["toaster", "maccpu", "nextcpu", "sgicpu", "suncpu", "palmcpu", "os2cpu", "bsdcpu"];

var NUM_SYS = cpuname.length;

var compwidth = 55;
var compheight = 45;

var SPARK_SPEED = 4;

//var cursor;
var bucketgrabbed;
var bucketwidth = 24;
var bucketheight = 24;

var OS_WINGDOWS = 0;
var OS_OFF = -1;
var oswidth = 28;
var osheight = 24;

var osname = ["wingdows", "apple", "next", "sgi", "sun", "palm", "os2", "bsd", "linux", "redhat", "hurd", "beos"];
var NUM_OS = osname.length;

//var cursor = [];		/* array of OS cursors (drag/drop) */

var NETWORK_COUNTER_OFF = 0;
var NETWORK_COUNTER_BASE = 1;
var NETWORK_COUNTER_WIN = 2;
var NETWORK_COUNTER_MAX = 2;

var STD_MAX_COMPUTERS = 20;

var computers = [];
var ncomputers;
var cables = [];
var ncables;
var counters = [];	/* number in each state */

var alive = null;
var strays = null;

var MAX_BILLS = 100;		/* max Bills per level */
var HORDE_COUNTER_OFF = 0;
var HORDE_COUNTER_ON = 0;

function RAND(lb, ub) {
	return Math.floor(Math.random() * ((ub) - (lb) + 1) + (lb));
}

function BORDER(size) {		/* at least this far from a side */
	return size / 10;
}

/*
 * Timer operations
 */

function timer_tick() {
	UI_restart_timer();
	Game_update();
	return true;
}

function start_timer(ms) {
	if (timer === 0) {
		timer = setInterval(timer_tick, ms);
	}
}

function stop_timer() {
	if (timer !== 0) {
		clearInterval(timer);
	}
	timer = 0;
}

function timer_active() {
	return (!!timer);
}

/*
 * Timer control routines
 */
function UI_restart_timer() {
	start_timer(200);
}

function UI_kill_timer() {
	stop_timer();
}

function UI_pause_game() {
	if (timer_active()) {
		playing = 1;
	}
	UI_kill_timer();
}

function UI_resume_game() {
	if (playing && !timer_active()) {
		UI_restart_timer();
	}
	playing = 0;
}

/*
 * Graphics routines
 */

function UI_draw_cursor() {
	Bucket_draw();
}

function UI_draw_line(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

/*
 * Other routines
 */

function UI_set_pausebutton(action) {
	if (document.all || document.getElementByid) {
		if (action === 1) {
			document.pausebtn.disabled = false;
		} else {
			document.pausebtn.disabled = true;
		}
	}
}

function UI_load_picture_indexed(name, index) {
	return UI_load_picture(name + '_' + index);
}

function UI_load_picture(name) {
	var image = new Image();
	image.src = 'images/' + name + '.png';
	return image;
}

function UI_picture_width(pict) {
	return pict.width;
}

function UI_picture_height(pict) {
	return pict.height;
}

function UI_load_cursor(name) {
	var image = new Image();
	image.src = 'images/' + name + '.png';
	return image;
}

function UI_intersect(x1, y1, w1, h1, x2, y2, w2, h2) {
	return ((Math.abs(x2 - x1 + (w2 - w1) / 2) < (w1 + w2) / 2) && (Math.abs(y2 - y1 + (h2 - h1) / 2) < (h1 + h2) / 2));
}

function UI_load_pix() {
	sprites = new Image();
	sprites.src = 'images/sprites.png';
}

/*
 * Scorelist
 */

var scores = [
    {
        "score": 2000,
        "level": 10,
        "name": "brian"
    },
    {
        "score": 1800,
        "level": 9,
        "name": "matias"
    },
    {
        "score": 1600,
        "level": 8,
        "name": "me"
    },
    {
        "score": 1400,
        "level": 7,
        "name": "me"
    },
    {
        "score": 1200,
        "level": 6,
        "name": "me"
    },
    {
        "score": 1000,
        "level": 5,
        "name": "me"
    },
    {
        "score": 800,
        "level": 4,
        "name": "me"
    },
    {
        "score": 600,
        "level": 3,
        "name": "me"
    },
    {
        "score": 400,
        "level": 2,
        "name": "me"
    },
    {
        "score": 200,
        "level": 1,
        "name": "me"
    }
];

function Scorelist_read() {
	if ($.cookie("scores") !== null) {
		scores = JSON.parse($.cookie("scores"));
	}
}

function Scorelist_write() {
	var convertedscores = JSON.stringify(scores);
	$.cookie('scores', convertedscores, { expires: 3650 });
}

/*  Add new high score to list   */
function Scorelist_recalc(str, level, score) {
	var i, tname;

	if (scores[NUMSCORES - 1].score >= score) {
		return;
	}
	for (i = NUMSCORES - 1; i > 0; i--) {
		if (scores[i - 1].score < score) {
			scores[i].name = scores[i - 1].name;
			scores[i].level = scores[i - 1].level;
			scores[i].score = scores[i - 1].score;
		} else {
			break;
		}
	}

	if (str === null || str[0] === 0) {
		tname = "Anonymous";
	}
	tname = str;

	scores[i].name = tname;
	scores[i].level = level;
	scores[i].score = Math.floor(score);
}

function Scorelist_update() {
	var i;
	var scoreTableId = document.getElementById("scoretable");
	var score_html = "<tr><th colspan=3>High Scores</th></tr><tr><td>Name</td><td>Level</td><td>Score</td></tr>";
	for (i = 0; i < scores.length; i++) {
		score_html = score_html + "<tr><td>" + scores[i].name + "</td><td>" + scores[i].level + "</td><td>" + scores[i].score + "</td></tr>";
	}
	scoreTableId.innerHTML = score_html;
}

function Scorelist_ishighscore(val) {
	return (val > scores[NUMSCORES - 1].score);
}

/*
 * Bill
 */

function Bill() {
	this.state;		/* what is it doing? */
	this.index;		/* index of animation frame */
	this.x;
	this.y;		/* location */
	this.dx;	/* direction */
	this.target_x;		/* target x position */
	this.target_y;		/* target y position */
	this.target_c;		/* target computer */
	this.dx;	/* direction */
	this.dx;	/* direction */
	this.dx;	/* direction */
	this.cargo;		/* which OS carried */
	this.x_offset;		/* accounts for width differences */
	this.y_offset;		/* 'bounce' factor for OS carried */
	this.sx;
	this.sy;		/* used for drawing extra OS during switch */
	this.prev;
	this.next;
};

function get_border_bill(bill) {
	var i = RAND(0, 3);
	var screensize = Game_screensize();

	if (i % 2 === 0) {
		bill.x = RAND(0, screensize - billwidth);
	} else {
		bill.y = RAND(0, screensize - billheight);
	}

	switch (i) {
		case 0:
			bill.y = -billheight - 16;
			break;
		case 1:
			bill.x = screensize + 1;
			break;
		case 2:
			bill.y = screensize + 1;
			break;
		case 3:
			bill.x = -billwidth - 2;
			break;
	}
}

function get_border_target(bill) {
	var i = RAND(0, 3);
	var screensize = Game_screensize();

	if (i % 2 === 0) {
		bill.target_x = RAND(0, screensize - billwidth);
	} else {
		bill.target_y = RAND(0, screensize - billheight);
	}

	switch (i) {
		case 0:
			bill.target_y = -billheight - 16;
			break;
		case 1:
			bill.target_x = screensize + 1;
			break;
		case 2:
			bill.target_y = screensize + 1;
			break;
		case 3:
			bill.target_x = - billwidth - 2;
			break;
	}
}

/*
function get_border(x, y) {
	var i = RAND(0, 3);
	var screensize = Game_screensize();

	if (i % 2 === 0) {
		x = RAND(0, screensize - billwidth);
	} else {
		y = RAND(0, screensize - billheight);
	}

	switch (i) {
		case 0:
			y = -billheight - 16;
			break;
		case 1:
			x = screensize + 1;
			break;
		case 2:
			y = screensize + 1;
			break;
		case 3:
			x = - billwidth - 2;
			break;
	}
}
*/

/* Adds a bill to the in state */
function Bill_enter(bill) {
	var computer;

	bill.state = BILL_STATE_IN;
	get_border_bill(bill);
	bill.index = 0;
	bill.cargo = OS_WINGDOWS;
	bill.x_offset = -2;
	bill.y_offset = -15;
	bill.target_c = RAND(0, Network_num_computers() - 1);
	computer = Network_get_computer(bill.target_c);
	bill.target_x = computer.x + Computer_width() - BILL_OFFSET_X;
	bill.target_y = computer.y + BILL_OFFSET_Y;
	HORDE_COUNTER_ON = Horde_inc_counter(HORDE_COUNTER_ON, 1);
	HORDE_COUNTER_OFF = Horde_inc_counter(HORDE_COUNTER_OFF, -1);
	bill.prev = null;
	bill.next = null;
}

function step_size(level) {
	return Math.min(11 + level, 15);
}

/*  Moves bill toward his target - returns whether or not he moved */
function move(bill, mode) {
	var xdist = bill.target_x - bill.x;
	var ydist = bill.target_y - bill.y;
	var step = step_size(Game_level());
	var dx, dy;
	var signx = xdist >= 0 ? 1 : -1;
	var signy = ydist >= 0 ? 1 : -1;
	xdist = Math.abs(xdist);
	ydist = Math.abs(ydist);
	if (!xdist && !ydist) {
		return 0;
	} else if (xdist < step && ydist < step) {
		bill.x = bill.target_x;
		bill.y = bill.target_y;
	} else {
		dx = (xdist*step*signx)/(xdist+ydist);
		dy = (ydist*step*signy)/(xdist+ydist);
		if (mode === FAST) {
			dx *= 1.25;
			dy *= 1.25;
		}
		bill.dx = dx;
		bill.x += dx;
		bill.y += dy;
	}
	return 1;
}

function draw_std(bill) {
	if (bill.cargo >= 0) {
		OS_draw(bill.cargo, bill.x + bill.x_offset, bill.y + bill.y_offset);
	}
	if (bill.state === BILL_STATE_DYING ) {
		// dcels
		ctx.drawImage(sprites, (bill.index*24)+192, 0, 24, 38, bill.x, bill.y, 24, 38);
	} else if (bill.dx > 0) {
		// rcels
		ctx.drawImage(sprites, (bill.index*24)+96, 0, 24, 38, bill.x, bill.y, 24, 38);
	} else {
		// lcels
		ctx.drawImage(sprites, bill.index*24, 0, 24, 38, bill.x, bill.y, 24, 38);
	}
}

function draw_at(bill) {
	var computer = Network_get_computer(bill.target_c);
	if (bill.index > 6 && bill.index < 12) {
		OS_draw(0, bill.x + bill.sx, bill.y + bill.sy);
	}
	if (bill.cargo >= 0) {
		OS_draw(bill.cargo, bill.x + bill.x_offset,	bill.y + bill.y_offset);
	}
	// acels
	ctx.drawImage(sprites, bill.index*58, 38, 58, 41, computer.x, computer.y, 58, 41);
}

function draw_stray(bill) {
	OS_draw(bill.cargo, bill.x, bill.y);
}

function Bill_draw(bill) {
	switch (bill.state) {
		case BILL_STATE_IN:
		case BILL_STATE_OUT:
		case BILL_STATE_DYING:
			draw_std(bill);
			break;
		case BILL_STATE_AT:
			draw_at(bill);
			break;
		case BILL_STATE_STRAY:
			draw_stray(bill);
			break;
		default:
			break;
	}
}

/*  Update Bill's position */	
function update_in(bill) {
	var moved = move(bill, SLOW);
	var computer = Network_get_computer(bill.target_c);
	if (!moved && computer.os !== OS_WINGDOWS && !computer.busy) {
		computer.busy = 1;
		bill.index = 0;
		bill.state = BILL_STATE_AT;
		return;
	}
	else if (!moved) {
		var i;
		do {
			i = RAND(0, Network_num_computers() - 1);
		} while (i === bill.target_c);
		computer = Network_get_computer(i);
		bill.target_c = i;
		bill.target_x = computer.x + Computer_width() - BILL_OFFSET_X;
		bill.target_y = computer.y + BILL_OFFSET_Y;
	}
	bill.index++;
	bill.index %= WCELS;
	bill.y_offset += (8 * (bill.index % 2) - 4);
}

/*  Update Bill standing at a computer */
function update_at(bill) {
	var computer = Network_get_computer(bill.target_c);
	if (bill.index === 0 && computer.os === OS_OFF) {
		bill.index = 6;
		if (computer.stray === null) {
			bill.cargo = -1;
		} else {
			bill.cargo = computer.stray.cargo;
			Horde_remove_bill(computer.stray);
			computer.stray = null;
		}
	} else {
		bill.index++;
	}
	if (bill.index === 13) {
		bill.y_offset = -15;
		bill.x_offset = -2;
		get_border_target(bill);
		bill.index = 0;
		bill.state = BILL_STATE_OUT;
		computer.busy = 0;
		return;
	}
	bill.y_offset = billheight - OS_height();
	switch (bill.index) {
	case 1: 
	case 2:
		bill.x -= 8;
		bill.x_offset +=8;
		break;
	case 3:
		bill.x -= 10;
		bill.x_offset +=10;
		break;
	case 4:
		bill.x += 3;
		bill.x_offset -=3;
		break;
	case 5:
		bill.x += 2;
		bill.x_offset -=2;
		break;
	case 6:
		if (computer.os !== OS_OFF) {
			Network_inc_counter(NETWORK_COUNTER_BASE, -1);
			Network_inc_counter(NETWORK_COUNTER_OFF, 1);
			bill.cargo = computer.os;
		}
		else {
			bill.x -= 21;
			bill.x_offset += 21;
		}
		computer.os = OS_OFF;
		bill.y_offset = -15;
		bill.x += 20;
		bill.x_offset -=20;
		break;
	case 7:
		bill.sy = bill.y_offset;
		bill.sx = -2;
		break;
	case 8:
		bill.sy = -15;
		bill.sx = -2;
		break;
	case 9:
		bill.sy = -7;
		bill.sx = -7;
		bill.x -= 8;
		bill.x_offset +=8;
		break;	
	case 10:
		bill.sy = 0;
		bill.sx = -7;
		bill.x -= 15;
		bill.x_offset +=15;
		break;
	case 11:
		bill.sy = 0;
		bill.sx = -7;
		computer.os = OS_WINGDOWS;
		Network_inc_counter(NETWORK_COUNTER_OFF, -1);
		Network_inc_counter(NETWORK_COUNTER_WIN, 1);
		break;
	case 12:
		bill.x += 11;
		bill.x_offset -=11;
	}
}

/* Updates Bill fleeing with his ill gotten gain */
function update_out(bill) {
	var screensize = Game_screensize();
	if (UI_intersect(bill.x, bill.y, billwidth, billheight, 0, 0, screensize, screensize)) {
		move(bill, FAST);
		bill.index++;
		bill.index %= WCELS;
		bill.y_offset += (8*(bill.index%2)-4); 
	} else {
		Horde_remove_bill(bill);
		HORDE_COUNTER_ON = Horde_inc_counter(HORDE_COUNTER_ON, -1);
		HORDE_COUNTER_OFF = Horde_inc_counter(HORDE_COUNTER_OFF, 1);
	}
}


/* Updates a Bill who is dying */
function update_dying(bill) {
	if (bill.index < DCELS - 1) {
		bill.y_offset += (bill.index * GRAVITY);
		bill.index++;	
	} else {
		bill.y += bill.y_offset;
		if (bill.cargo < 0 || bill.cargo === OS_WINGDOWS) {
			Horde_remove_bill(bill);
		} else {
			Horde_move_bill(bill);
			bill.state = BILL_STATE_STRAY;
		}
		HORDE_COUNTER_ON = Horde_inc_counter(HORDE_COUNTER_ON, -1);
	}
}

function Bill_update(bill) {
	switch (bill.state) {
		case BILL_STATE_IN:
			update_in(bill);
			break;
		case BILL_STATE_AT:
			update_at(bill);
			break;
		case BILL_STATE_OUT:
			update_out(bill);
			break;
		case BILL_STATE_DYING:
			update_dying(bill);
			break;
		default:
			break;
	}
}

function Bill_set_dying(bill) {
	bill.index = -1;
	bill.x_offset = -2;
	bill.y_offset = -15;
	bill.state = BILL_STATE_DYING;
}

function Bill_clicked(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + billwidth && locy > bill.y && locy < bill.y + billheight);
}

function Bill_clickedstray(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + OS_width() && locy > bill.y && locy < bill.y + OS_height());
}

function Bill_load_pix () {
	billwidth = 24;
	billheight = 38;
}

function Bill_width() {
	return billwidth;
}

function Bill_height() {
	return billheight;
}

function Bill_get_state(bill) {
	return bill.state;
}

/*
 * Computer
 */
 
function computer() {
	this.type = 0;		/* CPU type */
	this.os = 0;	/* current OS */  // 0 is wingdows, -1 means off, anything else means other OS
	this.x = 0;
	this.y = 0;		/* location */
	this.busy = 0;	/* is the computer being used? */  // 1 is computer already targeted by a Bill, 0 is free to be targeted
	this.stray = 0;
};

function determineOS(computer) {
	if (computer.type < MIN_PC) {
		return computer.type;
	} else {
		return OS_randpc();
	}
}

function Computer_setup(computer, index) {
	var j, counter = 0, flag;
	var x, y;
	var screensize = Game_screensize();
	var border = BORDER(screensize);
	do {
		if (++counter > 4000) {
			return 0;
		}
		x = RAND(border, screensize - border - compwidth);
		y = RAND(border, screensize - border - compheight);
		flag = 1;
		/* check for conflicting computer placement */
		for (j = 0; j < index && flag; j++) {
			var c = Network_get_computer(j);
			var twidth = compwidth - BILL_OFFSET_X + Bill_width();
			if (UI_intersect(x, y, twidth, compheight, c.x, c.y, twidth, compheight)) {
				flag = 0;
			}
		}
	} while (!flag);
	computer.x = x;
	computer.y = y;
	computer.type = RAND(1, NUM_SYS - 1);
	computer.os = determineOS(computer);
	computer.busy = 0;
	computer.stray = null;
	return 1;
}

function Computer_on(computer, locx, locy) {
	return (Math.abs(locx - computer.x) < compwidth && Math.abs(locy - computer.y) < compheight);
}

function Computer_compatible(computer, system) {
	return (computer.type === system || (computer.type >= MIN_PC && OS_ispc(system)));
}

function Computer_draw(computer) {
	ctx.drawImage(sprites, computer.type*55, 79, 55, 45, computer.x, computer.y, 55, 45);
	if (computer.os !== OS_OFF) {
		ctx.drawImage(sprites, computer.os*28, 124, 28, 24, computer.x + OS_OFFSET, computer.y + OS_OFFSET, 28, 24);
	}
}

function Computer_width() {
	return compwidth;
}

function Computer_height() {
	return compheight;
}

/*
 * Spark
 */
 
function SPARK_DELAY(level) {
	return (Math.max(20 - (level), 0));
}

function Spark_width() {
	return 20;
}

function Spark_height() {
	return 20;
}

function Spark_draw(x, y, index) {
	ctx.drawImage(sprites, (index*20)+358, 124, 20, 20, x, y, 20, 20);
}

/*
 * Cable
 */
 
function Cable() {
	this.c1;
	this.c2;		/* computers connected */
	this.x1;
	this.y1;
	this.x2;
	this.y2;	/* endpoints of line representing cable */
	this.x;
	this.y;		/* current location of spark */
	this.fx;
	this.fy;		/* needed for line drawing */
	this.delay;		/* how much time until spark leaves */
	this.active;		/* is spark moving and from which end */
	this.index;
};

function reverse(cable) {
	var _t;
	_t = cable.c1;
	cable.c1 = cable.c2;
	cable.c2 = _t;
	_t = cable.x1;
	cable.x1 = cable.x2;
	cable.x2 = _t;
	_t = cable.y1;
	cable.y1 = cable.y2;
	cable.y2 = _t;
}

function Cable_setup(cable) {
	var comp1, comp2;
	var cwidth, cheight;

	cable.c1 = RAND(0, Network_num_computers() - 1);
	do {
		cable.c2 = RAND(0, Network_num_computers() - 1);
	} while (cable.c2 === cable.c1);
	cable.active = 0;
	cable.index = 0;
	cable.delay = SPARK_DELAY(Game_level());

	comp1 = Network_get_computer(cable.c1);
	comp2 = Network_get_computer(cable.c2);
	cwidth = Computer_width();
	cheight = Computer_height();
	cable.x1 = Math.round(comp1.x + cwidth/3);
	cable.x2 = Math.round(comp2.x + cwidth/3);
	cable.y1 = Math.round(comp1.y + cheight/2);
	cable.y2 = Math.round(comp2.y + cheight/2);
}

function Cable_draw(cable) {
	UI_draw_line(cable.x1, cable.y1, cable.x2, cable.y2);
	if (cable.active) {
		var rx = cable.x - Spark_width()/2;
		var ry = cable.y - Spark_height()/2;
		Spark_draw(rx, ry, cable.index);
	}
}

function Cable_update(cable) {
	var comp1, comp2;
	comp1 = Network_get_computer(cable.c1);
	comp2 = Network_get_computer(cable.c2);

	if (cable.active) {
		if ((comp1.os === OS_WINGDOWS) === (comp2.os === OS_WINGDOWS)) {
			cable.active = 0;
		} else if (comp1.os === OS_WINGDOWS || comp2.os === OS_WINGDOWS) {
			var xdist, ydist;
			var sx, sy;

			if (comp2.os === OS_WINGDOWS) {
				reverse(cable);
			}

			xdist = cable.x2 - cable.x;
			ydist = cable.y2 - cable.y;

			sx = xdist >= 0 ? 1.0 : -1.0;
			sy = ydist >= 0 ? 1.0 : -1.0;
			xdist = Math.abs(xdist);
			ydist = Math.abs(ydist);
			if (xdist === 0 && ydist === 0) {
				if (!comp2.busy) {
					var counter;
					if (comp2.os === OS_OFF) {
						counter = NETWORK_COUNTER_OFF;
					} else {
						counter = NETWORK_COUNTER_BASE;
					}
					Network_inc_counter(counter, -1);
					Network_inc_counter(NETWORK_COUNTER_WIN,
							    1);
					comp2.os = OS_WINGDOWS;
				}
				cable.active = 0;
			} else if (Math.max(xdist, ydist) < SPARK_SPEED) {
				cable.x = cable.x2;
				cable.y = cable.y2;
			} else {
				cable.fx+=(xdist*SPARK_SPEED*sx)/(xdist+ydist);
				cable.fy+=(ydist*SPARK_SPEED*sy)/(xdist+ydist);
				cable.x = cable.fx;
				cable.y = cable.fy;
			}
			cable.index = 1 - cable.index;
		}
	} else {
		if ((comp1.os === OS_WINGDOWS) === (comp2.os === OS_WINGDOWS)) {
			;
		} else if (comp1.os === OS_WINGDOWS || comp2.os === OS_WINGDOWS) {
			cable.active = 1;
			cable.delay = SPARK_DELAY(Game_level());
			if (comp2.os === OS_WINGDOWS) {
				reverse(cable);
			}
			cable.x = cable.x1;
			cable.fx = cable.x1;
			cable.y = cable.y1;
			cable.fy = cable.y1;
		}
	}
}

function Cable_onspark(cable, locx, locy) {
	if (!cable.active) {
		return 0;
	}
	return (Math.abs(locx - cable.x) < Spark_width() && Math.abs(locy - cable.y) < Spark_height());
}

function Cable_reset(cable) {
	cable.active = 0;
	cable.delay = SPARK_DELAY(Game_level());
}

/*
 * Bucket
 */
 
function Bucket_clicked(x, y) {
	return (x > 0 && x < bucketwidth && y > 0 && y < bucketheight);
}

function Bucket_draw() {
	if (!bucketgrabbed) {
		ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
	} else {
		ctx.drawImage(sprites, 336, 124, 24, 24, mousex-12, mousey-12, 24, 24);
	}
}

function Bucket_grab(x, y) {
	bucketgrabbed = 1;
}

function Bucket_release(x, y) {
	var i;
	for (i = 0; i < Network_num_cables(); i++) {
		var cable = Network_get_cable(i);
		if (Cable_onspark(cable, x, y)) {
			Cable_reset(cable);
		}
	}
	bucketgrabbed = 0;
}

/*
 * OS
 */
 
function OS_draw(index, x, y) {
	ctx.drawImage(sprites, index*28, 124, 28, 24, x, y, 28, 24);
}

function OS_width() {
	return oswidth;
}

function OS_height() {
	return osheight;
}

function OS_draw_cursor() {
	if(grabbed) {
		ctx.drawImage(sprites, grabbedos*28, 124, 24, 24, mousex-14, mousey-12, 28, 24);
	}
}

function OS_set_cursor(index) {
	grabbedos = index;
}

function OS_randpc() {
	return (RAND(MIN_PC, NUM_OS - 1));
}

function OS_ispc(index) {
	return (index >= MIN_PC);
}

/*
 * Network
 */

function Network_on(level) {
	var normal = Math.min(8 + level, STD_MAX_COMPUTERS);
	return (normal * Game_scale(2));
}

/* sets up network for each level */
function Network_setup() {
	var i;	
	ncomputers = Network_on(Game_level());
	if (computers !== null) {
		computers.length = 0;
	}
	if (cables !== null) {
		cables.length = 0;
	}
	for (i = 0; i < ncomputers; i++) {
		computers[i] = new computer();
		if (!Computer_setup(computers[i], i)) {
			ncomputers = i - 1;
			break;
		}
	}
	counters[NETWORK_COUNTER_OFF] = 0;
	counters[NETWORK_COUNTER_BASE] = ncomputers;
	counters[NETWORK_COUNTER_WIN] = 0;
	ncables = Math.min(Game_level(), ncomputers/2);
	for (i = 0; i < ncables; i++) {
		cables[i] = new Cable();
		Cable_setup(cables[i]);
	}
}

/* redraws the computers at their location with the proper image */
function Network_draw () {
	var i;
	for (i = 0; i < ncables; i++) {
		Cable_draw(cables[i]);
	}
	for (i = 0; i < ncomputers; i++) {
		Computer_draw(computers[i]);
	}
}

function Network_update () {
	var i;
	for (i = 0; i < ncables; i++) {
		Cable_update(cables[i]);
	}
}

function Network_toasters () {
	var i;
	for (i = 0; i < ncomputers; i++) {
		computers[i].type = COMPUTER_TOASTER;
		computers[i].os = OS_OFF;
	}
	ncables = 0;
}

function Network_get_computer(index) {
	return computers[index];
}

function Network_num_computers() {
	return ncomputers;
}

function Network_get_cable(index) {
	return cables[index];
}

function Network_num_cables() {
	return ncables;
}

function Network_clear_stray(bill) {
	var i;
	for (i = 0; i < ncomputers; i++) {
		if (computers[i].stray === bill) {
			computers[i].stray = null;
		}
	}
}

function Network_inc_counter(counter, val) {
	counters[counter] += val;
}

function Network_get_counter(counter) {
	return counters[counter];
}

/*
 * Horde
 */
 
function UNLINK(bill, list) {
	if (bill.next !== null) {
		bill.next.prev = bill.prev;
	}
	if (bill.prev !== null) {
		bill.prev.next = bill.next;
	} else if (bill === list) {
		list = bill.next;
	}
	bill.prev = null;
	bill.next = null;
	return list;
}

function PREPEND(bill, list) {
	bill.next = list;
	if (list !== null) {
		list.prev = bill;
	}
	list = bill;
	return list;
}

function Horde_on(lev) {
	var perlevel = ((8 + 3 * lev) * Game_scale(2));
	return Math.min(perlevel, MAX_BILLS);
}

function max_at_once(lev) {
	return Math.round(Math.min(2 + lev / 4, 12));
}

function between(lev) {
	return Math.round(Math.max(14 - lev / 3, 10));
}

/*  Launches Bills whenever called  */
function launch(max) {
	var bill;
	var n;
	var off_screen = HORDE_COUNTER_OFF;

	if (max === 0 || off_screen === 0) {
		return;
	}
	n = RAND(1, Math.min(max, off_screen));
	for (; n > 0; n--) {
		bill = new Bill();
		Bill_enter(bill);
		alive = PREPEND(bill, alive);
	}
}

function Horde_setup() {
	var bill;
	while (alive !== null) {
		bill = alive;
		alive = UNLINK(bill, alive);
		bill = null;
	}
	while (strays !== null) {
		bill = strays;
		strays = UNLINK(bill, strays);
		bill = null;
	}
	HORDE_COUNTER_OFF = Horde_on(Game_level());
	HORDE_COUNTER_ON = 0;
}

function Horde_update(iteration) {
	var bill, next;
	var level = Game_level();
	if (iteration % between(level) === 0) {
		launch(max_at_once(level));
	}
	for (bill = alive; bill !== null; bill = next) {
		next = bill.next;
		Bill_update(bill);
	}
}

function Horde_draw() {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		Bill_draw(bill);
	}
	for (bill = alive; bill !== null; bill = bill.next) {
		Bill_draw(bill);
	}
}

function Horde_move_bill(bill) {
	alive = UNLINK(bill, alive);
	strays = PREPEND(bill, strays);
}

function Horde_remove_bill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = UNLINK(bill, strays);
	} else {
		alive = UNLINK(bill, alive);
	}
	Network_clear_stray(bill);
}

function Horde_add_bill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = PREPEND(bill, strays);
	} else {
		alive = PREPEND(bill, alive);
	}
}

function Horde_clicked_stray(x, y) {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		if (!Bill_clickedstray(bill, x, y)) {
			continue;
		}	
		strays = UNLINK(bill, strays);
		return bill;
	}
	return null;
}

function Horde_process_click(x, y) {
	var bill;
	var counter = 0;

	for (bill = alive; bill !== null; bill = bill.next) {
		if (bill.state === BILL_STATE_DYING || !Bill_clicked(bill, x, y)) {
			continue;
		}
		if (bill.state === BILL_STATE_AT) {
			var comp;
			comp = Network_get_computer(bill.target_c);
			comp.busy = 0;
			comp.stray = bill;
		}
		Bill_set_dying(bill);
		counter++;
	}
	return counter;
}

function Horde_inc_counter(counter, val) {
	counter += val;
	return counter;
}

function Horde_get_counter(counter) {
	return counter;
}


/*
 * Game
 */

function setup_level(newlevel) {
	level = newlevel;
	Horde_setup();
	grabbed = null;
	Network_setup();
	iteration = 0;
	efficiency = 0;
}

function Game_start(newlevel) {
	state = STATE_PLAYING;
	score = 0;
	UI_restart_timer();
	UI_set_pausebutton(1);
	setup_level(newlevel);
}

function Game_stop() {
	if (paused === 0) {
		UI_kill_timer();
		UI_set_pausebutton(0);
		paused = 1;
	} else {
		UI_restart_timer();
		UI_set_pausebutton(1);
		paused = 0;
	}
}

function update_info() {
	var on_screen = Horde_get_counter(HORDE_COUNTER_ON);
	var off_screen = Horde_get_counter(HORDE_COUNTER_OFF);
	var base = Network_get_counter(NETWORK_COUNTER_BASE);
	var off = Network_get_counter(NETWORK_COUNTER_OFF);
	var win = Network_get_counter(NETWORK_COUNTER_WIN);
	var units = Network_num_computers();
	var str = "Bill:"+on_screen+"/"+off_screen+"  System:"+base+"/"+off+"/"+win+"  Level:"+level+"  Score:"+Math.floor(score);
	ctx.fillText(str, 0, SCREENSIZE);
	efficiency += ((100 * base - 10 * win) / units);
}

function Game_warp_to_level() {
	var lev = prompt("Warp to level?", "1");
	if (state === STATE_PLAYING) {
		if (lev <= level) {
			return;
		}
		setup_level(lev);
	}
	else {
		if (lev <= 0) {
			return;
		}
		Game_start(lev);
	}
}

function Game_add_high_score(str) {
	Scorelist_recalc(str, level, score);
}

function Mouse_moved(event) {
	mousex = event.pageX - canvas.offsetLeft;
	mousey = event.pageY - canvas.offsetTop;
}

function Mouse_button_press(event) {
	var counter;
	
	if (state !== STATE_PLAYING || paused === 1)
		return;

	if (Bucket_clicked(mousex, mousey)) {
		Bucket_grab(mousex, mousey);
		return;
	}

	grabbed = Horde_clicked_stray(mousex, mousey);
	if (grabbed !== null) {
		OS_set_cursor(grabbed.cargo);
		return;
	}

	counter = Horde_process_click(mousex, mousey);
	score += (counter * counter * SCORE_BILLPOINTS);
}

function Mouse_button_release(event) {
	var i;

	if (state !== STATE_PLAYING || paused === 1) {
		return;
	}

	if (grabbed === null) {
		Bucket_release(mousex, mousey);
		return;
	}

	for (i = 0; i < Network_num_computers(); i++) {
		var computer = Network_get_computer(i);

		if (Computer_on(computer, mousex, mousey) &&
		    Computer_compatible(computer, grabbed.cargo) &&
		    (computer.os === OS_WINGDOWS || computer.os === OS_OFF)) {
			var counter;

			Network_inc_counter(NETWORK_COUNTER_BASE, 1);
			if (computer.os === OS_WINGDOWS) {
				counter = NETWORK_COUNTER_WIN;
			} else {
				counter = NETWORK_COUNTER_OFF;
			}
			Network_inc_counter(counter, -1);
			computer.os = grabbed.cargo;
			Horde_remove_bill(grabbed);
			grabbed = null;
			return;
		}
	}
	Horde_add_bill(grabbed);
	grabbed = null;
}

function Game_update() {
	var str;

	switch (state) {
	case STATE_PLAYING:
		ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
		Bucket_draw();
		Network_update();
		Network_draw();
		Horde_update(iteration);
		Horde_draw();
		UI_draw_cursor();
		OS_draw_cursor();
		update_info();
		if (Horde_get_counter(HORDE_COUNTER_ON) + Horde_get_counter(HORDE_COUNTER_OFF) === 0) {
			score += (level * efficiency / iteration);
			state = STATE_BETWEEN;
		}
		if ((Network_get_counter(NETWORK_COUNTER_BASE) + Network_get_counter(NETWORK_COUNTER_OFF)) <= 1) {
			state = STATE_END;
		}
		break;
	case STATE_END:
		ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
		Network_toasters();
		Network_draw();
		if (Scorelist_ishighscore(score)) {
			var name = prompt("You earned a high score.\nEnter your name:");
			if (name === null) {
				name = "Anonymous";
			}
			Game_add_high_score(name);
			Scorelist_update();
			Scorelist_write();
		}
		UI_kill_timer();
		UI_set_pausebutton(0);
		state = STATE_WAITING;
		Scorelist_write();
		break;
	case STATE_BETWEEN:
		alert("After Level  "+level+"\nScore: "+Math.floor(score));
		state = STATE_PLAYING;
		setup_level(++level);
		break;
	}
	iteration++;
}

function Game_score() {
	return score;
}

function Game_level() {
	return level;
}

function Game_screensize() {
	return screensize;
}

function Game_scale(dimensions) {
	var scale = screensize / SCREENSIZE;
	var d = 1;
	for ( ; dimensions > 0; dimensions--) {
		d *= scale;
	}
	return (d);
}

function main() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	ctx.font = "bold 12px sans-serif";
	$("canvas").unbind();

	$("canvas").bind('mousemove', function(event) {
		Mouse_moved(event);
	});

	$("canvas").bind('touchstart', function(event) {
    	event.preventDefault();
	});

	$("canvas").bind('mousedown touchstart', function(event) {
		event.preventDefault();
		Mouse_button_press(event);
	});
	
	$("canvas").bind('mouseup touchend', function(event) {
		event.preventDefault();
		Mouse_button_release(event);
	});
	
	ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);

	Scorelist_read();
	Scorelist_update();

	UI_load_pix();
	Bill_load_pix();

	state = STATE_WAITING;
	if (level) {
		Game_start(level);
	} else {
		UI_set_pausebutton(0);
	}
}
