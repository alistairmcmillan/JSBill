var cursor;
var grabbed;
var bucketwidth = 24;
var bucketheight = 24;

function Bucket_clicked(x, y) {
	return (x > 0 && x < bucketwidth && y > 0 && y < bucketheight);
}

function Bucket_draw() {
	if (!grabbed)
		ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
}

function Bucket_grab(x, y) {
	UI_set_cursor(cursor);
	grabbed = 1;
}

function Bucket_release(x, y) {
	var i;
	for (i = 0; i < Network_num_cables(); i++) {
		var cable = Network_get_cable(i);
		if (Cable_onspark(cable, x, y))
			Cable_reset(cable);
	}
	grabbed = 0;
}
