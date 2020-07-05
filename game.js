'use strict';

let mousex = 0;
let mousey = 0;

let ctx;

// Game states
const STATE_PLAYING = 1;
const STATE_BETWEEN = 2;
const STATE_END = 3;
const STATE_WAITING = 4;

// Score related constants
const SCORE_BILLPOINTS = 5;

let gamestate;
let efficiency;
let score;
let level;
let iteration;
let grabbed;
const SCREENSIZE = 400;
let paused = 0;

let timer = 0;
let sprites;
let grabbedos;
let audioMssound;
const AUDIOAHH = new Array(4);

let numScores = 0;

const BILL_STATE_IN = 1;
const BILL_STATE_AT = 2;
const BILL_STATE_OUT = 3;
const BILL_STATE_DYING = 4;
const BILL_STATE_STRAY = 5;

// Offsets from upper right of computer
const BILL_OFFSET_X = 20;
const BILL_OFFSET_Y = 3;

// speed at which OS drops
const GRAVITY = 3;

// speed of moving Bill
const SLOW = 0;
const FAST = 1;

const WCELS = 4;             // # of bill walking animation frames
const DCELS = 5;             // # of bill dying animation frames

const BILLWIDTH = 24;
const BILLHEIGHT = 38;

const OS_OFFSET = 4;         // offset of screen from 0,0
const COMPUTER_TOASTER = 0;  // computer 0 is a toaster

const MIN_PC = 6;            // type >= MIN_PC means the computer is a PC

const CPUNAME = ['toaster', 'maccpu', 'nextcpu', 'sgicpu',
               'suncpu', 'palmcpu', 'os2cpu', 'bsdcpu'];
const NUMSYS = CPUNAME.length;

const COMPWIDTH = 55;
const COMPHEIGHT = 45;

const SPARKSPEED = 4;

let bucketgrabbed = 0;
const BUCKETWIDTH = 24;
const BUCKETHEIGHT = 24;

const OS_WINGDOWS = 0;
const OS_OFF = -1;
const OSWIDTH = 28;
const OSHEIGHT = 24;

const OSNAME = ['wingdows', 'apple', 'next', 'sgi', 'sun', 'palm',
                'os2', 'bsd', 'linux', 'redhat', 'hurd', 'beos'];
const NUMOS = OSNAME.length;

const NETWORK_COUNTER_OFF = 0;
const NETWORK_COUNTER_BASE = 1;
const NETWORK_COUNTER_WIN = 2;

const STD_MAX_COMPUTERS = 20;

const computers = [];
let ncomputers;
const cables = [];
let ncables;
const counters = [];         // number in each state

let alive = null;
let strays = null;

const MAXBILLS = 100;       // max Bills per level
let HORDE_COUNTER_OFF = 0;
let HORDE_COUNTER_ON = 0;

function rand(lb, ub) {
  return Math.floor(Math.random() * ((ub) - (lb) + 1) + (lb));
}

// Timer operations
function uiRestartTimer() {
  if (timer === 0) {
    timer = setInterval(timerTick, 200);
  }
}

function timerTick() {
  uiRestartTimer();
  gameUpdate();
  return true;
}

function uiKillTimer() {
  if (timer !== 0) {
    clearInterval(timer);
  }
  timer = 0;
}

// Graphics routines
function bucketDraw() {
  if (!bucketgrabbed) {
    ctx.drawImage(sprites, 336, 124, 24, 24, 0, 0, 24, 24);
  } else {
    ctx.drawImage(sprites, 336, 124, 24, 24, mousex - 12, mousey - 12, 24, 24);
  }
}

function uiDrawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Other routines
function uiSetPausebutton(action) {
  if (action === 1) {
    document.getElementById('pauseHref').disabled = false;
    document.getElementById('pauseHref').textContent = 'Pause Game';
  } else {
    document.getElementById('pauseHref').textContent = 'Resume Game';
  }
}

function uiIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return ((Math.abs(x2 - x1 + (w2 - w1) / 2) < (w1 + w2) / 2) &&
          (Math.abs(y2 - y1 + (h2 - h1) / 2) < (h1 + h2) / 2));
}

function uiLoadPix() {
  sprites = new Image();
  sprites.src = 'images/sprites.png';
}

function uiLoadAudio() {
  audioMssound = new Howl({src: ['wavs/mssound.wav']});
  AUDIOAHH[0] = new Howl({src: ['wavs/ahh0.wav']});
  AUDIOAHH[1] = new Howl({src: ['wavs/ahh1.wav']});
  AUDIOAHH[2] = new Howl({src: ['wavs/ahh2.wav']});
  AUDIOAHH[3] = new Howl({src: ['wavs/ahh3.wav']});
}

// Story
function storyShow() {
  if (document.getElementById('storydiv').style.display === 'none') {
    document.getElementById('storydiv').style.display = 'block';
  } else {
    document.getElementById('storydiv').style.display = 'none';
  }
}

