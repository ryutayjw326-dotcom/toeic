// ==========================================
// 【Part 5/6/7 自動判別・メインクイズゲーム処理】
// ==========================================

function startApp() {
    const allShuffled = [...rawQuizData].sort(() => Math.random() - 0.5);
    shuffledQuestions = allShuffled.slice(0, targetQuestionCount);
    
    currentQuestionIndex = 0;
    correctCount = 0;
    totalToeicScore = 0;
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("score-container").style.display = "none";
    showQuestion();
}

function showQuestion() {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const qPart = String(currentQuestion.part || "5").trim(); // 指定がなければPart5扱い
    
    // 進捗の表示切り替え
    if (qPart === "5") {
        document.getElementById("progress").innerText = `問題: ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    } else {
        document.getElementById("progress").innerText = `長文セット: ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    }
    
    const qLevel = currentQuestion.level ? currentQuestion.level : "未設定";
    const qCategory = currentQuestion.category ? currentQuestion.category : "その他";
    
    document.getElementById("badge-area").innerHTML = `
        <span class="level-badge" style="background:#6f42c1;">Part ${qPart}</span>
        <span class="level-badge">対象レベル: ${qLevel}</span>
        <span class="cat-badge">分類: ${qCategory}</span>
    `;

    // 画面パーツの初期化
    const qTextElement = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices-container");
    const feedbackArea = document.getElementById("feedback-area");
    
    choicesContainer.innerHTML = "";
    feedbackArea.innerHTML = "";
    document.getElementById("next-btn").style.display = "none";

    // ------------------------------------------
    // 【分岐処理①】Part 5 の場合の画面表示 (1問1答型)
    // ------------------------------------------
    if (qPart === "5") {
        let displayQuestionText = currentQuestion.question || "";
        // 縦棒記号「|」をHTMLの改行タグ「<br>」に一括変換する
        displayQuestionText = displayQuestionText.replace(/\|/g, "<br>");
        displayQuestionText = displayQuestionText.replace(/-{2,}/g, function(match) {
            return `<span style="white-space: nowrap;">${match}</span>`;
        });
        qTextElement.className = "question-box"; // Part5用の見た目に切り替え
        qTextElement.innerHTML = displayQuestionText;

        const choices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
        choices.forEach(choice => {
            if (!choice) return;
            const button = document.createElement("button");
            button.innerText = choice;
            button.className = "choice-btn";
            button.onclick = () => checkPart5Answer(choice);
            choicesContainer.appendChild(button);
        });
    } 
    // ------------------------------------------
    // 【分岐処理②】Part 6 または Part 7 の場合の画面表示 (長文一括型)
    // ------------------------------------------
    else if (qPart === "6" || qPart === "7") {
            let displayPassageText = currentQuestion.passage || currentQuestion.question || "";
            displayPassageText = displayPassageText.replace(/\|/g, "<br>");

            // ★【修正版】数字の「1」〜「4」の前後にあるスペースや記号を巻き込まず、数字だけを確実に (1) に変える
            if (String(qPart).trim() === "6") {
                for (let i = 1; i <= 4; i++) {
                    // 数字の前にスペースがあり、後ろにスペースかカンマ・ピリオドが来る場合を安全に狙い撃ち
                    const numRegex1 = new RegExp(`(\\s)${i}(\\s|\\.|\\,)`, "g");
                    displayPassageText = displayPassageText.replace(numRegex1, `$1<b>(${i})</b>$2`);
            
                    // 文頭など、前後に特殊な文字がある場合の予備置換
                    const numRegex2 = new RegExp(`([^\\d\\w])${i}([^\\d\\w])`, "g");
                    displayPassageText = displayPassageText.replace(numRegex2, `$1<b>(${i})</b>$2`);
                }
            }

            qTextElement.className = "passage-box";
            qTextElement.innerHTML = displayPassageText;

        // Part 7は問題数が大問ごとに2〜5問と可変するため、データが存在する最大5問分ループする
        for (let i = 1; i <= 5; i++) {
            const c1 = currentQuestion[`q${i}_choice1`];
            if (!c1) continue; // choice1が空ならその問題番号は存在しないとみなしてスキップ

            const qNum = currentQuestion[`q${i}_num`] || i;
            const qQuestionText = currentQuestion[`q${i}_question`] || ""; // Part7用の設問文
            const choices = [c1, currentQuestion[`q${i}_choice2`], currentQuestion[`q${i}_choice3`], currentQuestion[`q${i}_choice4`]];

            // 問題カード
            const qCard = document.createElement("div");
            qCard.className = "part6-question-card";
            qCard.id = `q-card-${i}`;

            // 問題タイトル（Part 7なら設問テキストも一緒に表示）
            const qTitle = document.createElement("div");
            qTitle.className = "part6-q-number";
            if (qPart === "7" && qQuestionText) {
                qTitle.innerHTML = `【 問 ${qNum} 】 <span style="color:#333; font-weight:normal;">${qQuestionText}</span>`;
            } else {
                qTitle.innerText = `【 問 ${qNum} 】`;
            }
            qCard.appendChild(qTitle);

            // 4択ボタン
            choices.forEach(choice => {
                if (!choice) return;
                const button = document.createElement("button");
                button.innerText = choice;
                button.className = `choice-btn q${i}-btns`;
                button.onclick = () => selectMultiAnswer(i, choice, button);
                qCard.appendChild(button);
            });

            // 解説エリアの空箱
            const cardFeedback = document.createElement("div");
            cardFeedback.id = `card-feedback-${i}`;
            qCard.appendChild(cardFeedback);

            choicesContainer.appendChild(qCard);
        }

        // 一括答え合わせボタン
        const checkAllBtn = document.createElement("button");
        checkAllBtn.id = "check-all-btn";
        checkAllBtn.className = "next-btn";
        checkAllBtn.style.background = "#28a745";
        checkAllBtn.innerText = qPart === "6" ? "4問まとめて答え合わせ" : "まとめて答え合わせ";
        checkAllBtn.onclick = () => checkAllMultiAnswers(qPart);
        choicesContainer.appendChild(checkAllBtn);

        currentQuestion.userAnswers = {};
    }
}

