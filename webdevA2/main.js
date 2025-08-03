// Section navigation + background audio with fade

var buttons = document.querySelectorAll("nav button[data-era]");
var sections = document.querySelectorAll("main .era, #minigame");
var home = document.getElementById("home");
var bgm = document.getElementById("bgm"); // background music for each section
var eraAudio = {
  baroque: "audio/baroque.mp3",
  classical: "audio/classical.mp3",
  romantic: "audio/romantic.mp3",
  modern: "audio/modern.mp3"
};
var nowPlayingEl = document.getElementById("nowPlaying"); // sticky footer/status
var notesLayer = document.getElementById("notesLayer"); // layer for animated notes
var nowPlayingLabel = document.createElement("span"); // text inside nowPlaying
var resetBtn = document.createElement("button"); // Reset button

// Add the "Now Playing" label + Reset button into the status bar
nowPlayingLabel.id = "nowPlayingLabel";
nowPlayingEl.appendChild(nowPlayingLabel);

// Reset button 
resetBtn.type = "button";
resetBtn.id = "resetApp";
resetBtn.className = "reset-btn";
resetBtn.textContent = "Reset";
nowPlayingEl.appendChild(resetBtn);

// Start hidden until something is playing
nowPlayingEl.classList.add("is-empty");

// Reset behavior of UIs
resetBtn.addEventListener("click", function () {
  currentAudioSrc = ""; // clear tracked audio
  showHome(); // hides sections, shows Home, stops music
  if (typeof stopNotesAnimation === "function") stopNotesAnimation();
  if (typeof clearFeedbackUI === "function") clearFeedbackUI();        // feedback reset
  if (typeof resetQuizSection === "function") resetQuizSection();      // Reset quiz
  if (typeof giResetGame === "function") giResetGame();                // Reset minigame
  if (nav) nav.classList.remove('is-open'); // close mobile nav if open
});

// state for notes
var notes = [];       // array of {el, x, y, speed} el is shortform for elements
var notesTimer = null;

// Create one note with randomized style/position/speed
function spawnNote() {
  var symbols = ["♪", "♫", "♩", "♬"];
  var el = document.createElement("div");
  el.className = "note colorcycle";  //  will use CSS animation (keyframes) to cycle 
  el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

  // random size & slight desync in speed
  var min = 20, max = 50;
  el.style.fontSize = (min + Math.random() * (max - min)) + "px";
  el.style.opacity = (0.6 + Math.random() * 0.35).toFixed(2);
  el.style.setProperty("--cycle-speed", (4 + Math.random() * 4) + "s");

  // position & speed
  // position at left side
  var x = -40 - Math.random() * 200;
  var bandTop = 60, bandBottom = 200;
  var y = bandTop + Math.random() * (bandBottom - bandTop);
  var speed = 2 + Math.random() * 3.5;

  el.style.left = x + "px";
  el.style.top = y + "px";

  notesLayer.appendChild(el);
  return { el: el, x: x, y: y, speed: speed };
}

// Note animation loop; spawns `count` notes, then advances them on a timer
function startNotesAnimation(count) {
  if (typeof count === "undefined") count = 8;
  stopNotesAnimation();              // ensure clean start
  // create N number of notes -- which is the initial few
  for (var i = 0; i < count; i++) {
    notes.push(spawnNote());
  }

  // one timer updates all notes (timed event)
  // Move notes across the screen; recycle when offscreen
  notesTimer = setInterval(function () {
    var width = window.innerWidth;
    for (var i2 = 0; i2 < notes.length; i2++) {
      var n = notes[i2];
      n.x += n.speed;
      // small vertical drift
      if (Math.random() < 0.02) {
        n.y += (Math.random() < 0.5 ? -1 : 1) * 2;
      }
      // Recycle to left after leaving right edge
      if (n.x > width + 40) {
        n.x = -40 - Math.random() * 200;
        var bandTop2 = 60, bandBottom2 = 200;
        n.y = bandTop2 + Math.random() * (bandBottom2 - bandTop2);
      }
      n.el.style.left = n.x + "px";
      n.el.style.top = n.y + "px";
    }
  }, 30);
}

// Remove all notes and stop timer
function stopNotesAnimation() {
  clearInterval(notesTimer);
  notesTimer = null;
  for (var i = 0; i < notes.length; i++) {
    notes[i].el.remove();
  }
  notes.length = 0;
}

