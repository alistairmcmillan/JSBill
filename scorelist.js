var NAMELEN = 20;
var SCORES = 10;
var scores = [];
var score_str;

function Score() {
	var name;
	var level;
	var score;
};

var scores;

// TODO
function Scorelist_read() {
	var scorefile = null; // TODO = fopen(SCOREFILE, "r");
	var i;
	
	if (scorefile != null) {
		for (i = 0; i < SCORES; i++)
			fscanf(scorefile, "%20s%d%d\n", scores[i].name, scores[i].level, scores[i].score);
		fclose(scorefile);
	} else {
		for (i = 0; i < SCORES; i++) {
			scores[i] = new Score(); // TODO
			scores[i].name = "Anonymous";
			scores[i].level = 0;
			scores[i].score = 0;
		}
	}
}

// TODO
function Scorelist_write() {
/*
	var scorefile = fopen(SCOREFILE, "w");
	var i;
	if (scorefile == null)
		return;
	for (i = 0; i < SCORES; i++)
		fprintf(scorefile, "%-*s %d %d\n", NAMELEN,
			scores[i].name, scores[i].level, scores[i].score);
	fclose(scorefile);
*/
}

/*  Add new high score to list   */
// TODO
function Scorelist_recalc(str, level, score) {
	var i;
	var tname;
	var nl;

	if (scores[SCORES - 1].score >= score)
		return;
	for (i = SCORES - 1; i > 0; i--) {
		if (scores[i - 1].score < score) {
			strcpy (scores[i].name, scores[i - 1].name);
			scores[i].level = scores[i - 1].level;
			scores[i].score = scores[i - 1].score;
		}
		else
			break;
	}

	memset(tname, 0, sizeof(tname));
	if (str == null || str[0] == 0)
		strcpy(tname, "Anonymous");
	strncpy(tname, str, sizeof(tname) - 1);
	nl = strchr(tname,'\n');
	if (nl != null)
		nl = 0;
	
	strcpy(scores[i].name, tname);
	scores[i].level = level;
	scores[i].score = score;
}

// TODO
function Scorelist_update() {
	var i;
	score_str = "High Score:\n\n";
//	sprintf(str, "%s%-*s %6s %7s\n", str, NAMELEN, "Name", "Level", "Score");
	score_str = score_str + "Name Level Score\n";
	for (i = 0; i < SCORES; i++) {
//		sprintf(str, "%s%s %6d %7d\n", str, scores[i].name, scores[i].level, scores[i].score);
		score_str = score_str + scores[i].name + " " + scores[i].level + " " + scores[i].score + "\n";
	}
//	UI_update_dialog(DIALOG_HIGHSCORE, str);
}

function Scorelist_ishighscore(val) {
	return (val > scores[SCORES - 1].score);
}
