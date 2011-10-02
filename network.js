var NETWORK_COUNTER_OFF = 0;
var NETWORK_COUNTER_BASE = 1;
var NETWORK_COUNTER_WIN = 2;
var NETWORK_COUNTER_MAX = 2;

var STD_MAX_COMPUTERS = 20;

var computers = [];
var ncomputers;
var cables = [];
var ncables;
var counters = []; 	/* number in each state */

function on(level) {
	var normal = MIN(8 + level, STD_MAX_COMPUTERS);
	return (normal * Game_scale(2));
}

/* sets up network for each level */
function Network_setup() {
	var i;	
	ncomputers = on(Game_level());
	if (computers != null)
		computers.length = 0;
	if (cables != null) {
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
	ncables = MIN(Game_level(), ncomputers/2);
	for (i = 0; i < ncables; i++) {
		cables[i] = new Cable();
		Cable_setup(cables[i]);
	}
}

/* redraws the computers at their location with the proper image */
function Network_draw () {
	var i;
	for (i = 0; i < ncables; i++)
		Cable_draw(cables[i]);
	for (i = 0; i < ncomputers; i++) {
		Computer_draw(computers[i]);
	}
}

function Network_update () {
	var i;
	for (i = 0; i < ncables; i++)
		Cable_update(cables[i]);
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
		if (computers[i].stray == bill)
			computers[i].stray = null;
	}
}

function Network_inc_counter(counter, val) {
	counters[counter] += val;
}

function Network_get_counter(counter) {
	return counters[counter];
}