// Update "Now Playing" label
function updateNowPlaying(text) {
  nowPlayingLabel.textContent = text ? ("Now Playing: " + text) : "";
  nowPlayingEl.classList.toggle("is-empty", !text);
}


// Background audio controls
var currentAudioSrc = "";

// Play the track for an era, fading between tracks or in/out
function playEraAudio(era) {
  var audioSrc = eraAudio[era];


  // not in the 4 sections ( baroque, classical, romantic and modern) then will not play
  if (!audioSrc) {
    stopMusic();
    updateNowPlaying("");
    return;
  }

  if (currentAudioSrc !== audioSrc) {
    // Switching tracks, quick fade out, swap source, then fade in, also loads the notes animations
    fadeVolume(0, 100);
    setTimeout(function () {
      try {
        bgm.pause();
        bgm.src = audioSrc;
        currentAudioSrc = audioSrc;
        bgm.currentTime = 0;
        bgm.play()
          .then(function () {
            fadeVolume(1, 200);
            updateNowPlaying(era.toUpperCase());
            startNotesAnimation(22);
          })
          .catch(function (err) { console.warn("Audio play blocked:", err); });
      } catch (e) {
        console.warn(e);
      }
    }, 160);
  } else {
    // Same track
    if (bgm.paused) {
      bgm.play().then(function () { updateNowPlaying(era.toUpperCase()); }).catch(function () { });
    }
    fadeVolume(1, 200);
  }
}

// Fade out the music and stop the music and note animations
function stopMusic() {
  fadeVolume(0, 150);
  setTimeout(function () {
    bgm.pause();
    updateNowPlaying("");
    stopNotesAnimation();
  }, 160);
}

// Fade helper
var fadeTimer = null;
function fadeVolume(to, duration) {
  clearInterval(fadeTimer);
  var from = bgm.volume;
  var steps = Math.max(1, Math.floor(duration / 30)); // 30ms per step
  var i = 0;
  fadeTimer = setInterval(function () {
    i++;
    var t = i / steps;
    bgm.volume = from + (to - from) * t;
    if (i >= steps) clearInterval(fadeTimer);
  }, 30);
}


// Section navigation

// Visual "active" state on nav buttons 
function clearActiveButton() {
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("is-active");
  }
}
function setActiveButton(id) {
  clearActiveButton();
  var selector = 'nav button[data-era="' + id + '"]';
  var btn = document.querySelector(selector);
  if (btn) btn.classList.add("is-active");
}

var openId = null; // shows the current section id

// Show Home + stop music and note animations
function showHome() {
  for (var i = 0; i < sections.length; i++) {
    sections[i].style.display = "none";
  }
  if (home) home.style.display = "block";
  openId = null;
  clearActiveButton();
  stopMusic();
}

// Show a content section by id and hides others, then plays the section's music
function showSection(id) {
  var target = document.getElementById(id);
  if (!target) return;
  for (var i = 0; i < sections.length; i++) {
    sections[i].style.display = "none";
  }
  if (home) home.style.display = "none";
  target.style.display = "block";
  openId = id;
  setActiveButton(id);   // highlights current section
  playEraAudio(id);

  // ensure minigame is ready with a fresh (restarted one) round when opened
  if (id === 'minigame' && typeof giEnsureFreshRound === 'function') giEnsureFreshRound();
}

// Click handler for nav buttons
function onNavClick(e) {
  e.preventDefault();
  var id = this.getAttribute("data-era");
  if (openId === id) {
    showHome();
  } else {
    showSection(id);
  }
  if (nav) nav.classList.remove('is-open'); // close mobile drawer after selection
}

// Initial state of the website
showHome();
for (var iBtn = 0; iBtn < buttons.length; iBtn++) {
  buttons[iBtn].addEventListener("click", onNavClick);
}


// FEEDBACK SECTION

// Emoji picker + textarea + "Send" with cooldown UX
var feedbackContainer = document.querySelector(".emoji-feedback-container");
var emoji = document.querySelector(".emoji");
var textarea = document.querySelector(".rating textarea");
var feedbackBtn = document.querySelector(".feedback-btn");

