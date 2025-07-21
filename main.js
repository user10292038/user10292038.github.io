const submitQuiz = document.querySelector("#submitQuiz");
const scoreBox = document.querySelector("#scoreBox");

var q1, q2, q3, q4, q5, score = 0;
var CorrectAns = ["c", "b", "b", "a", "b"];

function checkAnswers() {

    // Check if all questions are answered
    if (!document.querySelector('input[name="q1"]:checked') ||
        !document.querySelector('input[name="q2"]:checked') ||
        !document.querySelector('input[name="q3"]:checked') ||
        !document.querySelector('input[name="q4"]:checked') ||
        !document.querySelector('input[name="q5"]:checked')) {
        alert("Please answer all questions before submitting.");
        return;
    }
    score = 0;

    for(let i = 0; i < CorrectAns.length; i++) {
        CheckOneAnswer(i + 1, CorrectAns[i]);
    }

    scoreBox.innerHTML = `Your score is: ${score} / 5`;
}
submitQuiz.addEventListener("click", checkAnswers);

function CheckOneAnswer(qnNo, CorrectAnswer) {
    qTemp = document.querySelector("input[name = 'q" + qnNo + "']:checked");
    console.log("Q" + qnNo + ":", qTemp);
    if (qTemp && qTemp.value === CorrectAnswer) {
        score++;
    }
}