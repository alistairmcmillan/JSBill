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

//var lcels[WCELS], rcels[WCELS], acels[ACELS], dcels[DCELS];
var lcels = [];
var rcels = [];
var acels = [];
var dcels = [];
var billwidth, billheight;

function Bill() {
	this.state;		/* what is it doing? */
	this.index;		/* index of animation frame */
	this.cels;		/* array of animation frames */
	this.x;
	this.y;		/* location */
	this.target_x;		/* target x position */
	this.target_y;		/* target y position */
	this.target_c;		/* target computer */
	this.cargo;		/* which OS carried */
	this.x_offset;		/* accounts for width differences */
	this.y_offset;		/* 'bounce' factor for OS carried */
	this.sx;
	this.sy;		/* used for drawing extra OS during switch */
	this.prev
	this.next;
};

function get_border_bill(bill) {
	var i = RAND(0, 3);
	var screensize = Game_screensize();

	if (i % 2 == 0) {
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
			bill.x = - billwidth - 2;
			break;
	}
}

function get_border_target(bill) {
	var i = RAND(0, 3);
	var screensize = Game_screensize();

	if (i % 2 == 0) {
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

	if (i % 2 == 0) {
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
//	var bill;
	var computer;

//	bill = xalloc(sizeof bill);
//	bill = new Bill();

	bill.state = BILL_STATE_IN;
	get_border_bill(bill);
	bill.index = 0;
	bill.cels = lcels;
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
//	billp = bill;
}

function step_size(level) {
	return MIN(11 + level, 15);
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
	if (!xdist && !ydist)
		return 0;
	else if (xdist < step && ydist < step) {
		bill.x = bill.target_x;
		bill.y = bill.target_y;
	}
	else {
		dx = (xdist*step*signx)/(xdist+ydist);
		dy = (ydist*step*signy)/(xdist+ydist);
		if (mode == FAST) {
			dx *= 1.25;
			dy *= 1.25;
		}
		bill.x += dx;
		bill.y += dy;
		if (dx < 0)
			bill.cels = lcels;
		else if (dx > 0)
			bill.cels = rcels;
	}
	return 1;
}

function draw_std(bill) {
	if (bill.cargo >= 0)
		OS_draw(bill.cargo, bill.x + bill.x_offset,
			bill.y + bill.y_offset);
	ctx.drawImage(bill.cels[bill.index], bill.x, bill.y);
}

function draw_at(bill) {
	var computer = Network_get_computer(bill.target_c);
	if (bill.index > 6 && bill.index < 12)
		OS_draw(0, bill.x + bill.sx, bill.y + bill.sy);
	if (bill.cargo >= 0)
		OS_draw(bill.cargo, bill.x + bill.x_offset,
			bill.y + bill.y_offset);
	ctx.drawImage(bill.cels[bill.index], computer.x, computer.y);
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
	if (!moved && computer.os != OS_WINGDOWS && !computer.busy) {
		computer.busy = 1;
		bill.cels = acels;
		bill.index = 0;
		bill.state = BILL_STATE_AT;
		return;
	}
	else if (!moved) {
		var i;
		do {
			i = RAND(0, Network_num_computers() - 1);
		} while (i == bill.target_c);
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
	if (bill.index == 0 && computer.os == OS_OFF) {
		bill.index = 6;
		if (computer.stray == null)
			bill.cargo = -1;
		else {
			bill.cargo = computer.stray.cargo;
			Horde_remove_bill(computer.stray);
			computer.stray = null;
		}
	} else
		bill.index++;
	if (bill.index == 13) {
		bill.y_offset = -15;
		bill.x_offset = -2;
		get_border_target(bill);
		bill.index = 0;
		bill.cels = lcels;
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
		if (computer.os != OS_OFF) {
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
	if (bill.index < DCELS - 1){
		bill.y_offset += (bill.index * GRAVITY);
		bill.index++;	
	}
	else {
		bill.y += bill.y_offset;
		if (bill.cargo < 0 || bill.cargo == OS_WINGDOWS)
			Horde_remove_bill(bill);
		else {
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
	bill.cels = dcels;
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
	var i;
	for (i = 0; i < WCELS - 1; i++) {
		lcels[i] = new Image();
		rcels[i] = new Image();
		lcels[i].src = 'images/billL_'+i+'.png';
		rcels[i].src = 'images/billR_'+i+'.png';
//		lcels[i] = UI_load_picture_indexed("billL", i);
//		rcels[i] = UI_load_picture_indexed("billR", i);
	}
	lcels[WCELS - 1] = lcels[1];
	rcels[WCELS - 1] = rcels[1];

	for (i = 0; i < DCELS; i++) {
		dcels[i] = new Image();
		dcels[i] = UI_load_picture_indexed("billD", i);
	}
	billwidth = UI_picture_width(dcels[0]);
	billheight = UI_picture_height(dcels[0]);

	for (i = 0; i < ACELS; i++) {
		acels[i] = new Image();
		acels[i] = UI_load_picture_indexed("billA", i);
	}
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