// Select an emoji -> expand textarea + show send button
emoji.addEventListener("click", function (e) {
  if (e.target.className.indexOf('emoji') !== -1) return;
  var selected = emoji.querySelector('[data-selected]');
  if (selected) selected.removeAttribute('data-selected');
  e.target.setAttribute('data-selected', '');
  textarea.classList.add("textarea--active");
  feedbackBtn.classList.add("feedback-btn--active");
});

// Leaving widget surface (cursor leaves feedback section) collapses UI text area 
feedbackContainer.addEventListener("mouseleave", function () {
  textarea.classList.remove("textarea--active");
  feedbackBtn.classList.remove("feedback-btn--active");
});


var coolingDown = false;
var cooldownTime = 10;
var lastFeedbackTime = null;

// shows feedback status + cooldown countdown, then re-enables UI
feedbackBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (coolingDown) return;

  var status = feedbackContainer.querySelector(".feedback-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "feedback-status";
    feedbackContainer.querySelector(".rating").appendChild(status);
  }
  status.classList.add("show");

  // Start cooldown: disable + hide Send + hide inputs
  coolingDown = true;
  feedbackBtn.disabled = true;
  feedbackContainer.classList.add("is-cooling");

  // Countdown and restore UI
  var remainingTime = cooldownTime;
  status.textContent = "Feedback sent. Thank you! You can send feedback again in " + remainingTime + "s.";

  clearInterval(lastFeedbackTime);
  lastFeedbackTime = setInterval(function () {
    remainingTime -= 1;
    if (remainingTime > 0) {
      status.textContent = "Feedback sent. Thank you! You can send feedback again in " + remainingTime + "s.";
    } else {
      clearInterval(lastFeedbackTime);
      lastFeedbackTime = null;
      coolingDown = false;

      // End cooldown: show inputs again and re-enable Send
      feedbackContainer.classList.remove("is-cooling");
      feedbackBtn.disabled = false;

      // Re-open controls
      textarea.classList.add("textarea--active");
      feedbackBtn.classList.add("feedback-btn--active");
      status.textContent = "You can now send feedback again.";

      // Hide status after a moment
      setTimeout(function () { status.classList.remove("show"); }, 1500);
    }
  }, 1000);

  // Reset for next feedback
  var selected = emoji.querySelector("[data-selected]");
  if (selected) selected.removeAttribute("data-selected");
  textarea.value = "";
});

// Reset the feedback inputs by users
function clearFeedbackUI() {
  if (!emoji || !textarea || !feedbackBtn) return;

  var sel = emoji.querySelector("[data-selected]");
  if (sel) sel.removeAttribute("data-selected");
  textarea.value = "";

  // Show inputs and button
  feedbackContainer.classList.remove("is-cooling");
  textarea.classList.add("textarea--active");
  feedbackBtn.classList.add("feedback-btn--active");
  feedbackBtn.disabled = false;

  var status = feedbackContainer.querySelector(".feedback-status");
  if (status) { status.textContent = ""; status.classList.remove("show"); }

  coolingDown = false;
  if (lastFeedbackTime) { clearInterval(lastFeedbackTime); lastFeedbackTime = null; }
}


// Musical Eras MCQ Quiz


var quizEl = document.getElementById('mcqQuiz');
var btnSubmit = document.getElementById('btnSubmit');
var btnRetry = document.getElementById('btnRetry');
var scorebox = document.getElementById('scorebox');
var reviewWrap = document.getElementById('reviewPanel');
var reviewList = document.getElementById('reviewList');

// Answer key and brief explanations for review
var ANSWER_KEY = {
  q1: { answer: 'Baroque', explain: 'Baroque music widely used basso continuo (bass + chordal instrument).' },
  q2: { answer: 'Classical', explain: 'The Classical era is roughly 1750-1820 (Haydn, Mozart, early Beethoven).' },
  q3: { answer: 'Concerto', explain: 'Baroque concerto contrasts soloist vs. ensemble; Vivaldi is a key figure.' },
  q4: { answer: 'Piano', explain: 'In the Classical era the piano replaced the harpsichord as the dominant keyboard.' },
  q5: { answer: 'Lied', explain: 'A Romantic Lied sets poetry for solo voice and piano (Schubert, Schumann).' },
  q6: { answer: 'Arnold Schoenberg', explain: 'Schoenberg pioneered atonality and the twelve-tone method (20th century).' },
  q7: { answer: 'Minimalism', explain: 'Minimalism uses repetitive patterns and gradual change (Reich, Glass).' },
  q8: { answer: 'Modern', explain: 'From ~1900 to present: diverse experimentation and new technologies.' }
};

