//var turn = 0;

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
//var defaultcursor;
var downcursor;
var grabbed;
var gui;
var screensize = SCREENSIZE;
var paused = 0;

function setup_level(newlevel) {
	level = newlevel;
	Horde_setup();
	grabbed = null;
//	UI_set_cursor(defaultcursor);
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
	if (paused == 0) {
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
	var str;
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

function Mouse_moved(event) {
	mousex = event.pageX - canvas.offsetLeft;
	mousey = event.pageY - canvas.offsetTop;
	console.log("Mouse position is " + mousex + " by " + mousey);
}

function Mouse_button_press(event) {
	var counter;
//	var x = event.pageX - canvas.offsetLeft;
//	var y = event.pageY - canvas.offsetTop;
	
	if (state != STATE_PLAYING || paused == 1)
		return;
	UI_set_cursor(downcursor);

	if (Bucket_clicked(mousex, mousey)) {
		Bucket_grab(mousex, mousey);
		return;
	}

	grabbed = Horde_clicked_stray(mousex, mousey);
	if (grabbed != null) {
		OS_set_cursor(grabbed.cargo);
		return;
	}

	counter = Horde_process_click(mousex, mousey);
	score += (counter * counter * SCORE_BILLPOINTS);
}

function Mouse_button_release(event) {
	var i;
//	var x = event.pageX - canvas.offsetLeft;
//	var y = event.pageY - canvas.offsetTop;
	
//	UI_set_cursor(defaultcursor);

	if (state != STATE_PLAYING || paused == 1)
		return;

	if (grabbed == null) {
		Bucket_release(mousex, mousey);
		return;
	}

	for (i = 0; i < Network_num_computers(); i++) {
		var computer = Network_get_computer(i);

		if (Computer_on(computer, mousex, mousey) &&
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
//	console.log("Game_update " + turn++)
	var str;

	switch (state) {
	case STATE_PLAYING:
		ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
		// TODO
		Bucket_draw();
		Network_update();
		Network_draw();
		Horde_update(iteration);
		Horde_draw();
		UI_draw_cursor();
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
//		UI_set_cursor(defaultcursor);
		ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
		Network_toasters();
		Network_draw();
//		alert("Module xBill has caused a segmentation fault\nat memory address 097E:F1A0.  Core dumped.\n\nWe apologize for the inconvenience.");
		if (Scorelist_ishighscore(score)) {
			var name = prompt("You earned a high score.\nEnter your name:");
			if (name == null)
				name = "Anonymous";
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
//		UI_set_cursor(defaultcursor);
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
	ctx.font = "bold 12px sans-serif";
	$("canvas").unbind();
//	$("canvas").bind('click', function(event) {
//		handleClick(event);
//	});

//	$("canvas").bind('click', function(event) {
//		event.preventDefault();
//	});

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
	
//	srand(time(null));
	ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
//	UI_set_icon(icon);

	Scorelist_read();
	Scorelist_update();

//	defaultcursor = new Image();
//	defaultcursor = UI_load_cursor("hand_up");
//	downcursor = UI_load_cursor("hand_down");
//	UI_load_cursor("hand_down", downcursor);
//	UI_set_cursor(defaultcursor);

	UI_load_pix();
	Bill_load_pix();

	state = STATE_WAITING;
	if (level)
		Game_start(level);
	else
		UI_set_pausebutton(0);
	UI_main_loop();
	
//	ctx.textAlign = "center";
//	ctx.fillText("Click to start", 200, 200);
}