function storyHide() {
  document.getElementById('storydiv').style.display = 'none';
}

// Scorelist
const scores = new Array([]);

function scorelistShow() {
  if (document.getElementById('scorediv').style.display === 'none') {
    document.getElementById('scorediv').style.display = 'block';
  } else {
    document.getElementById('scorediv').style.display = 'none';
  }
}

function scorelistHide() {
  document.getElementById('scorediv').style.display = 'none';
}

function scorelistRead() {
  $.ajax({
    url: 'get_scores.php', data: '', dataType: 'json', success: function(rows) {
      console.log('get_scores.php returned successfully');
      $('table#scoretable tbody tr').remove();
      let i;
      let t;
      let d;
      let timestamp;
      console.log('There are ' + rows.length + ' rows.');
      for (i = 0; i < rows.length; i++) {
        t = rows[i].date.split(/[- :]/);
        d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
        scores.push({'score': rows[i].score,
                     'level': rows[i].level,
                     'name': rows[i].name,
                     'date': rows[i].date});
        numScores++;
        timestamp = ( d.getHours() < 10 ? '0' : '' ) +
                      d.getHours() + ':' +
                    ( d.getMinutes() < 10 ? '0' : '' ) +
                      d.getMinutes() + ' ' +
                    ( d.getDate() < 10 ? '0' : '' ) +
                      d.getDate() + '/' +
                   ( (d.getMonth()+1) < 10 ? '0' : '' ) +
                     (d.getMonth()+1) + '/' +
                      d.getFullYear();
        $('table#scoretable tbody').append('<tr><td>' + rows[i].name +
                                           '</td><td>' + rows[i].level +
                                           '</td><td>' + rows[i].score +
                                           '</td><td>' + timestamp +
                                           '</td></tr>');
        console.log('Added ' + rows[i].name + ' from ' + timestamp + '.');
      }
      scores.shift();
      numScores = scores.length;
    }
  });
}

// Add new high score to list
function scorelistRecalc(str, level, score) {
  let i;
  let tname;

  if (scores[numScores - 1].score >= score) {
    return;
  }
  for (i = numScores - 1; i > 0; i--) {
    if (scores[i - 1].score < score) {
      scores[i].name = scores[i - 1].name;
      scores[i].level = scores[i - 1].level;
      scores[i].score = scores[i - 1].score;
    } else {
      break;
    }
  }

  if (str === null || str[0] === 0) {
    tname = 'Anonymous';
  }
  tname = str;

  scores[i].name = tname;
  scores[i].level = level;
  scores[i].score = Math.floor(score);
  $.ajax({
    url: 'save_score.php',
    data: {level: level,
           name: tname,
           score: Math.floor(score),
           date: Date.now()
          },
    dataType: 'json',
    success: function(rows) {
      // Update copy of scores since we've just added one
      console.log('Calling scorelistRead()...');
      scorelistRead();
    }
  });
}

function scorelistIsHighScore(val) {
  return (val > scores[numScores - 1].score);
}

// Bill
function Bill() {
  this.state;    // what is it doing?
  this.index;    // index of animation frame
  this.x;
  this.y;        // location
  this.dx;       // direction
  this.target_x; // target x position
  this.target_y; // target y position
  this.target_c; // target computer
  this.dx;       // direction
  this.dx;       // direction
  this.dx;       // direction
  this.cargo;    // which OS carried
  this.x_offset; // accounts for width differences
  this.y_offset; // 'bounce' factor for OS carried
  this.sx;
  this.sy;       // used for drawing extra OS during switch
  this.prev;
  this.next;
}

function getBorderBill(bill) {
  let i = rand(0, 3);

  if (i % 2 === 0) {
    bill.x = rand(0, SCREENSIZE - BILLWIDTH);
  } else {
    bill.y = rand(0, SCREENSIZE - BILLHEIGHT);
  }

  switch (i) {
  case 0:
    bill.y = -BILLHEIGHT - 16;
    break;
  case 1:
    bill.x = SCREENSIZE + 1;
    break;
  case 2:
    bill.y = SCREENSIZE + 1;
    break;
  case 3:
    bill.x = -BILLWIDTH - 2;
    break;
  }
}

function getBorderTarget(bill) {
  let i = rand(0, 3);

  if (i % 2 === 0) {
    bill.target_x = rand(0, SCREENSIZE - BILLWIDTH);
  } else {
    bill.target_y = rand(0, SCREENSIZE - BILLHEIGHT);
  }

  switch (i) {
  case 0:
    bill.target_y = -BILLHEIGHT - 16;
    break;
  case 1:
    bill.target_x = SCREENSIZE + 1;
    break;
  case 2:
    bill.target_y = SCREENSIZE + 1;
    break;
  case 3:
    bill.target_x = -BILLWIDTH - 2;
    break;
  }
}

