var OS_OFFSET = 4;			/* offset of screen from 0,0 */
var COMPUTER_TOASTER = 0	/* computer 0 is a toaster */

function BORDER(size) {		/* at least this far from a side */
	return size/10;
}

var MIN_PC = 6;		/* type >= MIN_PC means the computer is a PC */

var cpuname = ["toaster", "maccpu", "nextcpu", "sgicpu", "suncpu", "palmcpu", "os2cpu", "bsdcpu"];

var NUM_SYS = cpuname.length;

var cpu_pictures = [];		/* array of cpu pictures */
var width, height;

function computer() {
	this.type = 0;		/* CPU type */
	this.os = 0;	/* current OS */  // 0 is wingdows, -1 means off, anything else means other OS
	this.x = 0;
	this.y = 0;		/* location */
	this.busy = 0;	/* is the computer being used? */  // 1 is computer already targeted by a Bill, 0 is free to be targeted
	this.stray = 0;
};

function determineOS(computer) {
	if (computer.type < MIN_PC)
		return computer.type;
	else
		return OS_randpc();
}

function Computer_setup(computer, index) {
	var j, counter = 0, flag;
	var x, y;
	var screensize = Game_screensize();
	var border = BORDER(screensize);
	do {
		if (++counter > 4000)
			return 0;
		x = RAND(border, screensize - border - width);
		y = RAND(border, screensize - border - height);
		flag = 1;
		/* check for conflicting computer placement */
		for (j = 0; j < index && flag; j++) {
			var c = Network_get_computer(j);
			var twidth = width - BILL_OFFSET_X + Bill_width();
			// (Math.abs(computers[j].x - x) < 55) && (Math.abs(computers[j].y - y) < 45)
			if (UI_intersect(x, y, twidth, height, c.x, c.y, twidth, height)) {
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

function Computer_on(computer, locx, locy) {
	return (abs(locx - computer.x) < width &&
		abs(locy - computer.y) < height);
}

function Computer_compatible(computer, system) {
	return (computer.type == system ||
		(computer.type >= MIN_PC && OS_ispc(system)));
}

function Computer_draw(computer) {
	ctx.drawImage(cpu_pictures[computer.type], computer.x, computer.y);
//	UI_draw(cpu_pictures[computer.type], computer.x, computer.y);
	if (computer.os != OS_OFF) {
		ctx.drawImage(os_pictures[computer.os], computer.x + OS_OFFSET, computer.y + OS_OFFSET);
//		OS_draw(computer.os, computer.x + OS_OFFSET, computer.y + OS_OFFSET);
	}
}

function Computer_load_pix() {
	var i;
	for (i = 0; i < NUM_SYS; i++)
		cpu_pictures[i] = UI_load_picture(cpuname[i]);
	width = UI_picture_width(cpu_pictures[0]);
	height = UI_picture_height(cpu_pictures[0]);
}

function Computer_width() {
	return width;
}

function Computer_height() {
	return height;
}
