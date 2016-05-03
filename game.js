"use strict";
/* global $ */

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

var billWidth, billHeight;

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
var osWidth = 28;
var osHeight = 24;

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

function rand(lb, ub) {
	return Math.floor(Math.random() * ((ub) - (lb) + 1) + (lb));
}

/*
 * Timer operations
 */

function uiRestartTimer() {
	if (timer === 0) {
		timer = setInterval(timerTick, 200);
	}
}

function timerTick() {
	uiRestartTimer();
	gameUpdate();
	return true;
}

function uiKillTimer() {
	if (timer !== 0) {
		clearInterval(timer);
	}
	timer = 0;
}

/*
 * Graphics routines
 */

function bucketDraw() {
	if (!bucketgrabbed) {
		ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
	} else {
		ctx.drawImage(sprites, 336, 124, 24, 24, mousex - 12, mousey - 12, 24, 24);
	}
}

function uiDrawLine(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

/*
 * Other routines
 */

function uiSetPauseButton(action) {
	if (action === 1) {
		document.getElementById("pauseHref").disabled = false;
		document.getElementById("pauseHref").textContent = "Pause Game";
	} else {
		document.getElementById("pauseHref").textContent = "Resume Game";
	}
}

function uiIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
	return ((Math.abs(x2 - x1 + (w2 - w1) / 2) < (w1 + w2) / 2) && (Math.abs(y2 - y1 + (h2 - h1) / 2) < (h1 + h2) / 2));
}

function uiLoadPix() {
	sprites = new Image();
	sprites.src = "images/sprites.png";
}

/*
 * Story
 */
function storyShow() {
	if(document.getElementById("storydiv").style.display === "none") {
		document.getElementById("storydiv").style.display = "block";
	} else {
		document.getElementById("storydiv").style.display = "none";
	}
}

function storyHide() {
	document.getElementById("storydiv").style.display = "none";
}

/*
 * Scorelist
 */

var scores = new Array([]);

function scorelistShow() {
	if(document.getElementById("scorediv").style.display === "none") {
		document.getElementById("scorediv").style.display = "block";
	} else {
		document.getElementById("scorediv").style.display = "none";
	}
}

function scorelistHide() {
	document.getElementById("scorediv").style.display = "none";
}

function scorelistRead() {
    $.ajax({
		url: "get_scores.php", data: "", dataType: "json",  success(rows)
		{
			$("table#scoretable tbody tr").remove();
			for(var i = 0; i < rows.length; i++) {
				var t = rows[i].date.split(/[- :]/);
				var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
				scores.push({"score": rows[i].score, "level": rows[i].level, "name": rows[i].name, "date": rows[i].date });
				NUMSCORES++;
				$("table#scoretable tbody").append("<tr><td>" + rows[i].name + "</td><td>" + rows[i].level + "</td><td>" + rows[i].score + "</td><td>" + ( d.getHours() < 10 ? "0" : "" ) + d.getHours() + ":" + ( d.getMinutes() < 10 ? "0" : "" ) + d.getMinutes() + " " + ( d.getDate() < 10 ? "0" : "" ) + d.getDate() + "/" + ( (d.getMonth()+1) < 10 ? "0" : "" ) + (d.getMonth()+1) + "/" + d.getFullYear() + "</td></tr>");
			}
			scores.shift();
			NUMSCORES = scores.length;
/*			console.log(NUMSCORES);
			console.log(scores); */
		}
	});
}

/*  Add new high score to list   */
function scorelistRecalc(str, level, score) {
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
		url: "save_score.php", data: { level: level, name: tname, score: Math.floor(score), date: Date.now() }, dataType: "json",  success(rows)
		{
			// Update copy of scores since we've just added one
			scorelistRead();
		}
	});
}

function scorelistIshighscore(val) {
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
	this.targetX;		/* target x position */
	this.targetY;		/* target y position */
	this.targetC;		/* target computer */
	this.dx;	/* direction */
	this.dx;	/* direction */
	this.dx;	/* direction */
	this.cargo;		/* which OS carried */
	this.xOffset;		/* accounts for width differences */
	this.yOffset;		/* 'bounce' factor for OS carried */
	this.sx;
	this.sy;		/* used for drawing extra OS during switch */
	this.prev;
	this.next;
}

