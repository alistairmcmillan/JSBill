"use strict";

var mousex = 0;
var mousey = 0;

var ctx;

/* Game states */
var STATE_PLAYING = 1;
var STATE_BETWEEN = 2;
var STATE_END = 3;
var STATE_WAITING = 4;

/* Score related constants */
var SCORE_BILLPOINTS = 5;

var gamestate;
var efficiency;
var score, level, iteration;
var downcursor;
var grabbed;
var screensize = 400;
var paused = 0;

var timer = 0;
var sprites;
var grabbedos;

var NUMSCORES = 0;

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

var billwidth, billheight;

var OS_OFFSET = 4;			/* offset of screen from 0,0 */
var COMPUTER_TOASTER = 0;	/* computer 0 is a toaster */

var MIN_PC = 6;		/* type >= MIN_PC means the computer is a PC */

var cpuname = ["toaster", "maccpu", "nextcpu", "sgicpu", "suncpu", "palmcpu", "os2cpu", "bsdcpu"];

var NUM_SYS = cpuname.length;

var compwidth = 55;
var compheight = 45;

var SPARK_SPEED = 4;

var bucketgrabbed = 0;
var bucketwidth = 24;
var bucketheight = 24;

var OS_WINGDOWS = 0;
var OS_OFF = -1;
var oswidth = 28;
var osheight = 24;

var osname = ["wingdows", "apple", "next", "sgi", "sun", "palm", "os2", "bsd", "linux", "redhat", "hurd", "beos"];
var NUM_OS = osname.length;

var NETWORK_COUNTER_OFF = 0;
var NETWORK_COUNTER_BASE = 1;
var NETWORK_COUNTER_WIN = 2;

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

function ui_restart_timer() {
	if (timer === 0) {
		timer = setInterval(timer_tick, 200);
	}
}

function timer_tick() {
	ui_restart_timer();
	game_update();
	return true;
}

function ui_kill_timer() {
	if (timer !== 0) {
		clearInterval(timer);
	}
	timer = 0;
}

/*
 * Graphics routines
 */

function bucket_draw() {
	if (!bucketgrabbed) {
		ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
	} else {
		ctx.drawImage(sprites, 336, 124, 24, 24, mousex - 12, mousey - 12, 24, 24);
	}
}

function ui_draw_line(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

/*
 * Other routines
 */

function ui_set_pausebutton(action) {
	if (action === 1) {
		document.getElementById('pauseHref').disabled = false;
		document.getElementById('pauseHref').textContent = 'Pause Game';
	} else {
		document.getElementById('pauseHref').textContent = 'Resume Game';
	}
}

function ui_intersect(x1, y1, w1, h1, x2, y2, w2, h2) {
	return ((Math.abs(x2 - x1 + (w2 - w1) / 2) < (w1 + w2) / 2) && (Math.abs(y2 - y1 + (h2 - h1) / 2) < (h1 + h2) / 2));
}

function ui_load_pix() {
	sprites = new Image();
	sprites.src = 'images/sprites.png';
}

/*
 * Story
 */
function story_show() {
	if(document.getElementById('storydiv').style.display === "none") {
		document.getElementById('storydiv').style.display = "block";
	} else {
		document.getElementById('storydiv').style.display = "none";
	}
}

function story_hide() {
	document.getElementById('storydiv').style.display = "none";
}

/*
 * Scorelist
 */

var scores = new Array([]);

function scorelist_show() {
	if(document.getElementById('scorediv').style.display === "none") {
		document.getElementById('scorediv').style.display = "block";
	} else {
		document.getElementById('scorediv').style.display = "none";
	}
}

function scorelist_hide() {
	document.getElementById('scorediv').style.display = "none";
}

function scorelist_read() {
    $.ajax({
		url: 'get_scores.php', data: "", dataType: 'json',  success: function(rows)
		{
			$('table#scoretable tbody tr').remove();
			for(var i = 0; i < rows.length; i++) {
				var t = rows[i].date.split(/[- :]/);
				var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
				scores.push({"score": rows[i].score, "level": rows[i].level, "name": rows[i].name, "date": rows[i].date });
				NUMSCORES++;
				$('table#scoretable tbody').append('<tr><td>' + rows[i].name + '</td><td>' + rows[i].level + '</td><td>' + rows[i].score + '</td><td>' + ( d.getHours() < 10 ? "0" : "" ) + d.getHours() + ':' + ( d.getMinutes() < 10 ? "0" : "" ) + d.getMinutes() + ' ' + ( d.getDate() < 10 ? "0" : "" ) + d.getDate() + '/' + ( (d.getMonth()+1) < 10 ? "0" : "" ) + (d.getMonth()+1) + '/' + d.getFullYear() + '</td></tr>');
			}
			scores.shift();
			NUMSCORES = scores.length;
			console.log(NUMSCORES);
			console.log(scores);
		}
	});
}

/*  Add new high score to list   */
function scorelist_recalc(str, level, score) {
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
	$.ajax({
		url: 'save_score.php', data: { level: level, name: tname, score: Math.floor(score), date: Date.now() }, dataType: 'json',  success: function(rows)
		{
			// Update copy of scores since we've just added one
			scorelist_read();
		}
	});
}

function scorelist_ishighscore(val) {
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
}

function get_border_bill(bill) {
	var i;

	i = RAND(0, 3);

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
	var i;

	i = RAND(0, 3);

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
		bill.target_x = -billwidth - 2;
		break;
	}
}