// ------------------------------------------
// 【Part 5専用】解答・即時判定ロジック
// ------------------------------------------
function checkPart5Answer(selectedChoice) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const feedbackArea = document.getElementById("feedback-area");
    const buttons = document.querySelectorAll(".choice-btn");
    buttons.forEach(btn => btn.disabled = true);

    currentQuestion.selectedAnswer = String(selectedChoice).trim();
    const isCorrect = String(selectedChoice).trim() === String(currentQuestion.answer).trim();

    // ウェイト計算
    const levelStr = currentQuestion.level ? String(currentQuestion.level) : "";
    const parts = levelStr.split(/[〜-]/);
    const maxScore = parseInt(parts.concat().pop(), 10) || 600;
    let weight = 1.0;
    if (maxScore >= 800) weight = 1.2;
    else if (maxScore >= 700) weight = 1.1;

    if (isCorrect) {
        correctCount++;
        totalToeicScore += weight; 
        feedbackArea.innerHTML = `<div class="result correct">正解！</div>`;
    } else {
        feedbackArea.innerHTML = `<div class="result incorrect">不正解...（正解: ${currentQuestion.answer}）</div>`;
    }
    
    // 英文全文の組み立て
    const rawQuestion = currentQuestion.question || "";
    const correctAnswer = currentQuestion.answer || "";
    let completedSentence = rawQuestion.replace(/-{2,}/g, `<u><b>${correctAnswer}</b></u>`);
    completedSentence = completedSentence.replace(/_{2,}/g, `<u><b>${correctAnswer}</b></u>`);
    completedSentence = completedSentence.replace(/\(\s*\)/g, `<u><b>${correctAnswer}</b></u>`);
    if (completedSentence === rawQuestion) {
        completedSentence = `${rawQuestion} <br>→ <b>正解単語: ${correctAnswer}</b>`;
    }

    let htmlContent = `
        <div style="background: #fff; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 1.05rem; line-height: 1.4; word-spacing: 0.15em;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <b>【英文全文】</b>
                <button onclick="speakSentence('${correctAnswer ? rawQuestion.replace(/-{2,}/g, correctAnswer).replace(/'/g, "\\'") : ""}')" 
                        style="background: #e9ecef; border: 1px solid #ced4da; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    🔊 音読する
                </button>
            </div>
            <span style="color: #007bff;">${completedSentence}</span>
        </div>
    `;

    if (currentQuestion.translation) {
        htmlContent += `<div class="translation-box"><b>【和訳】</b><br>${currentQuestion.translation}</div>`;
    }

    htmlContent += `<div class="explanation-section"><div class="exp-title">【解説】</div>`;
    const rawChoices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
    let wrongCount = 1;

    rawChoices.forEach((choice, index) => {
        if (!choice) return;
        const label = ["(A)", "(B)", "(C)", "(D)"][index];
        let itemExp = "";
        
        if (String(choice).trim() === String(currentQuestion.answer).trim()) {
            itemExp = currentQuestion.exp_correct || "正解の選択肢です。";
            htmlContent += `<div class="exp-item" style="color:#155724; font-weight:bold;"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(itemExp).replace(/:|：/g, '：<br>')}</span></div>`;
        } else {
            const wrongKey = "exp_wrong" + wrongCount;
            itemExp = currentQuestion[wrongKey] || "不正解の選択肢です。";
            htmlContent += `<div class="exp-item"><span class="exp-label">${label} ${choice}</span><span class="exp-content">${String(itemExp).replace(/:|：/g, '：<br>')}</span></div>`;
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
    currentQuestion.userAnswers[qIdx] = String(choice).trim();

    // 押された設問（qIdx）のボタン群だけを狙ってハイライトを変更する
    const targetButtons = document.querySelectorAll(`.q${qIdx}-btns`);
    targetButtons.forEach(btn => btn.style.background = "white");
    clickedBtn.style.background = "#e8f4fd"; // 薄い青色にハイライト
}

// ------------------------------------------
// 【Part 6/7 共通】一括答え合わせロジック
// ------------------------------------------
function checkAllMultiAnswers(qPart) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    
    // 未選択の設問がないかチェック
    for (let i = 1; i <= 5; i++) {
        if (currentQuestion[`q${i}_choice1`] && !currentQuestion.userAnswers[i]) {
            alert(`問 ${i} がまだ未選択です。すべての問題を解いてから答え合わせをしてください。`);
            return;
        }
    }

    // 「一括答え合わせボタン」を非表示にする
    document.getElementById("check-all-btn").style.display = "none";
    
    // 画面内のすべての選択肢ボタンを一括で無効化
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);

    // スコア計算用の配点ウェイト算出（既存ロジックママ）
    const levelStr = currentQuestion.level ? String(currentQuestion.level) : "";
    const parts = levelStr.split(/[〜-]/);
    const maxScore = parseInt(parts.concat().pop(), 10) || 600;
    let weight = 1.0;
    if (maxScore >= 800) weight = 1.2;
    else if (maxScore >= 700) weight = 1.1;

    // データが存在する設問（最大5問）を1問ずつ自動で採点
    for (let i = 1; i <= 5; i++) {
        if (!currentQuestion[`q${i}_choice1`]) continue;

        const userAns = currentQuestion.userAnswers[i];
        const correctAns = String(currentQuestion[`q${i}_answer`]).trim();
        const isCorrect = userAns === correctAns;
        const cardFeedback = document.getElementById(`card-feedback-${i}`);

        if (isCorrect) {
            correctCount++;
            totalToeicScore += weight;
            cardFeedback.innerHTML = `<div class="result correct" style="margin-bottom:10px;">問 ${i} 正解！</div>`;
        } else {
            cardFeedback.innerHTML = `<div class="result incorrect" style="margin-bottom:10px;">問 ${i} 不正解... （正解: ${correctAns}）</div>`;
        }

        // 各設問カードの中に【解説】ブロックを組み立てて挿入
        let htmlContent = `<div class="explanation-section" style="margin-top:5px;"><div class="exp-title">【解説】</div>`;
        const rawChoices = [currentQuestion[`q${i}_choice1`], currentQuestion[`q${i}_choice2`], currentQuestion[`q${i}_choice3`], currentQuestion[`q${i}_choice4`]];
        let wrongCount = 1;

        rawChoices.forEach((choice, index) => {
            if (!choice) return;
            const label = ["(A)", "(B)", "(C)", "(D)"][index];
            let itemExp = "";

            if (String(choice).trim() === correctAns) {
                itemExp = currentQuestion[`q${i}_exp_correct`] || "正解の選択肢です。";
                htmlContent += `
                    <div class="exp-item" style="color:#155724; font-weight:bold;">
                        <span class="exp-label">${label} ${choice}</span>
                        <span class="exp-content">${String(itemExp).replace(/:|：/g, '：<br>')}</span>
                    </div>`;
            } else {
                const wrongKey = `q${i}_exp_wrong${wrongCount}`;
                itemExp = currentQuestion[wrongKey] || "不正解の選択肢です。";
                htmlContent += `
                    <div class="exp-item">
                        <span class="exp-label">${label} ${choice}</span>
                        <span class="exp-content">${String(itemExp).replace(/:|：/g, '：<br>')}</span>
                    </div>`;
                wrongCount++;
            }
        });
        htmlContent += `</div>`;
        cardFeedback.innerHTML += htmlContent;
    }

    // 全体フィードバック（和訳や全文の生成）
    const mainFeedback = document.getElementById("feedback-area");
    let globalHtml = "";
    
    // 【Part 6 のみ有効】空欄に4問分の正解を自動でハメ込んだ完成文を作る
    if (String(qPart).trim() === "6") {
        let completedPassage = currentQuestion.passage || currentQuestion.question || "";
        completedPassage = completedPassage.replace(/\|/g, "<br>"); // 縦棒を改行に変える

        for (let i = 1; i <= 4; i++) {
            const correctAns = String(currentQuestion[`q${i}_answer`]).trim();
            if (!correctAns) continue;
            
            // 補充した単語が前後の単語とくっつかないよう、必ず左右に半角スペースを付与
            const insertedText = ` <u><b>${correctAns}</b></u> `;
            const escapedNum = String(i);

            // あらゆるパターンの空欄表記（(1), 【1】, ---1---, 剥き出しの1）に対応する正規表現
            const bracketRegex = new RegExp(`[\\(\\[\\【]\\s*${escapedNum}\\s*[\\)\\]\\】]`, "g");
            const hyphenRegex = new RegExp(`[-_\\*\\s]*${escapedNum}[-_\\*\\s]*`, "g");
            const singleRegex = new RegExp(`\\b${escapedNum}\\b`, "g");
            
            if (completedPassage.match(bracketRegex)) {
                completedPassage = completedPassage.replace(bracketRegex, insertedText);
            } else if (completedPassage.match(hyphenRegex)) {
                completedPassage = completedPassage.replace(hyphenRegex, insertedText);
            } else {
                completedPassage = completedPassage.replace(singleRegex, insertedText);
            }
        }
        
        globalHtml += `
            <div style="background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 1.05rem; line-height: 1.7; word-spacing: 0.15em;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <b style="color: #007bff;">【英文全文（空欄補充済み）】</b>
                    <button onclick="speakSentence('${(currentQuestion.passage || "").replace(/'/g, "\\'")}')" style="background: #e9ecef; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; cursor: pointer;">🔊 音読する</button>
                </div>
                <div>${completedPassage}</div>
            </div>
        `;
    }
    else {
        // 【Part 7 の場合】余計な文字置換は一切せず、元の長文（|を改行に変えたもの）をそのまま美しく表示する
        let cleanPassage = currentQuestion.passage || currentQuestion.question || "";
        cleanPassage = cleanPassage.replace(/\|/g, "<br>"); // 縦棒を改行に戻す

        globalHtml += `
            <div style="background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 1.05rem; line-height: 1.7; word-spacing: 0.15em;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <b style="color: #007bff;">【英文全文】</b>
                    <button onclick="speakSentence('${(currentQuestion.passage || "").replace(/'/g, "\\'")}')" style="background: #e9ecef; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; cursor: pointer;">🔊 音読する</button>
                </div>
                <div>${cleanPassage}</div>
            </div>
        `;
    }

    // 長文全体の和訳ブロックを追加
    if (currentQuestion.translation) {
        globalHtml += `<div class="translation-box" style="margin-top:15px;"><b>【長文全体の和訳】</b><br>${currentQuestion.translation}</div>`;
    }

    mainFeedback.innerHTML = globalHtml;
    
    // 「次の問題（長文）へ」ボタンを活性化
    document.getElementById("next-btn").style.display = "block";
    
    // 解説位置までスムーズにスクロール
    setTimeout(() => { mainFeedback.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// ==========================================
// 【音声読み上げ処理】
// ==========================================
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