var alive = null;
var strays = null;
// var counters = [];

var MAX_BILLS = 100;		/* max Bills per level */
var HORDE_COUNTER_OFF = 0;
var HORDE_COUNTER_ON = 0;
// var HORDE_COUNTER_MAX = 1;

function UNLINK(bill, list) {
	if (bill.next != null) {
		bill.next.prev = bill.prev;
	}
	if (bill.prev != null) {
		bill.prev.next = bill.next;
	} else if (bill == list) {
		list = bill.next;
	}
	bill.prev = null;
	bill.next = null;
	return list;
}

function PREPEND(bill, list) {
	bill.next = list;
	if (list != null) {
		list.prev = bill;
	} else {
	}
	list = bill;
	return list;
}

function on(lev) {
	var perlevel = ((8 + 3 * lev) * Game_scale(2));
	return MIN(perlevel, MAX_BILLS);
}

function max_at_once(lev) {
	return Math.round(MIN(2 + lev / 4, 12));
}

function between(lev) {
	return Math.round(MAX(14 - lev / 3, 10));
}

/*  Launches Bills whenever called  */
function launch(max) {
	var bill;
	var n;
	var off_screen = HORDE_COUNTER_OFF;

	if (max == 0 || off_screen == 0)
		return;
	n = RAND(1, MIN(max, off_screen));
	for (; n > 0; n--) {
		bill = new Bill();
		Bill_enter(bill);
		alive = PREPEND(bill, alive);
	}
}

function Horde_setup() {
	var bill;
	while (alive != null) {
		bill = alive;
		alive = UNLINK(bill, alive);
		bill = null;
	}
	while (strays != null) {
		bill = strays;
		strays = UNLINK(bill, strays);
		bill = null;
	}
	HORDE_COUNTER_OFF = on(Game_level());
	HORDE_COUNTER_ON = 0;
}

function Horde_update(iteration) {
	var bill, next;
	var level = Game_level();
	if (iteration % between(level) === 0) {
		launch(max_at_once(level));
	}
	for (bill = alive; bill != null; bill = next) {
		next = bill.next;
		Bill_update(bill);
	}
}

function Horde_draw() {
	var bill;

	for (bill = strays; bill != null; bill = bill.next) {
		Bill_draw(bill);
	}
	for (bill = alive; bill != null; bill = bill.next) {
		Bill_draw(bill);
	}
}

function Horde_move_bill(bill) {
	alive = UNLINK(bill, alive);
	strays = PREPEND(bill, strays);
}

function Horde_remove_bill(bill) {
	if (bill.state == BILL_STATE_STRAY)
		strays = UNLINK(bill, strays);
	else
		alive = UNLINK(bill, alive);
	Network_clear_stray(bill);
//	free(bill);
}

function Horde_add_bill(bill) {
	if (bill.state == BILL_STATE_STRAY)
		strays = PREPEND(bill, strays);
	else
		alive = PREPEND(bill, alive);
}

function Horde_clicked_stray(x, y) {
	var bill;

	for (bill = strays; bill != null; bill = bill.next) {
		if (!Bill_clickedstray(bill, x, y))
			continue;
		strays = UNLINK(bill, strays);
		return bill;
	}
	return null;
}

function Horde_process_click(x, y) {
	var bill;
	var counter = 0;

	for (bill = alive; bill != null; bill = bill.next) {
		if (bill.state == BILL_STATE_DYING || !Bill_clicked(bill, x, y))
			continue;
		if (bill.state == BILL_STATE_AT) {
			Computer *comp;
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
