var OS_WINGDOWS = 0;
var OS_OFF = -1;

var MIN_PC = 6;		/* OS >= MIN_PC means the OS is a PC OS */

var osname = ["wingdows", "apple", "next", "sgi", "sun", "palm", "os2", "bsd", "linux", "redhat", "hurd"];
var NUM_OS = osname.length;

var os_pictures = [];		/* array of OS pictures*/
var cursor = [];		/* array of OS cursors (drag/drop) */

function OS_load_pix() {
	var i;
	for (i = 0; i < NUM_OS; i++) {
		os_pictures[i] = UI_load_picture(osname[i], 1);
		if (i != 0)
			cursor[i] = UI_load_cursor(osname[i]);
	}
}

function OS_draw(index, x, y) {
	ctx.drawImage(os_pictures[index], x, y);
}

function OS_width() {
	return UI_picture_width(os_pictures[0]);
}

function OS_height() {
	return UI_picture_height(os_pictures[0]);
}

function OS_set_cursor(index) {
	UI_set_cursor(cursor[index]);
}

function OS_randpc() {
	return (RAND(MIN_PC, NUM_OS - 1));
}

function OS_ispc(index) {
	return (index >= MIN_PC);
}
