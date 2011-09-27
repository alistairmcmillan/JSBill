var spark_pictures = [];

var SPARK_SPEED = 4;

function SPARK_DELAY(level) {
	return (MAX(20 - (level), 0));
}

function Spark_load_pix() {
	var i;
	for (i = 0; i < 2; i++)
		spark_pictures[i] = UI_load_picture_indexed("spark", i);
}

function Spark_width() {
	return UI_picture_width(spark_pictures[0]);
}

function Spark_height() {
	return UI_picture_height(spark_pictures[0]);
}

function Spark_draw(x, y, index) {
	ctx.drawImage(spark_pictures[index], x, y);
}