// put on quiz interactions if present on page
if (quizEl && btnSubmit && btnRetry && scorebox) {

  // Event delegation: one listener handles all radio changes
  // Changing a choice clears any previous marking text/state
  quizEl.addEventListener('change', function (evt) {
    var t = evt.target;
    if (!t || t.type !== 'radio') return;

    // Clear pending/correct/wrong as user changes an answer
    var fs = fieldsetFromChild(t);
    if (fs) {
      fs.classList.remove('pending', 'correct', 'wrong');
      var fb = fs.querySelector('.feedback');
      if (fb) fb.textContent = '';
    }
  });

  // Submit grading
  // if some unanswered, nudge the user
  btnSubmit.addEventListener('click', function () {
    var firstUnanswered = findFirstUnanswered(quizEl);
    if (firstUnanswered) {
      markPending(firstUnanswered);
      firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build FormData and grade it
    var fd = collectFormData(quizEl);
    var result = gradeFromFormData(fd, ANSWER_KEY);

    // Update text content (score) + dynamic review 
    scorebox.textContent = 'Score: ' + result.correct + ' / ' + result.total;
    renderReview(result.details);

    // Update CSS properties / classes based on score (visual feedback) (green or red for correc and incorrect)
    applyScoreStyling(result.correct, result.total);

    // Lock choices until user retries
    setRadiosDisabled(quizEl, true);
    btnRetry.hidden = false;
  });

  // Retry resets everything (clears markings, re-enables choices, resets color)
  btnRetry.addEventListener('click', function () {
    clearMarking(quizEl);
    clearRadios(quizEl);
    setRadiosDisabled(quizEl, false);
    scorebox.textContent = 'Not submitted';
    btnRetry.hidden = true;

    // Reset dynamic review and container classes
    if (reviewWrap) reviewWrap.classList.add('hidden');
    if (reviewList) reviewList.innerHTML = '';
    quizEl.classList.remove('score-good', 'score-bad');

    // Reset to default
    document.documentElement.style.setProperty('--quiz-accent', '#69fafa');
  });
}

// Create FormData by reading selected radio values per fieldset group
function collectFormData(container) {
  var fd = new FormData();
  var sets = container.querySelectorAll('fieldset.q');
  for (var i = 0; i < sets.length; i++) {
    var name = getGroupName(sets[i]);
    if (!name) continue;
    var chosen = container.querySelector('input[type="radio"][name="' + name + '"]:checked');
    fd.set(name, chosen ? chosen.value : '');
  }
  return fd;
}

// lookup instrument specifications by id
function findInstrumentSpecById(id) {
  for (var i = 0; i < INSTRUMENTS.length; i++) {
    if (INSTRUMENTS[i].id === id) return INSTRUMENTS[i];
  }
  return null;
}

// Grade using FormData, also mark each question and build review details
function gradeFromFormData(fd, keyMap) {
  clearMarking(quizEl);

  var correct = 0;
  var total = 0;
  var details = []; // wrong answers for review

  // (loop + conditions) for the answers and content
  fd.forEach(function (value, name) {
    total++;

    var spec = keyMap[name] || { answer: '', explain: '' };
    var expected = normalize(spec.answer);
    var picked = normalize(value);

    var fs = fieldsetByName(name);
    var ok = (picked === expected);

    if (fs) {
      fs.classList.add(ok ? 'correct' : 'wrong');
      var fb = fs.querySelector('.feedback');
      if (fb) fb.textContent = ok ? 'Correct!' : ('Answer: ' + spec.answer);
    }

    if (ok) {
      correct++;
    } else {
      details.push(formatReviewItem(fs, spec.answer, spec.explain));
    }
  });

  return { correct: correct, total: total, details: details };
}

// Find the first unanswered question to nudge the user
function findFirstUnanswered(container) {
  var sets = container.querySelectorAll('fieldset.q');
  for (var i = 0; i < sets.length; i++) {
    var name = getGroupName(sets[i]);
    if (!name) continue;
    var hasPick = container.querySelector('input[type="radio"][name="' + name + '"]:checked');
    if (!hasPick) return sets[i];
  }
  return null;
}

// Mark a fieldset as pending (used to nudge the user)
function markPending(fs) {
  fs.classList.remove('correct', 'wrong');
  fs.classList.add('pending');
  var fb = fs.querySelector('.feedback');
  if (fb) fb.textContent = 'Please choose an option.';
}

// Clear all question markings
function clearMarking(container) {
  var sets = container.querySelectorAll('fieldset.q');
  for (var i = 0; i < sets.length; i++) {
    sets[i].classList.remove('correct', 'wrong', 'pending');
    var fb = sets[i].querySelector('.feedback');
    if (fb) fb.textContent = '';
  }
}

// Uncheck all radios
function clearRadios(container) {
  var checked = container.querySelectorAll('input[type="radio"]:checked');
  for (var i = 0; i < checked.length; i++) checked[i].checked = false;
}

// Enable/disable all radios
function setRadiosDisabled(container, disabled) {
  var inputs = container.querySelectorAll('input[type="radio"]');
  for (var i = 0; i < inputs.length; i++) inputs[i].disabled = disabled;
}

// Apply score visuals: set CSS variable + toggle container classes
function applyScoreStyling(correct, total) {
  var ratio = total ? (correct / total) : 0;
  // Update an colour based on the users input
  document.documentElement.style.setProperty('--quiz-accent', ratio >= 0.6 ? '#86efac' : '#fca5a5');
  // Add/Remove classes on the quiz container
  quizEl.classList.toggle('score-good', ratio >= 0.6);
  quizEl.classList.toggle('score-bad', ratio < 0.6);
}

// get fieldset from any descendant
function fieldsetFromChild(el) {
  while (el && el !== document && el.tagName !== 'FIELDSET') el = el.parentNode;
  return (el && el.tagName === 'FIELDSET') ? el : null;
}

// get radio group name from a fieldset
function getGroupName(fs) {
  var input = fs.querySelector('input[type="radio"]');
  return input ? input.name : '';
}

// find the fieldset by the radio group name
function fieldsetByName(name) {
  var one = quizEl.querySelector('input[type="radio"][name="' + name + '"]');
  return one ? fieldsetFromChild(one) : null;
}

// Normalize strings for comparison
function normalize(s) {
  return String(s || '').trim().toLowerCase();
}

// Create a readable review line for wrong answers
function formatReviewItem(fs, answer, explain) {
  var legend = fs ? fs.querySelector('legend') : null;
  var title = legend ? legend.textContent : '(Question)';
  return title + ' — Correct: ' + answer + (explain ? ' — ' + explain : '');
}

// Render the dynamic review list
function renderReview(items) {
  if (!reviewWrap || !reviewList) return;
  reviewList.innerHTML = '';

  if (!items || !items.length) {
    reviewWrap.classList.add('hidden');
    return;
  }
  for (var i = 0; i < items.length; i++) {
    var li = document.createElement('li');
    li.textContent = items[i];
    reviewList.appendChild(li);
  }
  reviewWrap.classList.remove('hidden');
}


// MINIGAME

var giGame = document.getElementById('giGame');
var giSprite = document.getElementById('giSprite');
var giNotes = document.getElementById('giNotes');
var giChoices = document.getElementById('giChoices');
var giStatus = document.getElementById('giStatus');
var giRoundEl = document.getElementById('giRound');
var giTimerEl = document.getElementById('giTimer');
var giScoreEl = document.getElementById('giScore');
var giPlaySound = document.getElementById('giPlaySound');
var giNext = document.getElementById('giNext');

var giAudio = document.getElementById('giAudio');
var sfxOK = document.getElementById('giSfxCorrect');
var sfxNo = document.getElementById('giSfxWrong');

// Init game elements
if (giGame && giSprite && giChoices) {
  // ---------- Data: sprite class name + audio filename ----------
  // Sprite order (3x2 grid): guitar, timpani, trumpet, harpsichord, oboe, violin
  var INSTRUMENTS = [
    { id: 'guitar', label: 'Guitar', className: 'guitar', audio: 'audio/guitar.mp3' },
    { id: 'timpani', label: 'Timpani', className: 'timpani', audio: 'audio/timpani.mp3' },
    { id: 'trumpet', label: 'Trumpet', className: 'trumpet', audio: 'audio/trumpet.mp3' },
    { id: 'harpsichord', label: 'Harpsichord', className: 'harpsichord', audio: 'audio/harpsichord.mp3' },
    { id: 'oboe', label: 'Oboe', className: 'oboe', audio: 'audio/oboe.mp3' },
    { id: 'violin', label: 'Violin', className: 'violin', audio: 'audio/violin.mp3' }
  ];

  // GAME STATE
  var TOTAL_ROUNDS = 10;
  var TIME_PER_ROUND = 15; // seconds

  var round = 1;
  var score = 0;
  var answerId = null;

  var timerId = null;       // setInterval for countdown
  var rafId = null;         // requestAnimationFrame for notes animation
  var noteSpawnId = null;   // setInterval for spawning notes

  // ---------- Event listeners ----------
  giChoices.addEventListener('click', onChoiceClick); // event delegation
  giPlaySound.addEventListener('click', playInstrumentAudio);
  giNext.addEventListener('click', function () { round++; startRound(); });

  // Start the game
  startRound();
}

// Main round setup: choose instrument, build choices, start timers/FX

function startRound() {
  clearRoundEffects();

  if (round > TOTAL_ROUNDS) {
    giStatus.textContent = 'Game over! Final score: ' + score + ' / ' + TOTAL_ROUNDS;
    giStatus.className = 'gi-status info';
    giNext.disabled = true;
    return;
  }

  // HUD
  giRoundEl.textContent = String(round);
  giScoreEl.textContent = String(score);
  giTimerEl.textContent = String(TIME_PER_ROUND);

  // Pick a random instrument
  var pick = INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)];
  answerId = pick.id;

  // Show the correct sprite frame via CLASS
  setSpriteByClass(pick.className);

  // Build randomized choices (1 correct + 3 distractors)
  buildChoices(answerId);

  // Set audio to the instrument file
  giAudio.src = pick.audio;

  // Status
  giStatus.textContent = 'Pick the instrument shown (or play its sound).';
  giStatus.className = 'gi-status info';

  // Enable/disable controls
  giNext.disabled = true;
  setChoicesDisabled(false);

  // Start countdown + note animation
  startCountdown(TIME_PER_ROUND);
  startNotesAnimation();
}