function osDraw(index, x, y) {
  ctx.drawImage(sprites, index * 28, 124, 28, 24, x, y, 28, 24);
}

function hordeIncCounter(counter, val) {
  counter += val;
  return counter;
}

function hordeGetCounter(counter) {
  return counter;
}

function networkIncCounter(counter, val) {
  counters[counter] += val;
}

function gameScale(dimensions) {
  const SCALE = 1;
  let d = 1;
  for (dimensions; dimensions > 0; dimensions--) {
    d *= SCALE;
  }
  return (d);
}

function osIsPc(index) {
  return (index >= MIN_PC);
}

// Adds a bill to the in state
function billEnter(bill) {
  bill.state = BILL_STATE_IN;
  getBorderBill(bill);
  bill.index = 0;
  bill.cargo = OS_WINGDOWS;
  bill.x_offset = -2;
  bill.y_offset = -15;
  bill.target_c = rand(0, ncomputers - 1);
  const COMPUTER = computers[bill.target_c];
  bill.target_x = COMPUTER.x + COMPWIDTH - BILL_OFFSET_X;
  bill.target_y = COMPUTER.y + BILL_OFFSET_Y;
  HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, 1);
  HORDE_COUNTER_OFF = hordeIncCounter(HORDE_COUNTER_OFF, -1);
  bill.prev = null;
  bill.next = null;
}

function stepSize(level) {
  return Math.min(11 + level, 15);
}

// Moves bill toward his target - returns whether or not he moved
function billMove(bill, mode) {
  let xdist;
  let ydist;
  let dx;
  let dy;

  xdist = bill.target_x - bill.x;
  ydist = bill.target_y - bill.y;
  const STEP = stepSize(level);
  const SIGNX = xdist >= 0 ? 1 : -1;
  const SIGNY = ydist >= 0 ? 1 : -1;

  xdist = Math.abs(xdist);
  ydist = Math.abs(ydist);

  if (!xdist && !ydist) {
    return 0;
  } else if (xdist < STEP && ydist < STEP) {
    bill.x = bill.target_x;
    bill.y = bill.target_y;
  } else {
    dx = (xdist * STEP * SIGNX) / (xdist + ydist);
    dy = (ydist * STEP * SIGNY) / (xdist + ydist);
    if (mode === FAST) {
      dx *= 1.25;
      dy *= 1.25;
    }
    bill.dx = dx;
    bill.x += dx;
    bill.y += dy;
  }
  return 1;
}

function drawStd(bill) {
  if (bill.cargo >= 0) {
    osDraw(bill.cargo, bill.x + bill.x_offset, bill.y + bill.y_offset);
  }
  if (bill.state === BILL_STATE_DYING) {
    // dcels
    ctx.drawImage(sprites,
                  (bill.index * 24) + 192, 0, 24, 38,
                  bill.x, bill.y, 24, 38);
  } else if (bill.dx > 0) {
    // rcels
    ctx.drawImage(sprites,
                  (bill.index * 24) + 96, 0, 24, 38,
                  bill.x, bill.y, 24, 38);
  } else {
    // lcels
    ctx.drawImage(sprites,
                  bill.index * 24, 0, 24, 38,
                  bill.x, bill.y, 24, 38);
  }
}

function drawAt(bill) {
  const COMPUTER = computers[bill.target_c];
  if (bill.index > 6 && bill.index < 12) {
    osDraw(0, bill.x + bill.sx, bill.y + bill.sy);
  }
  if (bill.cargo >= 0) {
    osDraw(bill.cargo, bill.x + bill.x_offset, bill.y + bill.y_offset);
  }
  // acels
  ctx.drawImage(sprites,
                bill.index * 58, 38, 58, 41,
                COMPUTER.x, COMPUTER.y, 58, 41);
}

function drawStray(bill) {
  osDraw(bill.cargo, bill.x, bill.y);
}

function billDraw(bill) {
  switch (bill.state) {
  case BILL_STATE_IN:
  case BILL_STATE_OUT:
  case BILL_STATE_DYING:
    drawStd(bill);
    break;
  case BILL_STATE_AT:
    drawAt(bill);
    break;
  case BILL_STATE_STRAY:
    drawStray(bill);
    break;
  default:
    break;
  }
}

// Update Bill's position
function updateIn(bill) {
  const MOVED = billMove(bill, SLOW);
  let computer;
  let i;

  computer = computers[bill.target_c];
  if (!MOVED && computer.os !== OS_WINGDOWS && !computer.busy) {
    computer.busy = 1;
    bill.index = 0;
    bill.state = BILL_STATE_AT;
    return;
  } else if (!MOVED) {
    do {
      i = rand(0, ncomputers - 1);
    } while (i === bill.target_c);
    computer = computers[i];
    bill.target_c = i;
    bill.target_x = computer.x + COMPWIDTH - BILL_OFFSET_X;
    bill.target_y = computer.y + BILL_OFFSET_Y;
  }
  bill.index+=1;
  bill.index %= WCELS;
  bill.y_offset += (8 * (bill.index % 2) - 4);
}