function getBorderBill(bill) {
	var i;

	i = rand(0, 3);

	if (i % 2 === 0) {
		bill.x = rand(0, screensize - billWidth);
	} else {
		bill.y = rand(0, screensize - billHeight);
	}

	switch (i) {
	case 0:
		bill.y = -billHeight - 16;
		break;
	case 1:
		bill.x = screensize + 1;
		break;
	case 2:
		bill.y = screensize + 1;
		break;
	case 3:
		bill.x = -billWidth - 2;
		break;
	}
}

function getBorderTarget(bill) {
	var i;

	i = rand(0, 3);

	if (i % 2 === 0) {
		bill.targetX = rand(0, screensize - billWidth);
	} else {
		bill.targetY = rand(0, screensize - billHeight);
	}

	switch (i) {
	case 0:
		bill.targetY = -billHeight - 16;
		break;
	case 1:
		bill.targetX = screensize + 1;
		break;
	case 2:
		bill.targetY = screensize + 1;
		break;
	case 3:
		bill.targetX = -billWidth - 2;
		break;
	}
}

function osDraw(index, x, y) {
	ctx.drawImage(sprites, index * 28, 124, 28, 24, x, y, 28, 24);
}

function hordeIncCounter(counter, val) {
	counter += val;
	return counter;
}

function hordeGetCounter(counter) {
	return counter;
}

function networkIncCounter(counter, val) {
	counters[counter] += val;
}

function gameScale(dimensions) {
	var scale, d;

	scale = 1;
	d = 1;
	for (dimensions; dimensions > 0; dimensions--) {
		d *= scale;
	}
	return (d);
}

function osIspc(index) {
	return (index >= MIN_PC);
}

/* Adds a bill to the in state */
function billEnter(bill) {
	var computer;

	bill.state = BILL_STATE_IN;
	getBorderBill(bill);
	bill.index = 0;
	bill.cargo = OS_WINGDOWS;
	bill.xOffset = -2;
	bill.yOffset = -15;
	bill.targetC = rand(0, ncomputers - 1);
	computer = computers[bill.targetC];
	bill.targetX = computer.x + compwidth - BILL_OFFSET_X;
	bill.targetY = computer.y + BILL_OFFSET_Y;
	HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, 1);
	HORDE_COUNTER_OFF = hordeIncCounter(HORDE_COUNTER_OFF, -1);
	bill.prev = null;
	bill.next = null;
}

function stepSize(level) {
	return Math.min(11 + level, 15);
}

