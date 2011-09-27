var bucketpicture;
var cursor;
var grabbed;

function Bucket_load_pix() {
	bucketpicture = UI_load_picture("bucket", 1);
	cursor = UI_load_cursor("bucket");
}

function Bucket_clicked(x, y) {
	return (x > 0 && x < UI_picture_width(bucketpicture) && y > 0 && y < UI_picture_height(bucketpicture));
}

function Bucket_draw() {
	if (!grabbed)
		ctx.drawImage(bucketpicture, 0, 0);
}

function Bucket_grab(x, y) {
	UNUSED(x);
	UNUSED(y);

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
