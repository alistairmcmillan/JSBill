var SPARK_SPEED = 4;

function SPARK_DELAY(level) {
	return (Math.max(20 - (level), 0));
}

function Spark_width() {
	return 20;
}

function Spark_height() {
	return 20;
}

function Spark_draw(x, y, index) {
	ctx.drawImage(sprites, (index*20)+358, 124, 20, 20, x, y, 20, 20);
}
