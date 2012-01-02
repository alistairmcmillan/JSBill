var cursor;
var bucketgrabbed;
var bucketwidth = 24;
var bucketheight = 24;

function Bucket_clicked(x, y) {
	return (x > 0 && x < bucketwidth && y > 0 && y < bucketheight);
}

function Bucket_draw() {
	if (!bucketgrabbed)
		ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
	else
		ctx.drawImage(sprites, 336, 124, 24, 24, mousex-12, mousey-12, 24, 24);
}

function Bucket_grab(x, y) {
	UI_set_cursor(cursor);
	bucketgrabbed = 1;
}

function Bucket_release(x, y) {
	var i;
	for (i = 0; i < Network_num_cables(); i++) {
		var cable = Network_get_cable(i);
		if (Cable_onspark(cable, x, y))
			Cable_reset(cable);
	}
	bucketgrabbed = 0;
}