function os_draw(index, x, y) {
	ctx.drawImage(sprites, index * 28, 124, 28, 24, x, y, 28, 24);
}

function horde_inc_counter(counter, val) {
	counter += val;
	return counter;
}

function horde_get_counter(counter) {
	return counter;
}

function network_inc_counter(counter, val) {
	counters[counter] += val;
}

function game_scale(dimensions) {
	var scale, d;

	scale = 1;
	d = 1;
	for (dimensions; dimensions > 0; dimensions--) {
		d *= scale;
	}
	return (d);
}

function os_ispc(index) {
	return (index >= MIN_PC);
}

/* Adds a bill to the in state */
function bill_enter(bill) {
	var computer;

	bill.state = BILL_STATE_IN;
	get_border_bill(bill);
	bill.index = 0;
	bill.cargo = OS_WINGDOWS;
	bill.x_offset = -2;
	bill.y_offset = -15;
	bill.target_c = RAND(0, ncomputers - 1);
	computer = computers[bill.target_c];
	bill.target_x = computer.x + compwidth - BILL_OFFSET_X;
	bill.target_y = computer.y + BILL_OFFSET_Y;
	HORDE_COUNTER_ON = horde_inc_counter(HORDE_COUNTER_ON, 1);
	HORDE_COUNTER_OFF = horde_inc_counter(HORDE_COUNTER_OFF, -1);
	bill.prev = null;
	bill.next = null;
}

function step_size(level) {
	return Math.min(11 + level, 15);
}

/*  Moves bill toward his target - returns whether or not he moved */
function bill_move(bill, mode) {
	var xdist, ydist, step, dx, dy, signx, signy;

	xdist = bill.target_x - bill.x;
	ydist = bill.target_y - bill.y;
	step = step_size(level);
	signx = xdist >= 0 ? 1 : -1;
	signy = ydist >= 0 ? 1 : -1;

	xdist = Math.abs(xdist);
	ydist = Math.abs(ydist);

	if (!xdist && !ydist) {
		return 0;
	} else if (xdist < step && ydist < step) {
		bill.x = bill.target_x;
		bill.y = bill.target_y;
	} else {
		dx = (xdist * step * signx) / (xdist + ydist);
		dy = (ydist * step * signy) / (xdist + ydist);
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
		os_draw(bill.cargo, bill.x + bill.x_offset, bill.y + bill.y_offset);
	}
	if (bill.state === BILL_STATE_DYING) {
		// dcels
		ctx.drawImage(sprites, (bill.index * 24) + 192, 0, 24, 38, bill.x, bill.y, 24, 38);
	} else if (bill.dx > 0) {
		// rcels
		ctx.drawImage(sprites, (bill.index * 24) + 96, 0, 24, 38, bill.x, bill.y, 24, 38);
	} else {
		// lcels
		ctx.drawImage(sprites, bill.index * 24, 0, 24, 38, bill.x, bill.y, 24, 38);
	}
}