// Evaluate (correct or incorrect) a clicked choice
function onChoiceClick(evt) {
  var btn = evt.target.closest('.choice');
  if (!btn || btn.classList.contains('disabled')) return;

  var pickedId = btn.getAttribute('data-id');
  var correct = (pickedId === answerId);

  // Disable all choices; mark the correct one
  setChoicesDisabled(true);
  markCorrectChoice();

  if (correct) {
    score++;
    giStatus.textContent = 'Correct!';
    giStatus.className = 'gi-status correct';
    safePlay(sfxOK);
    document.documentElement.style.setProperty('--gi-accent', '#86efac');
  } else {
    var correctLabel = findInstrumentSpecById(answerId).label;
    giStatus.textContent = 'Wrong — it was ' + correctLabel + '.';
    giStatus.className = 'gi-status wrong';
    safePlay(sfxNo);
    document.documentElement.style.setProperty('--gi-accent', '#fca5a5');
  }

  // Stop timers/animation for this round
  stopCountdown();
  stopNotesAnimation();

  // Unlock "Next"
  giNext.disabled = false;

  // Outline color based on performance so far
  var ratio = score / round;
  giGame.classList.toggle('score-good', ratio >= 0.6);
  giGame.classList.toggle('score-bad', ratio < 0.6);

  // Small "bounce" animation on sprite
  bounceSprite();
}

