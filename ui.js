var playing = 0
var methods
var dialog_strings
var menu_strings
var timer = 0;

/*
 * Timer operations
 */

function timer_tick() {
	UI_restart_timer();
	Game_update();
	return true;
}

function start_timer(ms) {
	if (timer == 0) {
		timer = setInterval(timer_tick, ms);
	}
}

function stop_timer() {
	if (timer != 0) {
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
	if (timer_active())	{
		playing = 1;
	}
	UI_kill_timer();
}

function UI_resume_game() {
	if (playing && !timer_active())
		UI_restart_timer();
	playing = 0;
}

/*
 * Window routines
 */
/*
function guimap() {
	var name;
	var methodsp;
}
*/

/*
function guis() {
#ifdef USE_GTK
	{"gtk", gtk_ui_setmethods},
#endif
#ifdef USE_MOTIF
	{"motif", x11_motif_setmethods},
#endif
#ifdef USE_ATHENA
	{"athena", x11_athena_setmethods},
#endif
	{null, null},
};
*/

function UI_initialize(gui) {
	var map;
	if (gui == null) {
		map = guis;
	//	if (map.name == null)
	//		fatal("no configured GUIs");
		map.setmethods(methods);
	} else {
		for (map = guis; map.name != null; map++)
			if (strcasecmp(gui, map.name) == 0)
				break;
	//	if (map.name == null)
	//		fatal("GUI '%s' not found", gui);
		map.setmethods(methods);
	}
//	methods.initialize(argc, argv);
}

/*
function UI_make_main_window(size) {
	menu_strings[DIALOG_NEWGAME] = newgame_menu_str;
	menu_strings[DIALOG_PAUSEGAME] = pause_menu_str;
	menu_strings[DIALOG_WARPLEVEL] = warp_menu_str;
	menu_strings[DIALOG_HIGHSCORE] = highscore_menu_str;
	menu_strings[DIALOG_QUITGAME] = quit_menu_str;
	menu_strings[DIALOG_STORY] = story_menu_str;
	menu_strings[DIALOG_RULES] = rules_menu_str;
	menu_strings[DIALOG_ABOUT] = about_menu_str;
	menu_strings[DIALOG_SCORE] = score_menu_str;
	menu_strings[DIALOG_ENDGAME] = endgame_menu_str;
	menu_strings[DIALOG_ENTERNAME] = entername_menu_str;
//	methods.make_main_window(size);
}
*/

function UI_graphics_init() {
//	methods.graphics_init();
}

/*
function UI_make_dialogs(logo, icon, about) {
	dialog_strings[DIALOG_NEWGAME] = newgame_dialog_str;
	dialog_strings[DIALOG_PAUSEGAME] = pause_dialog_str;
	dialog_strings[DIALOG_WARPLEVEL] = warp_dialog_str;
	dialog_strings[DIALOG_HIGHSCORE] = null;
	dialog_strings[DIALOG_QUITGAME] = quit_dialog_str;
	dialog_strings[DIALOG_STORY] = story_dialog_str;
	dialog_strings[DIALOG_RULES] = rules_dialog_str;
	dialog_strings[DIALOG_ABOUT] = null;
	dialog_strings[DIALOG_SCORE] = null;
	dialog_strings[DIALOG_ENDGAME] = endgame_dialog_str;
	dialog_strings[DIALOG_ENTERNAME] = entername_dialog_str;
//	methods.create_dialogs(logo, icon, about);
}
*/

function UI_popup_dialog(dialog) {
//	methods.popup_dialog(dialog);
}

/*
 * Graphics routines
 */

function UI_set_cursor(cursor) {
//	methods.set_cursor(cursor);
}

function UI_set_icon(icon) {
//	methods.set_icon(icon);
}

function UI_draw_line(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
//	methods.draw_line(x1, y1, x2, y2);
}

function UI_draw_str(str, x, y) {
//	methods.draw_string(str, x, y);
}

/*
 * Other routines
 */

function UI_set_pausebutton (action) {
//	methods.set_pausebutton(action);
}

function UI_main_loop() {
//	methods.main_loop();
}

function UI_load_picture_indexed(name, index)
{
	return UI_load_picture(name+'_'+index);
}

function UI_load_picture(name) {
	var image = new Image();
	image.src = 'images/'+name+'.png';
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
	image.src = 'images/'+name+'.png';
	return image;
}

// TODO
function UI_intersect(x1, y1, w1, h1, x2, y2, w2, h2) {
	// TODO	 ((Math.abs(computers[j].x - x) < 55) && (Math.abs(computers[j].y - y) < 45))
	return ((Math.abs(x2 - x1 + (w2 - w1) / 2) < (w1 + w2) / 2) && (Math.abs(y2 - y1 + (h2 - h1) / 2) < (h1 + h2) / 2));
}

function UI_update_dialog(index, str) {
//	methods.update_dialog(index, str);
}

function UI_dialog_string(index) {
	return dialog_strings[index];
}

function UI_menu_string(index) {
	return menu_strings[index];
}