function networkClearStray(bill) {
  let i;
  for (i = 0; i < ncomputers; i+=1) {
    if (computers[i].stray === bill) {
      computers[i].stray = null;
    }
  }
}

function unlink(bill, list) {
  if (bill.next !== null) {
    bill.next.prev = bill.prev;
  }
  if (bill.prev !== null) {
    bill.prev.next = bill.next;
  } else if (bill === list) {
    list = bill.next;
  }
  bill.prev = null;
  bill.next = null;
  return list;
}

function hordeRemoveBill(bill) {
  if (bill.state === BILL_STATE_STRAY) {
    strays = unlink(bill, strays);
  } else {
    alive = unlink(bill, alive);
  }
  networkClearStray(bill);
}

function osHeight() {
  return OSHEIGHT;
}

// Update Bill standing at a computer
function updateAt(bill) {
  const COMPUTER = computers[bill.target_c];
  if (bill.index === 0 && COMPUTER.os === OS_OFF) {
    bill.index = 6;
    if (COMPUTER.stray === null) {
      bill.cargo = -1;
    } else {
      bill.cargo = COMPUTER.stray.cargo;
      hordeRemoveBill(COMPUTER.stray);
      COMPUTER.stray = null;
    }
  } else {
    bill.index+=1;
  }
  if (bill.index === 13) {
    bill.y_offset = -15;
    bill.x_offset = -2;
    getBorderTarget(bill);
    bill.index = 0;
    bill.state = BILL_STATE_OUT;
    COMPUTER.busy = 0;
    return;
  }
  bill.y_offset = BILLHEIGHT - osHeight();
  switch (bill.index) {
  case 1:
  case 2:
    bill.x -= 8;
    bill.x_offset += 8;
    break;
  case 3:
    bill.x -= 10;
    bill.x_offset += 10;
    break;
  case 4:
    bill.x += 3;
    bill.x_offset -= 3;
    break;
  case 5:
    bill.x += 2;
    bill.x_offset -= 2;
    break;
  case 6:
    if (COMPUTER.os !== OS_OFF) {
      networkIncCounter(NETWORK_COUNTER_BASE, -1);
      networkIncCounter(NETWORK_COUNTER_OFF, 1);
      bill.cargo = COMPUTER.os;
    } else {
      bill.x -= 21;
      bill.x_offset += 21;
    }
    COMPUTER.os = OS_OFF;
    bill.y_offset = -15;
    bill.x += 20;
    bill.x_offset -= 20;
    break;
  case 7:
    bill.sy = bill.y_offset;
    bill.sx = -2;
    break;
  case 8:
    bill.sy = -15;
    bill.sx = -2;
    break;
  case 9:
    bill.sy = -7;
    bill.sx = -7;
    bill.x -= 8;
    bill.x_offset += 8;
    break;
  case 10:
    bill.sy = 0;
    bill.sx = -7;
    bill.x -= 15;
    bill.x_offset += 15;
    break;
  case 11:
    bill.sy = 0;
    bill.sx = -7;
    COMPUTER.os = OS_WINGDOWS;
    networkIncCounter(NETWORK_COUNTER_OFF, -1);
    networkIncCounter(NETWORK_COUNTER_WIN, 1);
    audioMssound.play();
    break;
  case 12:
    bill.x += 11;
    bill.x_offset -= 11;
    break;
  }
}

// Updates Bill fleeing with his ill gotten gain
function updateOut(bill) {
  if (uiIntersect(bill.x, bill.y, BILLWIDTH, BILLHEIGHT,
                   0, 0, SCREENSIZE, SCREENSIZE)) {
    billMove(bill, FAST);
    bill.index+=1;
    bill.index %= WCELS;
    bill.y_offset += (8 * (bill.index % 2) - 4);
  } else {
    hordeRemoveBill(bill);
    HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, -1);
    HORDE_COUNTER_OFF = hordeIncCounter(HORDE_COUNTER_OFF, 1);
  }
}

function prepend(bill, list) {
  bill.next = list;
  if (list !== null) {
    list.prev = bill;
  }
  list = bill;
  return list;
}

function hordeMoveBill(bill) {
  alive = unlink(bill, alive);
  strays = prepend(bill, strays);
}

// Updates a Bill who is dying
function updateDying(bill) {
  if (bill.index < DCELS - 1) {
    bill.y_offset += (bill.index * GRAVITY);
    bill.index+=1;
  } else {
    bill.y += bill.y_offset;
    if (bill.cargo < 0 || bill.cargo === OS_WINGDOWS) {
      hordeRemoveBill(bill);
    } else {
      hordeMoveBill(bill);
      bill.state = BILL_STATE_STRAY;
    }
    HORDE_COUNTER_ON = hordeIncCounter(HORDE_COUNTER_ON, -1);
  }
}

