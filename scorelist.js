var NUMSCORES = 10;
var score_str;

var scores = [
    {
        "score": 2000,
        "level": 10,
        "name": "brian"
    },
    {
        "score": 1800,
        "level": 9,
        "name": "matias"
    },
    {
        "score": 1600,
        "level": 8,
        "name": "me"
    },
    {
        "score": 1400,
        "level": 7,
        "name": "me"
    },
    {
        "score": 1200,
        "level": 6,
        "name": "me"
    },
    {
        "score": 1000,
        "level": 5,
        "name": "me"
    },
    {
        "score": 800,
        "level": 4,
        "name": "me"
    },
    {
        "score": 600,
        "level": 3,
        "name": "me"
    },
    {
        "score": 400,
        "level": 2,
        "name": "me"
    },
    {
        "score": 200,
        "level": 1,
        "name": "me"
    }
];

function Scorelist_read() {
	if($.cookie("scores") != null) {
		scores = JSON.parse($.cookie("scores"));
	}
}

function Scorelist_write() {
	var convertedscores = JSON.stringify(scores);
	$.cookie('scores', convertedscores, { expires: 3650 });
}

/*  Add new high score to list   */
function Scorelist_recalc(str, level, score) {
	var i;
	var tname;
	var nl;

	if (scores[NUMSCORES - 1].score >= score)
		return;
	for (i = NUMSCORES - 1; i > 0; i--) {
		if (scores[i - 1].score < score) {
			scores[i].name = scores[i - 1].name;
			scores[i].level = scores[i - 1].level;
			scores[i].score = scores[i - 1].score;
		} else
			break;
	}

	if (str == null || str[0] == 0)
		tname = "Anonymous";
	tname = str;
	
	scores[i].name = tname;
	scores[i].level = level;
	scores[i].score = Math.floor(score);
}

function Scorelist_update() {
	var scoreTableId = document.getElementById("scoretable");
	var score_html = "<tr><th colspan=3>High Scores</th></tr>";
	score_html = score_html + "<tr><td>Name</td><td>Level</td><td>Score</td></tr>";
	for (var i = 0; i < scores.length; i++) {
		score_html = score_html + "<tr><td>" + scores[i].name + "</td><td>" + scores[i].level + "</td><td>" + scores[i].score + "</td></tr>";
	}
	scoreTableId.innerHTML = score_html;
}

function Scorelist_ishighscore(val) {
	return (val > scores[NUMSCORES - 1].score);
}