// Play current instrument audio
function playInstrumentAudio() {
  safePlay(giAudio);
}

// Build choices grid (shuffled)
function buildChoices(correctId) {
  var pool = INSTRUMENTS.slice();
  shuffle(pool);

  // pick 3 distractors
  var distractors = [];
  for (var i = 0; i < pool.length && distractors.length < 3; i++) {
    if (pool[i].id !== correctId) distractors.push(pool[i].id);
  }

  var options = [correctId].concat(distractors);
  options.sort(function () { return Math.random() - 0.5; });

  giChoices.innerHTML = '';
  for (var j = 0; j < options.length; j++) {
    var optId = options[j]; // capture value for this iteration
    var inst = findInstrumentSpecById(optId);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.textContent = inst.label;
    btn.setAttribute('data-id', inst.id);
    giChoices.appendChild(btn);
  }
}

// Highlight only the correct choice
function markCorrectChoice() {
  var nodes = giChoices.querySelectorAll('.choice');
  for (var i = 0; i < nodes.length; i++) {
    var id = nodes[i].getAttribute('data-id');
    if (id === answerId) nodes[i].classList.add('correct');
  }
}

// Enable or disable all options
function setChoicesDisabled(disabled) {
  var nodes = giChoices.querySelectorAll('.choice');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].classList.toggle('disabled', disabled);
    nodes[i].disabled = disabled;
  }
}