function billUpdate(bill) {
  switch (bill.state) {
  case BILL_STATE_IN:
    updateIn(bill);
    break;
  case BILL_STATE_AT:
    updateAt(bill);
    break;
  case BILL_STATE_OUT:
    updateOut(bill);
    break;
  case BILL_STATE_DYING:
    updateDying(bill);
    break;
  default:
    break;
  }
}

function billSetDying(bill) {
  bill.index = -1;
  bill.x_offset = -2;
  bill.y_offset = -15;
  bill.state = BILL_STATE_DYING;

  const RANDOMAUDIO = Math.round(Math.random() * 3);
  AUDIOAHH[RANDOMAUDIO].play();
}

function billClicked(bill, locx, locy) {
  return (locx > bill.x && locx < bill.x + BILLWIDTH &&
          locy > bill.y && locy < bill.y + BILLHEIGHT);
}

function osWidth() {
  return OSWIDTH;
}

function billClickedStray(bill, locx, locy) {
  return (locx > bill.x && locx < bill.x + osWidth() &&
          locy > bill.y && locy < bill.y + osHeight());
}

function billWidth() {
  return BILLWIDTH;
}

// Computer
function Computer() {
  this.type = 0; // CPU type
  this.os = 0;   // current OS
                 // 0 is wingdows
                 // -1 means off
                 // anything else means other OS
  this.x = 0;
  this.y = 0;    // location
  this.busy = 0; // is the computer being used?
                 // 1 is computer already targeted by a Bill
                 // 0 is free to be targeted
  this.stray = 0;
}

function osRandPc() {
  return (rand(MIN_PC, NUMOS - 1));
}

function determineOS(computer) {
  if (computer.type < MIN_PC) {
    return computer.type;
  } else {
    return osRandPc();
  }
}

function computerSetup(computer, index) {
  const BORDER = SCREENSIZE / 10;
  let j;
  let counter;
  let flag;
  let x;
  let y;
  let c;
  let twidth;

  counter = 0;
  do {
    if (++counter > 4000) {
      return 0;
    }
    x = rand(BORDER, SCREENSIZE - BORDER - COMPWIDTH);
    y = rand(BORDER, SCREENSIZE - BORDER - COMPHEIGHT);
    flag = 1;
    // check for conflicting computer placement
    for (j = 0; j < index && flag; j+=1) {
      c = computers[j];
      twidth = COMPWIDTH - BILL_OFFSET_X + billWidth();
      if (uiIntersect(x, y, twidth, COMPHEIGHT, c.x, c.y, twidth, COMPHEIGHT)) {
        flag = 0;
      }
    }
  } while (!flag);
  computer.x = x;
  computer.y = y;
  computer.type = rand(1, NUMSYS - 1);
  computer.os = determineOS(computer);
  computer.busy = 0;
  computer.stray = null;
  return 1;
}

function computerOn(computer, locx, locy) {
  return (Math.abs(locx - computer.x) < COMPWIDTH &&
      Math.abs(locy - computer.y) < COMPHEIGHT);
}

function computerCompatible(computer, system) {
  return (computer.type === system ||
          (computer.type >= MIN_PC && osIsPc(system)));
}

function computerDraw(computer) {
  ctx.drawImage(sprites,
                computer.type * 55, 79, 55, 45,
                computer.x, computer.y, 55, 45);
  if (computer.os !== OS_OFF) {
    ctx.drawImage(sprites,
                  computer.os * 28, 124, 28, 24,
                  computer.x + OS_OFFSET, computer.y + OS_OFFSET, 28, 24);
  }
}

// Spark
function sparkDelay(level) {
  return (Math.max(20 - (level), 0));
}

function sparkWidth() {
  return 20;
}

function sparkHeight() {
  return 20;
}

function sparkDraw(x, y, index) {
  ctx.drawImage(sprites, (index * 20) + 358, 124, 20, 20, x, y, 20, 20);
}

// Cable
function Cable() {
  this.c1;
  this.c2;     // computers connected
  this.x1;
  this.y1;
  this.x2;
  this.y2;     // endpoints of line representing cable
  this.x;
  this.y;      // current location of spark
  this.fx;
  this.fy;     // needed for line drawing
  this.delay;  // how much time until spark leaves
  this.active; // is spark moving and from which end
  this.index;
}

function reverse(cable) {
  let t;
  t = cable.c1;
  cable.c1 = cable.c2;
  cable.c2 = t;
  t = cable.x1;
  cable.x1 = cable.x2;
  cable.x2 = t;
  t = cable.y1;
  cable.y1 = cable.y2;
  cable.y2 = t;
}