/*  Moves bill toward his target - returns whether or not he moved */
function billMove(bill, mode) {
	var xdist, ydist, step, dx, dy, signx, signy;

	xdist = bill.targetX - bill.x;
	ydist = bill.targetY - bill.y;
	step = stepSize(level);
	signx = xdist >= 0 ? 1 : -1;
	signy = ydist >= 0 ? 1 : -1;

	xdist = Math.abs(xdist);
	ydist = Math.abs(ydist);

	if (!xdist && !ydist) {
		return 0;
	} else if (xdist < step && ydist < step) {
		bill.x = bill.targetX;
		bill.y = bill.targetY;
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

function drawStd(bill) {
	if (bill.cargo >= 0) {
		osDraw(bill.cargo, bill.x + bill.xOffset, bill.y + bill.yOffset);
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

function drawAt(bill) {
	var computer;

	computer = computers[bill.targetC];
	if (bill.index > 6 && bill.index < 12) {
		osDraw(0, bill.x + bill.sx, bill.y + bill.sy);
	}
	if (bill.cargo >= 0) {
		osDraw(bill.cargo, bill.x + bill.xOffset,	bill.y + bill.yOffset);
	}
	// acels
	ctx.drawImage(sprites, bill.index * 58, 38, 58, 41, computer.x, computer.y, 58, 41);
}

function drawStray(bill) {
	osDraw(bill.cargo, bill.x, bill.y);
}

function billDraw(bill) {
    if (bill.state === BILL_STATE_IN ||
        bill.state === BILL_STATE_OUT ||
        bill.state === BILL_STATE_DYING) {
        drawStd(bill);
    } else if (bill.state === BILL_STATE_AT) {
        drawAt(bill);
    } else if (bill.state === BILL_STATE_STRAY) {
        drawStray(bill);
    }
}

/* Update Bill's position */
function updateIn(bill) {
	var moved, computer, i;

	moved = billMove(bill, SLOW);
	computer = computers[bill.targetC];
	if (!moved && computer.os !== OS_WINGDOWS && !computer.busy) {
		computer.busy = 1;
		bill.index = 0;
		bill.state = BILL_STATE_AT;
		return;
	} else if (!moved) {
		do {
			i = rand(0, ncomputers - 1);
		} while (i === bill.targetC);
		computer = computers[i];
		bill.targetC = i;
		bill.targetX = computer.x + compwidth - BILL_OFFSET_X;
		bill.targetY = computer.y + BILL_OFFSET_Y;
	}
	bill.index+=1;
	bill.index %= WCELS;
	bill.yOffset += (8 * (bill.index % 2) - 4);
}

function networkClearStray(bill) {
	var i;
	for (i = 0; i < ncomputers; i+=1) {
		if (computers[i].stray === bill) {
			computers[i].stray = null;
		}
	}
}

function unlink(bill, list) {
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

function hordeRemoveBill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = unlink(bill, strays);
	} else {
		alive = unlink(bill, alive);
	}
	networkClearStray(bill);
}

/*  Update Bill standing at a computer */
function updateAt(bill) {
	var computer;
	computer = computers[bill.targetC];
	if (bill.index === 0 && computer.os === OS_OFF) {
		bill.index = 6;
		if (computer.stray === null) {
			bill.cargo = -1;
		} else {
			bill.cargo = computer.stray.cargo;
			hordeRemoveBill(computer.stray);
			computer.stray = null;
		}
	} else {
		bill.index+=1;
	}
	if (bill.index === 13) {
		bill.yOffset = -15;
		bill.xOffset = -2;
		getBorderTarget(bill);
		bill.index = 0;
		bill.state = BILL_STATE_OUT;
		computer.busy = 0;
		return;
	}
	bill.yOffset = billHeight - osHeight;
	switch (bill.index) {
	case 1:
	case 2:
		bill.x -= 8;
		bill.xOffset += 8;
		break;
	case 3:
		bill.x -= 10;
		bill.xOffset += 10;
		break;
	case 4:
		bill.x += 3;
		bill.xOffset -= 3;
		break;
	case 5:
		bill.x += 2;
		bill.xOffset -= 2;
		break;
	case 6:
		if (computer.os !== OS_OFF) {
			networkIncCounter(NETWORK_COUNTER_BASE, -1);
			networkIncCounter(NETWORK_COUNTER_OFF, 1);
			bill.cargo = computer.os;
		} else {
			bill.x -= 21;
			bill.xOffset += 21;
		}
		computer.os = OS_OFF;
		bill.yOffset = -15;
		bill.x += 20;
		bill.xOffset -= 20;
		break;
	case 7:
		bill.sy = bill.yOffset;
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
		bill.xOffset += 8;
		break;
	case 10:
		bill.sy = 0;
		bill.sx = -7;
		bill.x -= 15;
		bill.xOffset += 15;
		break;
	case 11:
		bill.sy = 0;
		bill.sx = -7;
		computer.os = OS_WINGDOWS;
		networkIncCounter(NETWORK_COUNTER_OFF, -1);
		networkIncCounter(NETWORK_COUNTER_WIN, 1);
		break;
	case 12:
		bill.x += 11;
		bill.xOffset -= 11;
		break;
	}
}

/* Updates Bill fleeing with his ill gotten gain */
function updateOut(bill) {
	if (uiIntersect(bill.x, bill.y, billWidth, billHeight, 0, 0, screensize, screensize)) {
		billMove(bill, FAST);
		bill.index+=1;
		bill.index %= WCELS;
		bill.yOffset += (8 * (bill.index % 2) - 4);
	} else {
		hordeRemoveBill(bill);
		HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, -1);
		HORDE_COUNTER_OFF = hordeIncCounter(HORDE_COUNTER_OFF, 1);
	}
}

function prepend(bill, list) {
	bill.next = list;
	if (list !== null) {
		list.prev = bill;
	}
	list = bill;
	return list;
}

function hordeMoveBill(bill) {
	alive = unlink(bill, alive);
	strays = prepend(bill, strays);
}

/* Updates a Bill who is dying */
function updateDying(bill) {
	if (bill.index < DCELS - 1) {
		bill.yOffset += (bill.index * GRAVITY);
		bill.index+=1;
	} else {
		bill.y += bill.yOffset;
		if (bill.cargo < 0 || bill.cargo === OS_WINGDOWS) {
			hordeRemoveBill(bill);
		} else {
			hordeMoveBill(bill);
			bill.state = BILL_STATE_STRAY;
		}
		HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, -1);
	}
}

function billUpdate(bill) {
	switch (bill.state) {
	case BILL_STATE_IN:
		updateIn(bill);
		break;
	case BILL_STATE_AT:
		updateAt(bill);
		break;
	case BILL_STATE_OUT:
		updateOut(bill);
		break;
	case BILL_STATE_DYING:
		updateDying(bill);
		break;
	default:
		break;
	}
}

function billSetDying(bill) {
	bill.index = -1;
	bill.xOffset = -2;
	bill.yOffset = -15;
	bill.state = BILL_STATE_DYING;
}

function billClicked(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + billWidth && locy > bill.y && locy < bill.y + billHeight);
}

