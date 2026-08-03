// ==========================================
// 【本番モード・試験中解説非表示版（quizEngine.js）】
// ==========================================

let quizTimerInterval = null;
let quizTimeLeftSeconds = 75 * 60; 
let isMockExamModeActive = false;  

function startApp() {
    isMockExamModeActive = (rawQuizData.length > 0 && String(rawQuizData[0].part).trim() === "5" && String(rawQuizData[rawQuizData.length - 1].part).trim() === "7");

    if (isMockExamModeActive) {
        const part5List = rawQuizData.filter(q => String(q.part).trim() === "5").sort(() => Math.random() - 0.5);
        const part6List = rawQuizData.filter(q => String(q.part).trim() === "6").sort(() => Math.random() - 0.5);
        const part7List = rawQuizData.filter(q => String(q.part).trim() === "7").sort(() => Math.random() - 0.5);
        shuffledQuestions = [...part5List, ...part6List, ...part7List];
        initQuizTimer();
    } else {
        const allShuffled = [...rawQuizData].sort(() => Math.random() - 0.5);
        shuffledQuestions = allShuffled.slice(0, targetQuestionCount);
        document.getElementById("timer-display").style.display = "none";
        clearInterval(quizTimerInterval);
    }
    
    currentQuestionIndex = 0;
    correctCount = 0;
    totalToeicScore = 0;
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("score-container").style.display = "none";
    showQuestion();
}