function cableSetup(cable) {
  cable.c1 = rand(0, ncomputers - 1);
  do {
    cable.c2 = rand(0, ncomputers - 1);
  } while (cable.c2 === cable.c1);
  cable.active = 0;
  cable.index = 0;
  cable.delay = sparkDelay(level);

  const COMP1 = computers[cable.c1];
  const COMP2 = computers[cable.c2];

  cable.x1 = Math.round(COMP1.x + COMPWIDTH / 3);
  cable.x2 = Math.round(COMP2.x + COMPWIDTH / 3);
  cable.y1 = Math.round(COMP1.y + COMPHEIGHT / 2);
  cable.y2 = Math.round(COMP2.y + COMPHEIGHT / 2);
}

function cableDraw(cable) {
  let rx;
  let ry;

  uiDrawLine(cable.x1, cable.y1, cable.x2, cable.y2);
  if (cable.active) {
    rx = cable.x - sparkWidth() / 2;
    ry = cable.y - sparkHeight() / 2;
    sparkDraw(rx, ry, cable.index);
  }
}

function cableUpdate(cable) {
  let xdist;
  let ydist;
  let sx;
  let sy;
  let counter;
  const COMP1 = computers[cable.c1];
  const COMP2 = computers[cable.c2];

  if (cable.active) {
    if ((COMP1.os === OS_WINGDOWS) === (COMP2.os === OS_WINGDOWS)) {
      cable.active = 0;
    } else if (COMP1.os === OS_WINGDOWS || COMP2.os === OS_WINGDOWS) {
      if (COMP2.os === OS_WINGDOWS) {
        reverse(cable);
      }

      xdist = cable.x2 - cable.x;
      ydist = cable.y2 - cable.y;

      sx = xdist >= 0 ? 1.0 : -1.0;
      sy = ydist >= 0 ? 1.0 : -1.0;
      xdist = Math.abs(xdist);
      ydist = Math.abs(ydist);
      if (xdist === 0 && ydist === 0) {
        if (!COMP2.busy) {
          if (COMP2.os === OS_OFF) {
            counter = NETWORK_COUNTER_OFF;
          } else {
            counter = NETWORK_COUNTER_BASE;
          }
          networkIncCounter(counter, -1);
          networkIncCounter(NETWORK_COUNTER_WIN, 1);
          COMP2.os = OS_WINGDOWS;
        }
        cable.active = 0;
      } else if (Math.max(xdist, ydist) < SPARKSPEED) {
        cable.x = cable.x2;
        cable.y = cable.y2;
      } else {
        cable.fx += (xdist * SPARKSPEED * sx) / (xdist + ydist);
        cable.fy += (ydist * SPARKSPEED * sy) / (xdist + ydist);
        cable.x = cable.fx;
        cable.y = cable.fy;
      }
      cable.index = 1 - cable.index;
    }
  } else {
    if ((COMP1.os === OS_WINGDOWS) === (COMP2.os === OS_WINGDOWS)) {
      // If WINGDOWS at both ends, do nothing
    } else if (COMP1.os === OS_WINGDOWS || COMP2.os === OS_WINGDOWS) {
      cable.active = 1;
      cable.delay = sparkDelay(level);
      if (COMP2.os === OS_WINGDOWS) {
        reverse(cable);
      }
      cable.x = cable.x1;
      cable.fx = cable.x1;
      cable.y = cable.y1;
      cable.fy = cable.y1;
    }
  }
}

function cableOnSpark(cable, locx, locy) {
  if (!cable.active) {
    return 0;
  }
  return (Math.abs(locx - cable.x) < sparkWidth() &&
          Math.abs(locy - cable.y) < sparkHeight());
}

function cableReset(cable) {
  cable.active = 0;
  cable.delay = sparkDelay(level);
}

// Bucket
function bucketClicked(x, y) {
  return (x > 0 && x < BUCKETWIDTH && y > 0 && y < BUCKETHEIGHT);
}

function bucketRelease(x, y) {
  let i;
  let cable;
  for (i = 0; i < ncables; i+=1) {
    cable = cables[i];
    if (cableOnSpark(cable, x, y)) {
      cableReset(cable);
    }
  }
  bucketgrabbed = 0;
}

// OS
function osDrawCursor() {
  if (grabbed) {
    ctx.drawImage(sprites,
                  grabbedos * 28, 124, 24, 24,
                  mousex - 14, mousey - 12, 28, 24);
  }
}

// Network
function networkOn(level) {
  return (Math.min(8 + level, STD_MAX_COMPUTERS) * gameScale(2));
}

// sets up network for each level
function networkSetup() {
  let i;
  ncomputers = networkOn(level);
  if (computers !== null) {
    computers.length = 0;
  }
  if (cables !== null) {
    cables.length = 0;
  }
  for (i = 0; i < ncomputers; i+=1) {
    computers[i] = new Computer();
    if (!computerSetup(computers[i], i)) {
      ncomputers = i - 1;
      break;
    }
  }
  counters[NETWORK_COUNTER_OFF] = 0;
  counters[NETWORK_COUNTER_BASE] = ncomputers;
  counters[NETWORK_COUNTER_WIN] = 0;
  ncables = Math.min(level, ncomputers / 2);
  for (i = 0; i < ncables; i+=1) {
    cables[i] = new Cable();
    cableSetup(cables[i]);
  }
}