function billClickedstray(bill, locx, locy) {
	return (locx > bill.x && locx < bill.x + osWidth && locy > bill.y && locy < bill.y + osHeight);
}

function billLoadPix() {
	billWidth = 24;
	billHeight = 38;
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

function osRandpc() {
	return (rand(MIN_PC, NUM_OS - 1));
}

function determineOS(computer) {
	if (computer.type < MIN_PC) {
		return computer.type;
	} else {
		return osRandpc();
	}
}

function computerSetup(computer, index) {
	var j, counter, flag, x, y, border, c, twidth;

	counter = 0;
	border = screensize / 10; /* at least this far from a side */
	do {
		if (++counter > 4000) {
			return 0;
		}
		x = rand(border, screensize - border - compwidth);
		y = rand(border, screensize - border - compheight);
		flag = 1;
		/* check for conflicting computer placement */
		for (j = 0; j < index && flag; j+=1) {
			c = computers[j];
			twidth = compwidth - BILL_OFFSET_X + billWidth;
			if (uiIntersect(x, y, twidth, compheight, c.x, c.y, twidth, compheight)) {
				flag = 0;
			}
		}
	} while (!flag);
	computer.x = x;
	computer.y = y;
	computer.type = rand(1, NUM_SYS - 1);
	computer.os = determineOS(computer);
	computer.busy = 0;
	computer.stray = null;
	return 1;
}

function computerOn(computer, locx, locy) {
	return (Math.abs(locx - computer.x) < compwidth && Math.abs(locy - computer.y) < compheight);
}

function computerCompatible(computer, system) {
	return (computer.type === system || (computer.type >= MIN_PC && osIspc(system)));
}

function computerDraw(computer) {
	ctx.drawImage(sprites, computer.type * 55, 79, 55, 45, computer.x, computer.y, 55, 45);
	if (computer.os !== OS_OFF) {
		ctx.drawImage(sprites, computer.os * 28, 124, 28, 24, computer.x + OS_OFFSET, computer.y + OS_OFFSET, 28, 24);
	}
}

/*
 * Spark
 */

function sparkDelay(level) {
	return (Math.max(20 - (level), 0));
}

function sparkWidth() {
	return 20;
}

function sparkHeight() {
	return 20;
}

function sparkDraw(x, y, index) {
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

function cableSetup(cable) {
	var comp1, comp2, cwidth, cheight;

	cable.c1 = rand(0, ncomputers - 1);
	do {
		cable.c2 = rand(0, ncomputers - 1);
	} while (cable.c2 === cable.c1);
	cable.active = 0;
	cable.index = 0;
	cable.delay = sparkDelay(level);

	comp1 = computers[cable.c1];
	comp2 = computers[cable.c2];
	cwidth = compwidth;
	cheight = compheight;
	cable.x1 = Math.round(comp1.x + cwidth / 3);
	cable.x2 = Math.round(comp2.x + cwidth / 3);
	cable.y1 = Math.round(comp1.y + cheight / 2);
	cable.y2 = Math.round(comp2.y + cheight / 2);
}

function cableDraw(cable) {
	var rx, ry;

	uiDrawLine(cable.x1, cable.y1, cable.x2, cable.y2);
	if (cable.active) {
		rx = cable.x - sparkWidth() / 2;
		ry = cable.y - sparkHeight() / 2;
		sparkDraw(rx, ry, cable.index);
	}
}

function cableUpdate(cable) {
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
					networkIncCounter(counter, -1);
					networkIncCounter(NETWORK_COUNTER_WIN, 1);
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
			cable.delay = sparkDelay(level);
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

function cableOnspark(cable, locx, locy) {
	if (!cable.active) {
		return 0;
	}
	return (Math.abs(locx - cable.x) < sparkWidth() && Math.abs(locy - cable.y) < sparkHeight());
}

function cableReset(cable) {
	cable.active = 0;
	cable.delay = sparkDelay(level);
}

/*
 * Bucket
 */
function bucketClicked(x, y) {
	return (x > 0 && x < bucketwidth && y > 0 && y < bucketheight);
}

function bucketRelease(x, y) {
	var i, cable;
	for (i = 0; i < ncables; i+=1) {
		cable = cables[i];
		if (cableOnspark(cable, x, y)) {
			cableReset(cable);
		}
	}
	bucketgrabbed = 0;
}

/*
 * OS
 */

function osDrawCursor() {
	if (grabbed) {
		ctx.drawImage(sprites, grabbedos * 28, 124, 24, 24, mousex - 14, mousey - 12, 28, 24);
	}
}

/*
 * Network
 */

function networkOn(level) {
	return (Math.min(8 + level, STD_MAX_COMPUTERS) * gameScale(2));
}

/* sets up network for each level */
function networkSetup() {
	var i;
	ncomputers = networkOn(level);
	if (computers !== null) {
		computers.length = 0;
	}
	if (cables !== null) {
		cables.length = 0;
	}
	for (i = 0; i < ncomputers; i+=1) {
		computers[i] = new Computer();
		if (!computerSetup(computers[i], i)) {
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
		cableSetup(cables[i]);
	}
}

/* redraws the computers at their location with the proper image */
function networkDraw() {
	var i;
	for (i = 0; i < ncables; i+=1) {
		cableDraw(cables[i]);
	}
	for (i = 0; i < ncomputers; i+=1) {
		computerDraw(computers[i]);
	}
}

function networkUpdate() {
	var i;
	for (i = 0; i < ncables; i+=1) {
		cableUpdate(cables[i]);
	}
}

function networkToasters() {
	var i;
	for (i = 0; i < ncomputers; i+=1) {
		computers[i].type = COMPUTER_TOASTER;
		computers[i].os = OS_OFF;
	}
	ncables = 0;
}

function networkGetCounter(counter) {
	return counters[counter];
}

/*
 * Horde
 */

function hordeOn(lev) {
	var perlevel;
	perlevel = ((8 + 3 * lev) * gameScale(2));
	return Math.min(perlevel, MAX_BILLS);
}

function maxAtOnce(lev) {
	return Math.round(Math.min(2 + lev / 4, 12));
}

function between(lev) {
	return Math.round(Math.max(14 - lev / 3, 10));
}

/*  Launches Bills whenever called  */
function launch(max) {
	var bill, n, offScreen;

	offScreen = HORDE_COUNTER_OFF;
	if (max === 0 || offScreen === 0) {
		return;
	}
	n = rand(1, Math.min(max, offScreen));
	for (n; n > 0; n--) {
		bill = new Bill();
		billEnter(bill);
		alive = prepend(bill, alive);
	}
}

function hordeSetup() {
	var bill;
	while (alive !== null) {
		bill = alive;
		alive = unlink(bill, alive);
		bill = null;
	}
	while (strays !== null) {
		bill = strays;
		strays = unlink(bill, strays);
		bill = null;
	}
	HORDE_COUNTER_OFF = hordeOn(level);
	HORDE_COUNTER_ON = 0;
}

function hordeUpdate(iteration) {
	var bill, next;
	if (iteration % between(level) === 0) {
		launch(maxAtOnce(level));
	}
	for (bill = alive; bill !== null; bill = next) {
		next = bill.next;
		billUpdate(bill);
	}
}

function hordeDraw() {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		billDraw(bill);
	}
	for (bill = alive; bill !== null; bill = bill.next) {
		billDraw(bill);
	}
}

function hordeAddBill(bill) {
	if (bill.state === BILL_STATE_STRAY) {
		strays = prepend(bill, strays);
	} else {
		alive = prepend(bill, alive);
	}
}

function hordeClickedStray(x, y) {
	var bill;

	for (bill = strays; bill !== null; bill = bill.next) {
		if (!billClickedstray(bill, x, y)) {
			continue;
		}
		strays = unlink(bill, strays);
		return bill;
	}
	return null;
}

function hordeProcessClick(x, y) {
	var bill, counter, comp;

	counter = 0;
	for (bill = alive; bill !== null; bill = bill.next) {
		if (bill.state === BILL_STATE_DYING || !billClicked(bill, x, y)) {
			continue;
		}
		if (bill.state === BILL_STATE_AT) {
			comp = computers[bill.targetC];
			comp.busy = 0;
			comp.stray = bill;
		}
		billSetDying(bill);
		counter+=1;
	}
	return counter;
}

/*
 * Game
 */

function setupLevel(newlevel) {
	level = newlevel;
	hordeSetup();
	grabbed = null;
	networkSetup();
	iteration = 0;
	efficiency = 0;
}

function gameStart(newlevel) {
	gamestate = STATE_PLAYING;
	score = 0;
	paused = 0;
	uiRestartTimer();
	uiSetPauseButton(1);
	setupLevel(newlevel);
}

function gameStop() {
	if (paused === 0) {
		uiKillTimer();
		uiSetPauseButton(0);
		paused = 1;
	} else {
		uiRestartTimer();
		uiSetPauseButton(1);
		paused = 0;
	}
}

function updateInfo() {
	var onScreen, offScreen, base, off, win, units, str;

	onScreen = hordeGetCounter(HORDE_COUNTER_ON);
	offScreen = hordeGetCounter(HORDE_COUNTER_OFF);
	base = networkGetCounter(NETWORK_COUNTER_BASE);
	off = networkGetCounter(NETWORK_COUNTER_OFF);
	win = networkGetCounter(NETWORK_COUNTER_WIN);
	units = ncomputers;
	str = "Bill:" + onScreen + "/" + offScreen + "  System:" + base + "/" + off + "/" + win + "  Level:" + level + "  Score:" + Math.floor(score);
	ctx.fillText(str, 0, screensize-1);
	efficiency += ((100 * base - 10 * win) / units);
}

function gameAddHighScore(str) {
	scorelistRecalc(str, level, score);
}

function mouseMoved(x, y, canvas) {
	mousex = x - canvas.offsetLeft;
	mousey = y - canvas.offsetTop;
}

function mouseButtonPress() {
	var counter;

	if (gamestate !== STATE_PLAYING || paused === 1) {
		return;
	}

	if (bucketClicked(mousex, mousey)) {
		bucketgrabbed = 1;
		return;
	}

	grabbed = hordeClickedStray(mousex, mousey);
	if (grabbed !== null) {
		grabbedos = grabbed.cargo;
		return;
	}

	counter = hordeProcessClick(mousex, mousey);
	score += (counter * counter * SCORE_BILLPOINTS);
}

function mouseButtonRelease() {
	var i, computer, counter;

	if (gamestate !== STATE_PLAYING || paused === 1) {
		return;
	}

	if (grabbed === null) {
		bucketRelease(mousex, mousey);
		return;
	}

	for (i = 0; i < ncomputers; i+=1) {
		computer = computers[i];

		if (computerOn(computer, mousex, mousey) &&
				computerCompatible(computer, grabbed.cargo) &&
				(computer.os === OS_WINGDOWS || computer.os === OS_OFF)) {

			networkIncCounter(NETWORK_COUNTER_BASE, 1);
			if (computer.os === OS_WINGDOWS) {
				counter = NETWORK_COUNTER_WIN;
			} else {
				counter = NETWORK_COUNTER_OFF;
			}
			networkIncCounter(counter, -1);
			computer.os = grabbed.cargo;
			hordeRemoveBill(grabbed);
			grabbed = null;
			return;
		}
	}
	hordeAddBill(grabbed);
	grabbed = null;
}

function gameUpdate() {
	var name;

	switch (gamestate) {
	case STATE_PLAYING:
		ctx.clearRect(0, 0, screensize, screensize);
		networkUpdate();
		networkDraw();
		hordeUpdate(iteration);
		hordeDraw();
		bucketDraw();
		osDrawCursor();
		updateInfo();
		if (hordeGetCounter(HORDE_COUNTER_ON) + hordeGetCounter(HORDE_COUNTER_OFF) === 0) {
			score += (level * efficiency / iteration);
			gamestate = STATE_BETWEEN;
		}
		if ((networkGetCounter(NETWORK_COUNTER_BASE) + networkGetCounter(NETWORK_COUNTER_OFF)) <= 1) {
			gamestate = STATE_END;
		}
		break;
	case STATE_END:
		ctx.clearRect(0, 0, screensize, screensize);
		networkToasters();
		networkDraw();
		if (scorelistIshighscore(score)) {
			name = prompt("You earned a high score.\nEnter your name:");
			if (name === null) {
				name = "Anonymous";
			}
			gameAddHighScore(name);
		}
		uiKillTimer();
		uiSetPauseButton(0);
		gamestate = STATE_WAITING;
		break;
	case STATE_BETWEEN:
		alert("After Level  " + level + "\nScore: " + Math.floor(score));
		gamestate = STATE_PLAYING;
		setupLevel(++level);
		break;
	}
	iteration+=1;
}

function main() {
	var canvas;
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	ctx.font = "bold 12px sans-serif";
	$("canvas").unbind();

	$("canvas").bind("gestureStart", function (event) {
		event.preventDefault();
	});

	$("canvas").bind("gestureChange", function (event) {
		event.preventDefault();
	});

	$("canvas").bind("gestureEnd", function (event) {
		event.preventDefault();
	});

	$("canvas").bind("touchmove", function (event) {
		event.preventDefault();
	});

	$("canvas").bind("mousemove", function (event) {
		mouseMoved(event.pageX, event.pageY, canvas);
	});

	$("canvas").bind("mousedown", function (event) {
		event.preventDefault();
		mouseButtonPress();
	});

	$("canvas").bind("mouseup", function (event) {
		event.preventDefault();
		mouseButtonRelease();
	});

	$("canvas").bind("touchstart", function (event) {
		mouseMoved(event.targetTouches[0].pageX, event.targetTouches[0].pageY, canvas);
		event.preventDefault();
		mouseButtonPress();
	});

	$("canvas").bind("touchend", function (event) {
		mouseMoved(event.targetTouches[0].pageX, event.targetTouches[0].pageY, canvas);
		event.preventDefault();
		mouseButtonRelease();
	});

	ctx.clearRect(0, 0, screensize, screensize);

	scorelistRead();

	uiLoadPix();
	billLoadPix();

	gamestate = STATE_WAITING;
	if (level) {
		gameStart(level);
	} else {
		uiSetPauseButton(0);
	}
}