function draw_at(bill) {
	var computer;

	computer = computers[bill.target_c];
	if (bill.index > 6 && bill.index < 12) {
		os_draw(0, bill.x + bill.sx, bill.y + bill.sy);
	}
	if (bill.cargo >= 0) {
		os_draw(bill.cargo, bill.x + bill.x_offset,	bill.y + bill.y_offset);
	}
	// acels
	ctx.drawImage(sprites, bill.index * 58, 38, 58, 41, computer.x, computer.y, 58, 41);
}

function draw_stray(bill) {
	os_draw(bill.cargo, bill.x, bill.y);
}

function bill_draw(bill) {
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

/* Update Bill's position */
function update_in(bill) {
	var moved, computer, i;

	moved = bill_move(bill, SLOW);
	computer = computers[bill.target_c];
	if (!moved && computer.os !== OS_WINGDOWS && !computer.busy) {
		computer.busy = 1;
		bill.index = 0;
		bill.state = BILL_STATE_AT;
		return;
	} else if (!moved) {
		do {
			i = RAND(0, ncomputers - 1);
		} while (i === bill.target_c);
		computer = computers[i];
		bill.target_c = i;
		bill.target_x = computer.x + compwidth - BILL_OFFSET_X;
		bill.target_y = computer.y + BILL_OFFSET_Y;
	}
	bill.index+=1;
	bill.index %= WCELS;
	bill.y_offset += (8 * (bill.index % 2) - 4);
}

function network_clear_stray(bill) {
	var i;
	for (i = 0; i < ncomputers; i+=1) {
		if (computers[i].stray === bill) {
			computers[i].stray = null;
		}
	}
}

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

function horde_remove_bill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = UNLINK(bill, strays);
	} else {
		alive = UNLINK(bill, alive);
	}
	network_clear_stray(bill);
}

function os_height() {
	return osheight;
}

/*  Update Bill standing at a computer */
function update_at(bill) {
	var computer;
	computer = computers[bill.target_c];
	if (bill.index === 0 && computer.os === OS_OFF) {
		bill.index = 6;
		if (computer.stray === null) {
			bill.cargo = -1;
		} else {
			bill.cargo = computer.stray.cargo;
			horde_remove_bill(computer.stray);
			computer.stray = null;
		}
	} else {
		bill.index+=1;
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
	bill.y_offset = billheight - os_height();
	switch (bill.index) {
	case 1:
	case 2:
		bill.x -= 8;
		bill.x_offset += 8;
		break;
	case 3:
		bill.x -= 10;
		bill.x_offset += 10;
		break;
	case 4:
		bill.x += 3;
		bill.x_offset -= 3;
		break;
	case 5:
		bill.x += 2;
		bill.x_offset -= 2;
		break;
	case 6:
		if (computer.os !== OS_OFF) {
			network_inc_counter(NETWORK_COUNTER_BASE, -1);
			network_inc_counter(NETWORK_COUNTER_OFF, 1);
			bill.cargo = computer.os;
		} else {
			bill.x -= 21;
			bill.x_offset += 21;
		}
		computer.os = OS_OFF;
		bill.y_offset = -15;
		bill.x += 20;
		bill.x_offset -= 20;
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
		bill.x_offset += 8;
		break;
	case 10:
		bill.sy = 0;
		bill.sx = -7;
		bill.x -= 15;
		bill.x_offset += 15;
		break;
	case 11:
		bill.sy = 0;
		bill.sx = -7;
		computer.os = OS_WINGDOWS;
		network_inc_counter(NETWORK_COUNTER_OFF, -1);
		network_inc_counter(NETWORK_COUNTER_WIN, 1);
		break;
	case 12:
		bill.x += 11;
		bill.x_offset -= 11;
		break;
	}
}

/* Updates Bill fleeing with his ill gotten gain */
function update_out(bill) {
	if (ui_intersect(bill.x, bill.y, billwidth, billheight, 0, 0, screensize, screensize)) {
		bill_move(bill, FAST);
		bill.index+=1;
		bill.index %= WCELS;
		bill.y_offset += (8 * (bill.index % 2) - 4);
	} else {
		horde_remove_bill(bill);
		HORDE_COUNTER_ON = horde_inc_counter(HORDE_COUNTER_ON, -1);
		HORDE_COUNTER_OFF = horde_inc_counter(HORDE_COUNTER_OFF, 1);
	}
}

function PREPEND(bill, list) {
	bill.next = list;
	if (list !== null) {
		list.prev = bill;
	}
	list = bill;
	return list;
}

function horde_move_bill(bill) {
	alive = UNLINK(bill, alive);
	strays = PREPEND(bill, strays);
}

/* Updates a Bill who is dying */
function update_dying(bill) {
	if (bill.index < DCELS - 1) {
		bill.y_offset += (bill.index * GRAVITY);
		bill.index+=1;
	} else {
		bill.y += bill.y_offset;
		if (bill.cargo < 0 || bill.cargo === OS_WINGDOWS) {
			horde_remove_bill(bill);
		} else {
			horde_move_bill(bill);
			bill.state = BILL_STATE_STRAY;
		}
		HORDE_COUNTER_ON = horde_inc_counter(HORDE_COUNTER_ON, -1);
	}
}

function bill_update(bill) {
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

function bill_set_dying(bill) {
	bill.index = -1;
	bill.x_offset = -2;
	bill.y_offset = -15;
	bill.state = BILL_STATE_DYING;
}

function bill_clicked(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + billwidth && locy > bill.y && locy < bill.y + billheight);
}

function os_width() {
	return oswidth;
}

function bill_clickedstray(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + os_width() && locy > bill.y && locy < bill.y + os_height());
}