// redraws the computers at their location with the proper image
function networkDraw() {
  let i;
  for (i = 0; i < ncables; i+=1) {
    cableDraw(cables[i]);
  }
  for (i = 0; i < ncomputers; i+=1) {
    computerDraw(computers[i]);
  }
}

function networkUpdate() {
  let i;
  for (i = 0; i < ncables; i+=1) {
    cableUpdate(cables[i]);
  }
}

function networkToasters() {
  let i;
  for (i = 0; i < ncomputers; i+=1) {
    computers[i].type = COMPUTER_TOASTER;
    computers[i].os = OS_OFF;
  }
  ncables = 0;
}

function networkGetCounter(counter) {
  return counters[counter];
}

// Horde
function hordeOn(lev) {
  const PERLEVEL = ((8 + 3 * lev) * gameScale(2));
  return Math.min(PERLEVEL, MAXBILLS);
}

function maxAtOnce(lev) {
  return Math.round(Math.min(2 + lev / 4, 12));
}

function between(lev) {
  return Math.round(Math.max(14 - lev / 3, 10));
}

// Launches Bills whenever called
function launch(max) {
  let bill;
  let n;
  const OFFSCREEN = HORDE_COUNTER_OFF;

  if (max === 0 || OFFSCREEN === 0) {
    return;
  }
  n = rand(1, Math.min(max, OFFSCREEN));
  for (n; n > 0; n--) {
    bill = new Bill();
    billEnter(bill);
    alive = prepend(bill, alive);
  }
}

function hordeSetup() {
  let bill;
  while (alive !== null) {
    bill = alive;
    alive = unlink(bill, alive);
    bill = null;
  }
  while (strays !== null) {
    bill = strays;
    strays = unlink(bill, strays);
    bill = null;
  }
  HORDE_COUNTER_OFF = hordeOn(level);
  HORDE_COUNTER_ON = 0;
}

function hordeUpdate(iteration) {
  let bill;
  let next;
  if (iteration % between(level) === 0) {
    launch(maxAtOnce(level));
  }
  for (bill = alive; bill !== null; bill = next) {
    next = bill.next;
    billUpdate(bill);
  }
}

function hordeDraw() {
  let bill;
  for (bill = strays; bill !== null; bill = bill.next) {
    billDraw(bill);
  }
  for (bill = alive; bill !== null; bill = bill.next) {
    billDraw(bill);
  }
}

function hordeAddBill(bill) {
  if (bill.state === BILL_STATE_STRAY) {
    strays = prepend(bill, strays);
  } else {
    alive = prepend(bill, alive);
  }
}

function hordeClickedStray(x, y) {
  let bill;
  for (bill = strays; bill !== null; bill = bill.next) {
    if (!billClickedStray(bill, x, y)) {
      continue;
    }
    strays = unlink(bill, strays);
    return bill;
  }
  return null;
}

function hordeProcessClick(x, y) {
  let bill;
  let counter;
  let comp;
  counter = 0;
  for (bill = alive; bill !== null; bill = bill.next) {
    if (bill.state === BILL_STATE_DYING || !billClicked(bill, x, y)) {
      continue;
    }
    if (bill.state === BILL_STATE_AT) {
      comp = computers[bill.target_c];
      comp.busy = 0;
      comp.stray = bill;
    }
    billSetDying(bill);
    counter+=1;
  }
  return counter;
}

// Game
function setupLevel(newlevel) {
  level = newlevel;
  hordeSetup();
  grabbed = null;
  networkSetup();
  iteration = 0;
  efficiency = 0;
}

function gameStart(newlevel) {
  gamestate = STATE_PLAYING;
  score = 0;
  paused = 0;
  uiRestartTimer();
  uiSetPausebutton(1);
  setupLevel(newlevel);
}

function gameStop() {
  if (paused === 0) {
    uiKillTimer();
    uiSetPausebutton(0);
    paused = 1;
  } else {
    uiRestartTimer();
    uiSetPausebutton(1);
    paused = 0;
  }
}

function updateInfo() {
  const ONSCREEN = hordeGetCounter(HORDE_COUNTER_ON);
  const OFFSCREEN = hordeGetCounter(HORDE_COUNTER_OFF);
  const BASE = networkGetCounter(NETWORK_COUNTER_BASE);
  const OFF = networkGetCounter(NETWORK_COUNTER_OFF);
  const WIN = networkGetCounter(NETWORK_COUNTER_WIN);
  const UNITS = ncomputers;
  const STR = 'Bill:' + ONSCREEN + '/' + OFFSCREEN +
              ' System:' + BASE + '/' + OFF + '/' + WIN +
              ' Level:' + level + ' Score:' + Math.floor(score);
  ctx.fillText(STR, 0, SCREENSIZE-1);
  efficiency += ((100 * BASE - 10 * WIN) / UNITS);
}

