var OS_WINGDOWS = 0;
var OS_OFF = -1;
var oswidth = 28;
var osheight = 24;

var MIN_PC = 6;		/* OS >= MIN_PC means the OS is a PC OS */

var osname = ["wingdows", "apple", "next", "sgi", "sun", "palm", "os2", "bsd", "linux", "redhat", "hurd"];
var NUM_OS = osname.length;

var cursor = [];		/* array of OS cursors (drag/drop) */

function OS_draw(index, x, y) {
	ctx.drawImage(sprites, index*28, 124, 28, 24, x, y, 28, 24);
}

function OS_width() {
	return oswidth;
}

function OS_height() {
	return osheight;
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