// Swap sprite frame by class name
function setSpriteByClass(instrClass) {
  giSprite.classList.remove('guitar', 'timpani', 'trumpet', 'harpsichord', 'oboe', 'violin');
  giSprite.classList.add(instrClass);
}

// Bounce animation 
function bounceSprite() {
  var t = 0;
  var dur = 400; // ms
  var startTop = 0;
  var amp = 8;   // px

  var start = performance.now();
  function step(now) {
    t = Math.min(1, (now - start) / dur);
    var dy = Math.sin(t * Math.PI) * -amp; // up then down
    giSprite.style.top = (startTop + dy) + 'px';
    if (t < 1) requestAnimationFrame(step);
    else giSprite.style.top = '0px';
  }
  requestAnimationFrame(step);
}

// Floating notes using left/top
function startNotesAnimation() {
  stopNotesAnimation();

  // Spawn a note every 400ms
  noteSpawnId = setInterval(function () {
    spawnNote();
  }, 400);

  // Move notes each frame
  // remove when out of bounds
  function tick() {
    rafId = requestAnimationFrame(tick);
    var notesEls = giNotes.querySelectorAll('.gi-note');
    for (var i = 0; i < notesEls.length; i++) {
      var el = notesEls[i];
      var x = parseFloat(el.dataset.x) || 0;
      var y = parseFloat(el.dataset.y) || 0;
      var vx = parseFloat(el.dataset.vx) || 1.2;
      var vy = parseFloat(el.dataset.vy) || -0.3;

      x += vx;
      y += vy;

      el.style.left = x + 'px';
      el.style.top = y + 'px';

      el.dataset.x = x;
      el.dataset.y = y;

      // Remove when out of bounds
      if (x > giNotes.clientWidth + 40 || y < -40) {
        el.remove();
      }
    }
  }
  tick();
}

