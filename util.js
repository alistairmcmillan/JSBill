function RAND(lb, ub) {
//	(rand() % ((ub) - (lb) + 1) + (lb));
//		y = Math.floor(Math.random()*(screensize-border-45))+border;
	return Math.floor(Math.random()*((ub) - (lb) + 1) + (lb));
}

function MAX(x, y) {
	return ((x) > (y) ? (x) : (y));
}

function MIN(x, y) {
	return ((x) < (y) ? (x) : (y));
}