function gameAddHighScore(str) {
  scorelistRecalc(str, level, score);
}

function mouseMoved(x, y, canvas) {
  mousex = x - canvas.offsetLeft;
  mousey = y - canvas.offsetTop;
}

function mouseButtonPress() {
  const COUNTER = hordeProcessClick(mousex, mousey);
  if (gamestate !== STATE_PLAYING || paused === 1) {
    return;
  }
  if (bucketClicked(mousex, mousey)) {
    bucketgrabbed = 1;
    return;
  }
  grabbed = hordeClickedStray(mousex, mousey);
  if (grabbed !== null) {
    grabbedos = grabbed.cargo;
    return;
  }
  score += (COUNTER * COUNTER * SCORE_BILLPOINTS);
}

function mouseButtonRelease() {
  let i;
  let computer;
  let counter;
  if (gamestate !== STATE_PLAYING || paused === 1) {
    return;
  }
  if (grabbed === null) {
    bucketRelease(mousex, mousey);
    return;
  }
  for (i = 0; i < ncomputers; i+=1) {
    computer = computers[i];

    if (computerOn(computer, mousex, mousey) &&
        computerCompatible(computer, grabbed.cargo) &&
        (computer.os === OS_WINGDOWS || computer.os === OS_OFF)) {
      networkIncCounter(NETWORK_COUNTER_BASE, 1);
      if (computer.os === OS_WINGDOWS) {
        counter = NETWORK_COUNTER_WIN;
      } else {
        counter = NETWORK_COUNTER_OFF;
      }
      networkIncCounter(counter, -1);
      computer.os = grabbed.cargo;
      hordeRemoveBill(grabbed);
      grabbed = null;
      return;
    }
  }
  hordeAddBill(grabbed);
  grabbed = null;
}

function gameUpdate() {
  let name;

  switch (gamestate) {
  case STATE_PLAYING:
    ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
    networkUpdate();
    networkDraw();
    hordeUpdate(iteration);
    hordeDraw();
    bucketDraw();
    osDrawCursor();
    updateInfo();
    if (hordeGetCounter(HORDE_COUNTER_ON) +
      hordeGetCounter(HORDE_COUNTER_OFF) === 0) {
      score += (level * efficiency / iteration);
      gamestate = STATE_BETWEEN;
    }
    if ((networkGetCounter(NETWORK_COUNTER_BASE) +
       networkGetCounter(NETWORK_COUNTER_OFF)) <= 1) {
      gamestate = STATE_END;
    }
    break;
  case STATE_END:
    ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);
    networkToasters();
    networkDraw();
    if (scorelistIsHighScore(score)) {
      name = prompt('You earned a high score.\nEnter your name:');
      if (name === null) {
        name = 'Anonymous';
      }
      gameAddHighScore(name);
    }
    uiKillTimer();
    uiSetPausebutton(0);
    gamestate = STATE_WAITING;
    break;
  case STATE_BETWEEN:
    alert('After Level ' + level + '\nScore: ' + Math.floor(score));
    gamestate = STATE_PLAYING;
    setupLevel(++level);
    break;
  }
  iteration+=1;
}

function main() {
  const CANVAS = document.getElementById('canvas');
  ctx = CANVAS.getContext('2d');
  ctx.font = 'bold 12px sans-serif';
  $('canvas').unbind();

  $('canvas').bind('gestureStart', function(event) {
    event.preventDefault();
  });

  $('canvas').bind('gestureChange', function(event) {
    event.preventDefault();
  });

  $('canvas').bind('gestureEnd', function(event) {
    event.preventDefault();
  });

  $('canvas').bind('touchmove', function(event) {
    event.preventDefault();
  });

  $('canvas').bind('mousemove', function(event) {
    mouseMoved(event.pageX, event.pageY, CANVAS);
  });

  $('canvas').bind('mousedown', function(event) {
    event.preventDefault();
    mouseButtonPress();
  });

  $('canvas').bind('mouseup', function(event) {
    event.preventDefault();
    mouseButtonRelease();
  });

  $('canvas').bind('touchstart', function(event) {
    mouseMoved(event.targetTouches[0].pageX,
               event.targetTouches[0].pageY,
               CANVAS);
    event.preventDefault();
    mouseButtonPress();
  });

  $('canvas').bind('touchend', function(event) {
    mouseMoved(event.targetTouches[0].pageX,
               event.targetTouches[0].pageY,
               CANVAS);
    event.preventDefault();
    mouseButtonRelease();
  });

  ctx.clearRect(0, 0, SCREENSIZE, SCREENSIZE);

  scorelistRead();

  uiLoadPix();
  uiLoadAudio();

  gamestate = STATE_WAITING;
  if (level) {
    gameStart(level);
  } else {
    uiSetPausebutton(0);
  }
}