// Stop minigame notes animation and clear layer
function stopNotesAnimation() {
  if (noteSpawnId) { clearInterval(noteSpawnId); noteSpawnId = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  giNotes.innerHTML = '';
}

// Create one note for the minigame layer
function spawnNote() {
  var el = document.createElement('div');
  el.className = 'gi-note';
  el.textContent = Math.random() < 0.5 ? '♪' : '♫';

  // start near left/bottom
  var startX = -20;
  var startY = giNotes.clientHeight - 30 - Math.random() * 20;
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';

  // store positions and velocities as data-*
  el.dataset.x = String(startX);
  el.dataset.y = String(startY);
  el.dataset.vx = String(1.2 + Math.random() * 1.2);
  el.dataset.vy = String(-0.2 - Math.random() * 0.6);

  giNotes.appendChild(el);
}

// Countdown per round; when time runs out, mark wrong + enable Next

function startCountdown(seconds) {
  stopCountdown();
  var remain = seconds;
  giTimerEl.textContent = String(remain);

  timerId = setInterval(function () {
    remain--;
    giTimerEl.textContent = String(remain);
    if (remain <= 0) {
      // time up -> reveal and allow next
      stopCountdown();
      setChoicesDisabled(true);
      giStatus.textContent = 'Time up!';
      giStatus.className = 'gi-status wrong';
      document.documentElement.style.setProperty('--gi-accent', '#fca5a5');
      stopNotesAnimation();
      giNext.disabled = false;
    }
  }, 1000);
}

// Cancel countdown timer
function stopCountdown() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

// Clear UI
function clearRoundEffects() {
  giStatus.textContent = '';
  giStatus.className = 'gi-status';
  document.documentElement.style.setProperty('--gi-accent', '#69fafa');
  setChoicesDisabled(false);
  giChoices.innerHTML = '';
}


// shuffle algorithm
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// Play any audio safely -- just to ensure it can play
function safePlay(audioEl) {
  if (!audioEl) return;
  try { audioEl.currentTime = 0; audioEl.play(); } catch (e) { }
}

// Public reset used by global "Reset" button
function resetQuizSection() {
  if (!quizEl) return;

  // Clear radio selections and markings
  clearMarking(quizEl);
  clearRadios(quizEl);
  setRadiosDisabled(quizEl, false);

  // Reset score text and buttons
  if (scorebox) scorebox.textContent = 'Not submitted';
  if (btnRetry) btnRetry.hidden = true;

  // Hide review panel and remove score classes
  if (reviewWrap) reviewWrap.classList.add('hidden');
  if (reviewList) reviewList.innerHTML = '';
  quizEl.classList.remove('score-good', 'score-bad');

  // Reset accent color used by quiz
  document.documentElement.style.setProperty('--quiz-accent', '#69fafa');
}

// Stop timers/animations, clear UI, and put the game in a clean idle state.
function giResetGame() {
  if (!giGame) return;

  // Stop anything running
  if (typeof stopCountdown === 'function') stopCountdown();
  if (typeof stopNotesAnimation === 'function') stopNotesAnimation();

  // Reset state vars if they exist
  try { round = 1; } catch (e) { }
  try { score = 0; } catch (e) { }
  try { answerId = null; } catch (e) { }

  // Reset HUD
  if (giRoundEl) giRoundEl.textContent = '1';
  if (giScoreEl) giScoreEl.textContent = '0';
  if (giTimerEl) giTimerEl.textContent = String(typeof TIME_PER_ROUND !== 'undefined' ? TIME_PER_ROUND : 15);

  // Clear UI
  if (giChoices) giChoices.innerHTML = '';
  if (giStatus) { giStatus.textContent = ''; giStatus.className = 'gi-status'; }

  // Reset sprite (remove any instrument frame + position)
  if (giSprite) {
    giSprite.classList.remove('guitar', 'timpani', 'trumpet', 'harpsichord', 'oboe', 'violin');
    giSprite.style.top = '0px';
    giSprite.style.left = '0px';
  }

  // Reset accents (colours) & outlines
  document.documentElement.style.setProperty('--gi-accent', '#69fafa');
  giGame.classList.remove('score-good', 'score-bad');

  // Controls
  if (giNext) giNext.disabled = true;

  // Silence audio
  if (giAudio) { try { giAudio.pause(); } catch (e) { } giAudio.src = ''; }
}

// If no choices are currently shown, start a new round when the minigame section is opened
function giEnsureFreshRound() {
  if (!giGame || !giChoices) return;

  // Only start if not currently mid-round (no options rendered)
  if (giChoices.children.length === 0 && typeof startRound === 'function') {
    // Make sure counters look fresh before starting
    if (giRoundEl) giRoundEl.textContent = '1';
    if (giScoreEl) giScoreEl.textContent = '0';
    if (giTimerEl) giTimerEl.textContent = String(typeof TIME_PER_ROUND !== 'undefined' ? TIME_PER_ROUND : 15);
    startRound();
  }
}

// Mobile nav: dropdown toggle
var nav = document.querySelector('nav');
var navToggleBtn = document.querySelector('.nav-toggle');

if (nav && navToggleBtn) {
  navToggleBtn.addEventListener('click', function () {
    nav.classList.toggle('is-open');
  });
}

// Desktop: Fullscreen + QR code

var fsBtn = document.createElement("button");
fsBtn.type = "button";
fsBtn.id = "btnFullscreen";
fsBtn.className = "fs-btn";
fsBtn.textContent = "Fullscreen";
nowPlayingEl.appendChild(fsBtn);

// Toggle fullscreen
function toggleFullscreen() {
  // If not in fullscreen, request it; otherwise exit
  if (!document.fullscreenElement) {
    // request fullscreen on the whole page
    document.documentElement.requestFullscreen().catch(function () { });
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

// Keep the button label in sync with the current state
function syncFsBtn() {
  if (!fsBtn) return;
  fsBtn.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
}

fsBtn.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", syncFsBtn);


/*Desktop QR code panel*/
(function () {
  var wrap = document.createElement("div");
  wrap.id = "qrWrap";

  var img = document.createElement("img");
  img.id = "qrImg";
  img.src = "images/qr-code.png"; // QR image
  img.alt = "QR code to open this site on your phone";

  var txt = document.createElement("span");
  txt.className = "qr-text";
  txt.textContent = "Scan to open on your phone";

  wrap.appendChild(img);
  wrap.appendChild(txt);
  document.body.appendChild(wrap);
})();