function bill_load_pix() {
	billwidth = 24;
	billheight = 38;
}

function bill_width() {
	return billwidth;
}

/*
 * Computer
 */

function Computer() {
	this.type = 0;		/* CPU type */
	this.os = 0;	/* current OS */  // 0 is wingdows, -1 means off, anything else means other OS
	this.x = 0;
	this.y = 0;		/* location */
	this.busy = 0;	/* is the computer being used? */  // 1 is computer already targeted by a Bill, 0 is free to be targeted
	this.stray = 0;
}

function os_randpc() {
	return (RAND(MIN_PC, NUM_OS - 1));
}

function determineOS(computer) {
	if (computer.type < MIN_PC) {
		return computer.type;
	} else {
		return os_randpc();
	}
}

function computer_setup(computer, index) {
	var j, counter, flag, x, y, border, c, twidth;

	counter = 0;
	border = BORDER(screensize);
	do {
		if (++counter > 4000) {
			return 0;
		}
		x = RAND(border, screensize - border - compwidth);
		y = RAND(border, screensize - border - compheight);
		flag = 1;
		/* check for conflicting computer placement */
		for (j = 0; j < index && flag; j+=1) {
			c = computers[j];
			twidth = compwidth - BILL_OFFSET_X + bill_width();
			if (ui_intersect(x, y, twidth, compheight, c.x, c.y, twidth, compheight)) {
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

function computer_on(computer, locx, locy) {
	return (Math.abs(locx - computer.x) < compwidth && Math.abs(locy - computer.y) < compheight);
}

function computer_compatible(computer, system) {
	return (computer.type === system || (computer.type >= MIN_PC && os_ispc(system)));
}

function computer_draw(computer) {
	ctx.drawImage(sprites, computer.type * 55, 79, 55, 45, computer.x, computer.y, 55, 45);
	if (computer.os !== OS_OFF) {
		ctx.drawImage(sprites, computer.os * 28, 124, 28, 24, computer.x + OS_OFFSET, computer.y + OS_OFFSET, 28, 24);
	}
}

/*
 * Spark
 */

function SPARK_DELAY(level) {
	return (Math.max(20 - (level), 0));
}

function spark_width() {
	return 20;
}

function spark_height() {
	return 20;
}

function spark_draw(x, y, index) {
	ctx.drawImage(sprites, (index * 20) + 358, 124, 20, 20, x, y, 20, 20);
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
}

function reverse(cable) {
	var t;
	t = cable.c1;
	cable.c1 = cable.c2;
	cable.c2 = t;
	t = cable.x1;
	cable.x1 = cable.x2;
	cable.x2 = t;
	t = cable.y1;
	cable.y1 = cable.y2;
	cable.y2 = t;
}

function cable_setup(cable) {
	var comp1, comp2, cwidth, cheight;

	cable.c1 = RAND(0, ncomputers - 1);
	do {
		cable.c2 = RAND(0, ncomputers - 1);
	} while (cable.c2 === cable.c1);
	cable.active = 0;
	cable.index = 0;
	cable.delay = SPARK_DELAY(level);

	comp1 = computers[cable.c1];
	comp2 = computers[cable.c2];
	cwidth = compwidth;
	cheight = compheight;
	cable.x1 = Math.round(comp1.x + cwidth / 3);
	cable.x2 = Math.round(comp2.x + cwidth / 3);
	cable.y1 = Math.round(comp1.y + cheight / 2);
	cable.y2 = Math.round(comp2.y + cheight / 2);
}

function cable_draw(cable) {
	var rx, ry;

	ui_draw_line(cable.x1, cable.y1, cable.x2, cable.y2);
	if (cable.active) {
		rx = cable.x - spark_width() / 2;
		ry = cable.y - spark_height() / 2;
		spark_draw(rx, ry, cable.index);
	}
}

function cable_update(cable) {
	var comp1, comp2, xdist, ydist, sx, sy, counter;

	comp1 = computers[cable.c1];
	comp2 = computers[cable.c2];

	if (cable.active) {
		if ((comp1.os === OS_WINGDOWS) === (comp2.os === OS_WINGDOWS)) {
			cable.active = 0;
		} else if (comp1.os === OS_WINGDOWS || comp2.os === OS_WINGDOWS) {
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
					if (comp2.os === OS_OFF) {
						counter = NETWORK_COUNTER_OFF;
					} else {
						counter = NETWORK_COUNTER_BASE;
					}
					network_inc_counter(counter, -1);
					network_inc_counter(NETWORK_COUNTER_WIN, 1);
					comp2.os = OS_WINGDOWS;
				}
				cable.active = 0;
			} else if (Math.max(xdist, ydist) < SPARK_SPEED) {
				cable.x = cable.x2;
				cable.y = cable.y2;
			} else {
				cable.fx += (xdist * SPARK_SPEED * sx) / (xdist + ydist);
				cable.fy += (ydist * SPARK_SPEED * sy) / (xdist + ydist);
				cable.x = cable.fx;
				cable.y = cable.fy;
			}
			cable.index = 1 - cable.index;
		}
	} else {
		if ((comp1.os === OS_WINGDOWS) === (comp2.os === OS_WINGDOWS)) {
			// If WINGDOWS at both ends, do nothing
		} else if (comp1.os === OS_WINGDOWS || comp2.os === OS_WINGDOWS) {
			cable.active = 1;
			cable.delay = SPARK_DELAY(level);
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

function cable_onspark(cable, locx, locy) {
	if (!cable.active) {
		return 0;
	}
	return (Math.abs(locx - cable.x) < spark_width() && Math.abs(locy - cable.y) < spark_height());
}

function cable_reset(cable) {
	cable.active = 0;
	cable.delay = SPARK_DELAY(level);
}

/*
 * Bucket
 */
function bucket_clicked(x, y) {
	return (x > 0 && x < bucketwidth && y > 0 && y < bucketheight);
}

function bucket_release(x, y) {
	var i, cable;
	for (i = 0; i < ncables; i+=1) {
		cable = cables[i];
		if (cable_onspark(cable, x, y)) {
			cable_reset(cable);
		}
	}
	bucketgrabbed = 0;
}

/*
 * OS
 */

function os_draw_cursor() {
	if (grabbed) {
		ctx.drawImage(sprites, grabbedos * 28, 124, 24, 24, mousex - 14, mousey - 12, 28, 24);
	}
}

/*
 * Network
 */

function network_on(level) {
	return (Math.min(8 + level, STD_MAX_COMPUTERS) * game_scale(2));
}

/* sets up network for each level */
function network_setup() {
	var i;
	ncomputers = network_on(level);
	if (computers !== null) {
		computers.length = 0;
	}
	if (cables !== null) {
		cables.length = 0;
	}
	for (i = 0; i < ncomputers; i+=1) {
		computers[i] = new Computer();
		if (!computer_setup(computers[i], i)) {
			ncomputers = i - 1;
			break;
		}
	}
	counters[NETWORK_COUNTER_OFF] = 0;
	counters[NETWORK_COUNTER_BASE] = ncomputers;
	counters[NETWORK_COUNTER_WIN] = 0;
	ncables = Math.min(level, ncomputers / 2);
	for (i = 0; i < ncables; i+=1) {
		cables[i] = new Cable();
		cable_setup(cables[i]);
	}
}

/* redraws the computers at their location with the proper image */
function network_draw() {
	var i;
	for (i = 0; i < ncables; i+=1) {
		cable_draw(cables[i]);
	}
	for (i = 0; i < ncomputers; i+=1) {
		computer_draw(computers[i]);
	}
}

function network_update() {
	var i;
	for (i = 0; i < ncables; i+=1) {
		cable_update(cables[i]);
	}
}

function network_toasters() {
	var i;
	for (i = 0; i < ncomputers; i+=1) {
		computers[i].type = COMPUTER_TOASTER;
		computers[i].os = OS_OFF;
	}
	ncables = 0;
}

function network_get_counter(counter) {
	return counters[counter];
}

/*
 * Horde
 */

function horde_on(lev) {
	var perlevel;
	perlevel = ((8 + 3 * lev) * game_scale(2));
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
	var bill, n, off_screen;

	off_screen = HORDE_COUNTER_OFF;
	if (max === 0 || off_screen === 0) {
		return;
	}
	n = RAND(1, Math.min(max, off_screen));
	for (n; n > 0; n--) {
		bill = new Bill();
		bill_enter(bill);
		alive = PREPEND(bill, alive);
	}
}

function horde_setup() {
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
	HORDE_COUNTER_OFF = horde_on(level);
	HORDE_COUNTER_ON = 0;
}

function horde_update(iteration) {
	var bill, next;
	if (iteration % between(level) === 0) {
		launch(max_at_once(level));
	}
	for (bill = alive; bill !== null; bill = next) {
		next = bill.next;
		bill_update(bill);
	}
}

function horde_draw() {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		bill_draw(bill);
	}
	for (bill = alive; bill !== null; bill = bill.next) {
		bill_draw(bill);
	}
}

function horde_add_bill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = PREPEND(bill, strays);
	} else {
		alive = PREPEND(bill, alive);
	}
}

function horde_clicked_stray(x, y) {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		if (!bill_clickedstray(bill, x, y)) {
			continue;
		}
		strays = UNLINK(bill, strays);
		return bill;
	}
	return null;
}

function horde_process_click(x, y) {
	var bill, counter, comp;

	counter = 0;
	for (bill = alive; bill !== null; bill = bill.next) {
		if (bill.state === BILL_STATE_DYING || !bill_clicked(bill, x, y)) {
			continue;
		}
		if (bill.state === BILL_STATE_AT) {
			comp = computers[bill.target_c];
			comp.busy = 0;
			comp.stray = bill;
		}
		bill_set_dying(bill);
		counter+=1;
	}
	return counter;
}

/*
 * Game
 */

function setup_level(newlevel) {
	level = newlevel;
	horde_setup();
	grabbed = null;
	network_setup();
	iteration = 0;
	efficiency = 0;
}

function game_start(newlevel) {
	gamestate = STATE_PLAYING;
	score = 0;
	paused = 0;
	ui_restart_timer();
	ui_set_pausebutton(1);
	setup_level(newlevel);
}

function game_stop() {
	if (paused === 0) {
		ui_kill_timer();
		ui_set_pausebutton(0);
		paused = 1;
	} else {
		ui_restart_timer();
		ui_set_pausebutton(1);
		paused = 0;
	}
}

function update_info() {
	var on_screen, off_screen, base, off, win, units, str;

	on_screen = horde_get_counter(HORDE_COUNTER_ON);
	off_screen = horde_get_counter(HORDE_COUNTER_OFF);
	base = network_get_counter(NETWORK_COUNTER_BASE);
	off = network_get_counter(NETWORK_COUNTER_OFF);
	win = network_get_counter(NETWORK_COUNTER_WIN);
	units = ncomputers;
	str = "Bill:" + on_screen + "/" + off_screen + "  System:" + base + "/" + off + "/" + win + "  Level:" + level + "  Score:" + Math.floor(score);
	ctx.fillText(str, 0, screensize-1);
	efficiency += ((100 * base - 10 * win) / units);
}

function game_add_high_score(str) {
	scorelist_recalc(str, level, score);
}

function mouse_moved(x, y, canvas) {
	mousex = x - canvas.offsetLeft;
	mousey = y - canvas.offsetTop;
}

function mouse_button_press() {
	var counter;

	if (gamestate !== STATE_PLAYING || paused === 1) {
		return;
	}

	if (bucket_clicked(mousex, mousey)) {
		bucketgrabbed = 1;
		return;
	}

	grabbed = horde_clicked_stray(mousex, mousey);
	if (grabbed !== null) {
		grabbedos = grabbed.cargo;
		return;
	}

	counter = horde_process_click(mousex, mousey);
	score += (counter * counter * SCORE_BILLPOINTS);
}

function mouse_button_release() {
	var i, computer, counter;

	if (gamestate !== STATE_PLAYING || paused === 1) {
		return;
	}

	if (grabbed === null) {
		bucket_release(mousex, mousey);
		return;
	}

	for (i = 0; i < ncomputers; i+=1) {
		computer = computers[i];

		if (computer_on(computer, mousex, mousey) &&
				computer_compatible(computer, grabbed.cargo) &&
				(computer.os === OS_WINGDOWS || computer.os === OS_OFF)) {

			network_inc_counter(NETWORK_COUNTER_BASE, 1);
			if (computer.os === OS_WINGDOWS) {
				counter = NETWORK_COUNTER_WIN;
			} else {
				counter = NETWORK_COUNTER_OFF;
			}
			network_inc_counter(counter, -1);
			computer.os = grabbed.cargo;
			horde_remove_bill(grabbed);
			grabbed = null;
			return;
		}
	}
	horde_add_bill(grabbed);
	grabbed = null;
}

function game_update() {
	var name;

	switch (gamestate) {
	case STATE_PLAYING:
		ctx.clearRect(0, 0, screensize, screensize);
		network_update();
		network_draw();
		horde_update(iteration);
		horde_draw();
		bucket_draw();
		os_draw_cursor();
		update_info();
		if (horde_get_counter(HORDE_COUNTER_ON) + horde_get_counter(HORDE_COUNTER_OFF) === 0) {
			score += (level * efficiency / iteration);
			gamestate = STATE_BETWEEN;
		}
		if ((network_get_counter(NETWORK_COUNTER_BASE) + network_get_counter(NETWORK_COUNTER_OFF)) <= 1) {
			gamestate = STATE_END;
		}
		break;
	case STATE_END:
		ctx.clearRect(0, 0, screensize, screensize);
		network_toasters();
		network_draw();
		if (scorelist_ishighscore(score)) {
			name = prompt("You earned a high score.\nEnter your name:");
			if (name === null) {
				name = "Anonymous";
			}
			game_add_high_score(name);
		}
		ui_kill_timer();
		ui_set_pausebutton(0);
		gamestate = STATE_WAITING;
		break;
	case STATE_BETWEEN:
		alert("After Level  " + level + "\nScore: " + Math.floor(score));
		gamestate = STATE_PLAYING;
		setup_level(++level);
		break;
	}
	iteration+=1;
}

function main() {
	var canvas;
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	ctx.font = "bold 12px sans-serif";
	$("canvas").unbind();

	$("canvas").bind('gestureStart', function (event) {
		event.preventDefault();
	});

	$("canvas").bind('gestureChange', function (event) {
		event.preventDefault();
	});

	$("canvas").bind('gestureEnd', function (event) {
		event.preventDefault();
	});

	$("canvas").bind('touchmove', function (event) {
		event.preventDefault();
	});

	$("canvas").bind('mousemove', function (event) {
		mouse_moved(event.pageX, event.pageY, canvas);
	});

	$("canvas").bind('mousedown', function (event) {
		event.preventDefault();
		mouse_button_press();
	});

	$("canvas").bind('mouseup', function (event) {
		event.preventDefault();
		mouse_button_release();
	});

	$("canvas").bind('touchstart', function (event) {
		mouse_moved(event.targetTouches[0].pageX, event.targetTouches[0].pageY, canvas);
		event.preventDefault();
		mouse_button_press();
	});

	$("canvas").bind('touchend', function (event) {
		mouse_moved(event.targetTouches[0].pageX, event.targetTouches[0].pageY, canvas);
		event.preventDefault();
		mouse_button_release();
	});

	ctx.clearRect(0, 0, screensize, screensize);

	scorelist_read();

	ui_load_pix();
	bill_load_pix();

	gamestate = STATE_WAITING;
	if (level) {
		game_start(level);
	} else {
		ui_set_pausebutton(0);
	}
}
