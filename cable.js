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
};

function reverse(cable) {
	var _t;
	_t = cable.c1;
	cable.c1 = cable.c2;
	cable.c2 = _t;
	_t = cable.x1;
	cable.x1 = cable.x2;
	cable.x2 = _t;
	_t = cable.y1;
	cable.y1 = cable.y2;
	cable.y2 = _t;
}

function Cable_setup(cable) {
	var comp1, comp2;
	var cwidth, cheight;

	cable.c1 = RAND(0, Network_num_computers() - 1);
	do {
		cable.c2 = RAND(0, Network_num_computers() - 1);
	} while (cable.c2 == cable.c1);
	cable.active = 0;
	cable.index = 0;
	cable.delay = SPARK_DELAY(Game_level());

	comp1 = Network_get_computer(cable.c1);
	comp2 = Network_get_computer(cable.c2);
	cwidth = Computer_width();
	cheight = Computer_height();
	cable.x1 = Math.round(comp1.x + cwidth/3);
	cable.x2 = Math.round(comp2.x + cwidth/3);
	cable.y1 = Math.round(comp1.y + cheight/2);
	cable.y2 = Math.round(comp2.y + cheight/2);
}

function Cable_draw(cable) {
	UI_draw_line(cable.x1, cable.y1, cable.x2, cable.y2);
	if (cable.active) {
		var rx = cable.x - Spark_width()/2;
		var ry = cable.y - Spark_height()/2;
		Spark_draw(rx, ry, cable.index);
	}
}

function Cable_update(cable) {
	var comp1, comp2;
	comp1 = Network_get_computer(cable.c1);
	comp2 = Network_get_computer(cable.c2);

	if (cable.active) {
		if ((comp1.os == OS_WINGDOWS) == (comp2.os == OS_WINGDOWS))
			cable.active = 0;
		else if (comp1.os == OS_WINGDOWS || comp2.os == OS_WINGDOWS) {
			var xdist, ydist;
			var sx, sy;

			if (comp2.os == OS_WINGDOWS)
				reverse(cable);

			xdist = cable.x2 - cable.x;
			ydist = cable.y2 - cable.y;

			sx = xdist >= 0 ? 1.0 : -1.0;
			sy = ydist >= 0 ? 1.0 : -1.0;
			xdist = Math.abs(xdist);
			ydist = Math.abs(ydist);
			if (xdist == 0 && ydist == 0) {
				if (!comp2.busy) {
					var counter;
					if (comp2.os == OS_OFF)
						counter = NETWORK_COUNTER_OFF;
					else
						counter = NETWORK_COUNTER_BASE;
					Network_inc_counter(counter, -1);
					Network_inc_counter(NETWORK_COUNTER_WIN,
							    1);
					comp2.os = OS_WINGDOWS;
				}
				cable.active = 0;
			}
			else if (Math.max(xdist, ydist) < SPARK_SPEED) {
				cable.x = cable.x2;
				cable.y = cable.y2;
			}
			else {
				cable.fx+=(xdist*SPARK_SPEED*sx)/(xdist+ydist);
				cable.fy+=(ydist*SPARK_SPEED*sy)/(xdist+ydist);
				cable.x = cable.fx;
				cable.y = cable.fy;
			}
			cable.index = 1 - cable.index;
		}
	} else {
		if ((comp1.os == OS_WINGDOWS) == (comp2.os == OS_WINGDOWS))
			;
		else if (comp1.os == OS_WINGDOWS || comp2.os == OS_WINGDOWS) {
			cable.active = 1;
			cable.delay = SPARK_DELAY(Game_level());
			if (comp2.os == OS_WINGDOWS)
				reverse(cable);
			cable.x = cable.x1;
			cable.fx = cable.x1;
			cable.y = cable.y1;
			cable.fy = cable.y1;
		}
	}
}

function Cable_onspark(cable, locx, locy) {
	if (!cable.active)
		return 0;
	return (Math.abs(locx - cable.x) < Spark_width() &&
		Math.abs(locy - cable.y) < Spark_height());
}

function Cable_reset(cable) {
	cable.active = 0;
	cable.delay = SPARK_DELAY(Game_level());
}