function initQuizTimer() {
    clearInterval(quizTimerInterval);
    quizTimeLeftSeconds = 75 * 60; 
    const timerDisplay = document.getElementById("timer-display");
    timerDisplay.style.display = "block";
    timerDisplay.style.color = "#dc3545";
    timerDisplay.style.background = "#fff3cd";

    quizTimerInterval = setInterval(() => {
        quizTimeLeftSeconds--;

        if (quizTimeLeftSeconds <= 0) {
            clearInterval(quizTimerInterval);
            timerDisplay.innerText = "⏱ 時間切れ！";
            if (confirm("75分が経過しました！\nここで終了して採点する場合は「OK」を、\nこのまま延長して解き続ける場合は「キャンセル」を押してください。")) {
                shuffledQuestions = shuffledQuestions.slice(0, currentQuestionIndex + 1);
                currentQuestionIndex = shuffledQuestions.length;
                nextQuestion(); 
            } else {
                timerDisplay.innerText = "⏱ 制限時間終了（延長して挑戦中）";
                timerDisplay.style.color = "#6c757d";
                timerDisplay.style.background = "#e2e3e5";
            }
            return;
        }

        const minutes = Math.floor(quizTimeLeftSeconds / 60);
        const seconds = quizTimeLeftSeconds % 60;
        timerDisplay.innerText = `⏱ 残り時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function showQuestion() {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const qPart = String(currentQuestion.part || "5").trim();
    
    if (qPart === "5") {
        document.getElementById("progress").innerText = `問題: ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    } else {
        document.getElementById("progress").innerText = `長文セット: ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    }
    
    if (isMockExamModeActive) {
        document.getElementById("badge-area").innerHTML = `
            <span class="level-badge" style="background:#6f42c1; padding: 6px 12px; font-size: 0.85rem;">Part ${qPart}</span>
        `;
    } else {
        const qLevel = currentQuestion.level ? currentQuestion.level : "未設定";
        const qCategory = currentQuestion.category ? currentQuestion.category : "その他";
        document.getElementById("badge-area").innerHTML = `
            <span class="level-badge" style="background:#6f42c1;">Part ${qPart}</span>
            <span class="level-badge">対象レベル: ${qLevel}</span>
            <span class="cat-badge">分類: ${qCategory}</span>
        `;
    }

    const qTextElement = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices-container");
    const feedbackArea = document.getElementById("feedback-area");
    
    choicesContainer.innerHTML = "";
    feedbackArea.innerHTML = "";
    document.getElementById("next-btn").style.display = "none";

    // ------------------------------------------
    // 【分岐処理①】Part 5 の画面表示
    // ------------------------------------------
    if (qPart === "5") {
        let displayQuestionText = currentQuestion.question || "";
        displayQuestionText = displayQuestionText.replace(/\|/g, "<br>");
        displayQuestionText = displayQuestionText.replace(/-{2,}/g, function(match) {
            return `<span style="white-space: nowrap;">${match}</span>`;
        });
        qTextElement.className = "question-box"; 
        qTextElement.innerHTML = displayQuestionText;

        const choices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
        choicesContainer.innerHTML = ""; // 念のための初期化ガード
        
        choices.forEach(choice => {
            if (!choice) return;
            const button = document.createElement("button");
            button.innerText = choice;
            button.className = "choice-btn";
            
            // 💡 関数名の大文字小文字を完全に一致させ、確実に応答するように修正
            button.onclick = function() {
                checkPart5Answer(choice);
            };
            choicesContainer.appendChild(button);
        });
    } 
    else if (qPart === "6" || qPart === "7") {
        let displayPassageText = currentQuestion.passage || currentQuestion.question || "";
        displayPassageText = displayPassageText.replace(/\|/g, "<br>");

        if (String(qPart).trim() === "6") {
            for (let i = 1; i <= 4; i++) {
                const numRegex = new RegExp(`(?<![\\d\\:\\.])\\b${i}\\b(?![\\:\\.\\d])`, "g");
                displayPassageText = displayPassageText.replace(numRegex, `<b>(${i})</b>`);
            }
        }

        qTextElement.className = "passage-box";
        qTextElement.innerHTML = displayPassageText;

        // 解答データの初期化ガード
        if (!currentQuestion.userAnswers) currentQuestion.userAnswers = {};

        for (let i = 1; i <= 5; i++) {
            const c1 = currentQuestion[`q${i}_choice1`];
            if (!c1) continue; 

            const qNum = currentQuestion[`q${i}_num`] || i;
            const qQuestionText = currentQuestion[`q${i}_question`] || ""; 
            const choices = [c1, currentQuestion[`q${i}_choice2`], currentQuestion[`q${i}_choice3`], currentQuestion[`q${i}_choice4`]];

            const qCard = document.createElement("div");
            qCard.className = "part6-question-card";
            qCard.id = `q-card-${i}`;

            const qTitle = document.createElement("div");
            qTitle.className = "part6-q-number";
            if (qPart === "7" && qQuestionText) {
                qTitle.innerHTML = `【 問 ${qNum} 】 <span style="color:#333; font-weight:normal;">${qQuestionText}</span>`;
            } else {
                qTitle.innerText = `【 問 ${qNum} 】`;
            }
            qCard.appendChild(qTitle);

            choices.forEach(choice => {
                if (!choice) return;
                const button = document.createElement("button");
                button.innerText = choice;
                button.className = `choice-btn q${i}-btns`;
                
                // もしすでに選んだ記憶があればハイライト（中途終了時などの再描画対策）
                if (currentQuestion.userAnswers[i] === String(choice).trim()) {
                    button.style.background = "#e8f4fd";
                }

                button.onclick = () => selectMultiAnswer(i, choice, button);
                qCard.appendChild(button);
            });

            const cardFeedback = document.createElement("div");
            cardFeedback.id = `card-feedback-${i}`;
            qCard.appendChild(cardFeedback);

            choicesContainer.appendChild(qCard);
        }

        const checkAllBtn = document.createElement("button");
        checkAllBtn.id = "check-all-btn";
        checkAllBtn.className = "next-btn";
        checkAllBtn.style.background = "#28a745";
        // 本番モードならボタンの文字を変更
        checkAllBtn.innerText = isMockExamModeActive ? "解答を記録して次へ" : (qPart === "6" ? "4問まとめて答え合わせ" : "まとめて答え合わせ");
        checkAllBtn.onclick = () => checkAllMultiAnswers(qPart);
        choicesContainer.appendChild(checkAllBtn);
    }
}


function checkPart5Answer(selectedChoice) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    currentQuestion.selectedAnswer = String(selectedChoice).trim();

    const cleanChoice = String(selectedChoice).replace(/[\s\u3000]/g, "").toLowerCase();
    const cleanAnswer = String(currentQuestion.answer).replace(/[\s\u3000]/g, "").toLowerCase();
    const isCorrect = cleanChoice === cleanAnswer;

    if (isCorrect) correctCount++;

    // 【最重要分岐】本番モードなら解説を出さずに即次の問題へ
    if (isMockExamModeActive) {
        if (typeof window.nextQuestion === 'function') {
            window.nextQuestion();
        }
        return;
    }

    // 通常モード時の即時採点処理（既存ママ）
    const feedbackArea = document.getElementById("feedback-area");
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);

    if (isCorrect) {
        feedbackArea.innerHTML = `<div class="result correct">正解！</div>`;
    } else {
        feedbackArea.innerHTML = `<div class="result incorrect">不正解...（正解: ${currentQuestion.answer}）</div>`;
    }
    
    const rawQuestion = currentQuestion.question || "";
    const correctAnswer = currentQuestion.answer || "";
    let completedSentence = rawQuestion.replace(/-{2,}/g, `<u><b>${correctAnswer}</b></u>`).replace(/_{2,}/g, `<u><b>${correctAnswer}</b></u>`).replace(/\(\s*\)/g, `<u><b>${correctAnswer}</b></u>`);
    if (completedSentence === rawQuestion) completedSentence = `${rawQuestion} <br>→ <b>正解単語: ${correctAnswer}</b>`;

    let htmlContent = `
        <div style="background: #fff; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 1.05rem; line-height: 1.4; word-spacing: 0.15em;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <b>【英文全文】</b>
                <button onclick="speakSentence('${correctAnswer ? rawQuestion.replace(/-{2,}/g, correctAnswer).replace(/'/g, "\\'") : ""}')" style="background: #e9ecef; border: 1px solid #ced4da; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">🔊 音読する</button>
            </div>
            <span style="color: #007bff;">${completedSentence}</span>
        </div>
    `;
    if (currentQuestion.translation) htmlContent += `<div class="translation-box"><b>【和訳】</b><br>${currentQuestion.translation}</div>`;

// ------------------------------------------
// 【解説出力部分の修正】Part 5
// ------------------------------------------
    htmlContent += `<div class="explanation-section"><div class="exp-title">【解説】</div>`;
    const rawChoices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
    
    let wrongCount = 1;
    rawChoices.forEach((choice, index) => {
        if (!choice) return;
        const label = ["(A)", "(B)", "(C)", "(D)"][index];
        
        // 選択肢テキスト自体が正解かどうかを判定
        const currentChoiceClean = String(choice).replace(/[\s\u3000]/g, "").toLowerCase();
        const isThisChoiceCorrect = (currentChoiceClean === cleanAnswer);

        if (isThisChoiceCorrect) {
            // 正解の選択肢には exp_correct を表示
            htmlContent += `<div class="exp-item" style="color:#155724; font-weight:bold;"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(currentQuestion.exp_correct || "正解の選択肢です。")}</span></div>`;
        } else {
            // 不正解の選択肢には上から順に exp_wrong1, exp_wrong2, exp_wrong3 を割り当て
            htmlContent += `<div class="exp-item"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(currentQuestion["exp_wrong" + wrongCount] || "不正解の選択肢です。")}</span></div>`;
            wrongCount++;
        }
    });
    htmlContent += `</div>`;

    feedbackArea.innerHTML += htmlContent;
    document.getElementById("next-btn").style.display = "block";
    setTimeout(() => { feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// ------------------------------------------
// 【Part 6/7 共通】選択肢の一時仮保存
// ------------------------------------------
function selectMultiAnswer(qIdx, choice, clickedBtn) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (!currentQuestion.userAnswers) currentQuestion.userAnswers = {};
    currentQuestion.userAnswers[qIdx] = String(choice).trim();

    const targetButtons = document.querySelectorAll(`.q${qIdx}-btns`);
    targetButtons.forEach(btn => btn.style.background = "white");
    clickedBtn.style.background = "#e8f4fd"; 
}

// ------------------------------------------
// 【Part 6/7 共通】一括答え合わせロジック
// ------------------------------------------
function checkAllMultiAnswers(qPart) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (!currentQuestion.userAnswers) currentQuestion.userAnswers = {};
    
    for (let i = 1; i <= 5; i++) {
        if (currentQuestion[`q${i}_choice1`] && !currentQuestion.userAnswers[i]) {
            alert(`問 ${i} がまだ未選択です。すべての問題を解いてから次へ進んでください。`);
            return;
        }
    }

    // 【最重要分岐】本番モードなら、その場での採点・解説出力をスキップして即次の大問へ進む
    if (isMockExamModeActive) {
        for (let i = 1; i <= 5; i++) {
            if (!currentQuestion[`q${i}_choice1`]) continue;
            if (currentQuestion.userAnswers[i] === String(currentQuestion[`q${i}_answer`]).trim()) {
                correctCount++;
            }
        }
        nextQuestion(); 
        return;
    }

    // 通常モード時の即時一括答え合わせ処理
    document.getElementById("check-all-btn").style.display = "none";
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);

    for (let i = 1; i <= 5; i++) {
        if (!currentQuestion[`q${i}_choice1`]) continue;
        const userAns = currentQuestion.userAnswers[i];
        const correctAns = String(currentQuestion[`q${i}_answer`]).trim();
        const cardFeedback = document.getElementById(`card-feedback-${i}`);

        if (userAns === correctAns) {
            correctCount++;
            cardFeedback.innerHTML = `<div class="result correct" style="margin-bottom:10px;">問 ${i} 正解！</div>`;
        } else {
            cardFeedback.innerHTML = `<div class="result incorrect" style="margin-bottom:10px;">問 ${i} 不正解... （正解: ${correctAns}）</div>`;
        }

// ------------------------------------------
// 【解説出力部分の修正】Part 6/7
// ------------------------------------------
        let htmlContent = `<div class="explanation-section" style="margin-top:5px;"><div class="exp-title">【解説】</div>`;
        const rawChoices = [
            currentQuestion[`q${i}_choice1`], 
            currentQuestion[`q${i}_choice2`], 
            currentQuestion[`q${i}_choice3`], 
            currentQuestion[`q${i}_choice4`]
        ];
        
        let wrongCount = 1;
        rawChoices.forEach((choice, index) => {
            if (!choice) return;
            const label = ["(A)", "(B)", "(C)", "(D)"][index];
            const choiceClean = String(choice).trim();

            if (choiceClean === correctAns) {
                // 正解の選択肢には qX_exp_correct を表示
                htmlContent += `<div class="exp-item" style="color:#155724; font-weight:bold;"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(currentQuestion[`q${i}_exp_correct`] || "正解の選択肢です。")}</span></div>`;
            } else {
                // 不正解の選択肢には順に qX_exp_wrong1~3 を表示
                htmlContent += `<div class="exp-item"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(currentQuestion[`q${i}_exp_wrong${wrongCount}`] || "不正解の選択肢です。")}</span></div>`;
                wrongCount++;
            }
        });
        htmlContent += `</div>`;

        cardFeedback.innerHTML += htmlContent;
    }
    const mainFeedback = document.getElementById("feedback-area");
    let globalHtml = "";
    let basePassage = currentQuestion.passage || currentQuestion.question || "";
    
    if (String(qPart).trim() === "6") {
        let completedPassage = basePassage.replace(/\|/g, "<br>"); 
        for (let i = 1; i <= 4; i++) {
            const correctAns = String(currentQuestion[`q${i}_answer`]).trim();
            if (!correctAns) continue;
            const insertedText = ` <u><b>${correctAns}</b></u> `;
            const bracketRegex = new RegExp(`[\\(\\[\\【]\\s*${String(i)}\\s*[\\)\\]\\】]`, "g");
            const hyphenRegex = new RegExp(`[-_\\*\\s]+${String(i)}[-_\\*\\s]+`, "g");
            const singleRegex = new RegExp(`(?<![\\d\\:\\.])\\b${String(i)}\\b(?![\\:\\.\\d])`, "g");
            if (completedPassage.match(bracketRegex)) completedPassage = completedPassage.replace(bracketRegex, insertedText);
            else if (completedPassage.match(hyphenRegex)) completedPassage = completedPassage.replace(hyphenRegex, insertedText);
            else completedPassage = completedPassage.replace(singleRegex, insertedText);
        }
        const speechText = basePassage.replace(/\|/g, " ").replace(/<b>|<\/b>|<u>|<\/u>/g, "").replace(/'/g, "\\'");
        globalHtml += `<div style="background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 1.05rem; line-height: 1.7; word-spacing: 0.15em;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><b style="color: #007bff;">【英文全文（空欄補充済み）】</b><button onclick="speakSentence('${speechText}')" style="background: #e9ecef; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; cursor: pointer; font-weight: bold;">🔊 長文を音読する</button></div><div>${completedPassage}</div></div>`;
    } else {
        const speechText = basePassage.replace(/\|/g, " ").replace(/'/g, "\\'");
        globalHtml += `<div style="background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 1.05rem; line-height: 1.7; word-spacing: 0.15em;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><b style="color: #007bff;">【英文全文】</b><button onclick="speakSentence('${speechText}')" style="background: #e9ecef; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; cursor: pointer; font-weight: bold;">🔊 長文を音読する</button></div><div>${basePassage.replace(/\|/g, "<br>")}</div></div>`;
    }

    if (currentQuestion.translation) globalHtml += `<div class="translation-box" style="margin-top:15px;"><b>【長文全体の和訳】</b><br>${String(currentQuestion.translation).replace(/\|/g, "<br>")}</div>`;
    mainFeedback.innerHTML = globalHtml;
    document.getElementById("next-btn").style.display = "block";
    setTimeout(() => { mainFeedback.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// ------------------------------------------
// 【中途終了処理】
// ------------------------------------------
function finishQuizEarly() {
    if (confirm("途中で採点してクイズを終了しますか？")) {
        clearInterval(quizTimerInterval); 
        shuffledQuestions = shuffledQuestions.slice(0, currentQuestionIndex + 1);
        currentQuestionIndex = shuffledQuestions.length; 
        nextQuestion(); 
    }
}

// ------------------------------------------
// 【音声読み上げ処理】
// ------------------------------------------
function speakSentence(text) {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0; 
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft') || v.name.includes('Samantha')));
    if (premiumVoice) utterance.voice = premiumVoice;
    window.speechSynthesis.speak(utterance);
}