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
var icon, about;
var defaultcursor;
var downcursor;
var grabbed;
var gui;
var screensize = SCREENSIZE;

function setup_level(newlevel) {
	level = newlevel;
	Horde_setup();
	grabbed = null;
	UI_set_cursor(defaultcursor);
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
	UI_kill_timer();
	UI_set_pausebutton(0);
}

function Game_quit() {
	Scorelist_write();
	exit(0);
}

function update_info() {
	var str;
	var on_screen = Horde_get_counter(HORDE_COUNTER_ON);
	var off_screen = Horde_get_counter(HORDE_COUNTER_OFF);
	var base = Network_get_counter(NETWORK_COUNTER_BASE);
	var off = Network_get_counter(NETWORK_COUNTER_OFF);
	var win = Network_get_counter(NETWORK_COUNTER_WIN);
	var units = Network_num_computers();
	$('p#scoreboard').empty();
	$('p#scoreboard').append("Bill:"+on_screen+"/"+off_screen+"  System:"+base+"/"+off+"/"+win+"  Level:"+level+"  Score:"+Math.floor(score));
	efficiency += ((100 * base - 10 * win) / units);
}

function Game_warp_to_level() {
	var lev = prompt("Warp to level?", "1");
	if (state == STATE_PLAYING) {
		if (lev <= level)
			return;
		setup_level(lev);
	}
	else {
		if (lev <= 0)
			return;
		Game_start(lev);
	}
}

function Game_add_high_score(str) {
	Scorelist_recalc(str, level, score);
}

function Game_button_press(event) { //x, y) {
	var counter;
	var x = event.pageX;
	var y = event.pageY;
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	if (state != STATE_PLAYING)
		return;
	UI_set_cursor(downcursor);

	if (Bucket_clicked(x, y)) {
		Bucket_grab(x, y);
		return;
	}

	grabbed = Horde_clicked_stray(x, y);
	if (grabbed != null) {
		OS_set_cursor(grabbed.cargo);
		return;
	}

	counter = Horde_process_click(x, y);
	score += (counter * counter * SCORE_BILLPOINTS);
}

function Game_button_release(event) {
	var i;
	var x = event.pageX;
	var y = event.pageY;
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
	
	UI_set_cursor(defaultcursor);

	if (state != STATE_PLAYING)
		return;

	if (grabbed == null) {
		Bucket_release(x, y);
		return;
	}

	for (i = 0; i < Network_num_computers(); i++) {
		var computer = Network_get_computer(i);

		if (Computer_on(computer, x, y) &&
		    Computer_compatible(computer, grabbed.cargo) &&
		    (computer.os == OS_WINGDOWS || computer.os == OS_OFF)) {
			var counter;

			Network_inc_counter(NETWORK_COUNTER_BASE, 1);
			if (computer.os == OS_WINGDOWS)
				counter = NETWORK_COUNTER_WIN;
			else
				counter = NETWORK_COUNTER_OFF;
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
		update_info();
		if (Horde_get_counter(HORDE_COUNTER_ON) + Horde_get_counter(HORDE_COUNTER_OFF) == 0) {
			score += (level * efficiency / iteration);
			state = STATE_BETWEEN;
		}
		if ((Network_get_counter(NETWORK_COUNTER_BASE) + Network_get_counter(NETWORK_COUNTER_OFF)) <= 1) {
			state = STATE_END;
		}
		break;
	case STATE_END:
		UI_set_cursor(defaultcursor);
		Network_toasters();
		Network_draw();
//		ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
//		UI_popup_dialog(DIALOG_ENDGAME);
		alert("Module xBill has caused a segmentation fault\nat memory address 097E:F1A0.  Core dumped.\n\nWe apologize for the inconvenience.");
		if (Scorelist_ishighscore(score)) {
//			UI_popup_dialog(DIALOG_ENTERNAME); TODO
			Scorelist_update();
		}
//		UI_popup_dialog(DIALOG_HIGHSCORE);
		alert(score_str);
		UI_kill_timer();
		UI_set_pausebutton(0);
		state = STATE_WAITING;
		break;
	case STATE_BETWEEN:
		UI_set_cursor(defaultcursor);
		alert("After Level  "+level+"\nScore: "+Math.floor(score));
		state = STATE_PLAYING;
		setup_level(++level);
		break;
	}
//	ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
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
	for ( ; dimensions > 0; dimensions--)
		d *= scale;
	return (d);
}

function main() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	$("canvas").unbind();
//	$("canvas").bind('click', function(event) {
//		handleClick(event);
//	});
	
	$("canvas").bind('mousedown', function(event) {
		Game_button_press(event);
	});
	
	$("canvas").bind('mouseup', function(event) {
		Game_button_release(event);
	});
	
//	srand(time(null));
//	UI_initialize(gui, argc, argv);
//	UI_make_main_window(screensize);
//	UI_graphics_init();
//	UI_load_picture("icon", 0, icon);
	UI_load_picture("about", 0, about);
	ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
//	UI_set_icon(icon);

	Scorelist_read();
	Scorelist_update();

	defaultcursor = new Image();
	defaultcursor = UI_load_cursor("hand_up");
//	downcursor = UI_load_cursor("hand_down");
//	UI_load_cursor("hand_down", downcursor);
	UI_set_cursor(defaultcursor);

	Bill_load_pix();
	OS_load_pix();
	Computer_load_pix();
	Bucket_load_pix();
	Spark_load_pix();

	state = STATE_WAITING;
	if (level)
		Game_start(level);
	else
		UI_set_pausebutton(0);
	UI_main_loop();
	
//	ctx.font = "bold 12px sans-serif";
//	ctx.textAlign = "center";
//	ctx.fillText("Click to start", 200, 200);
}
