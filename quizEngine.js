// ==========================================
// 【メインクイズゲーム処理】
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
    document.getElementById("progress").innerText = `問題: ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    
    const qLevel = currentQuestion.level ? currentQuestion.level : "未設定";
    const qCategory = currentQuestion.category ? currentQuestion.category : "その他";
    
    document.getElementById("badge-area").innerHTML = `
        <span class="level-badge">対象レベル: ${qLevel}</span>
        <span class="cat-badge">分類: ${qCategory}</span>
    `;

    document.getElementById("question-text").innerText = currentQuestion.question;
    document.getElementById("choices-container").innerHTML = "";
    document.getElementById("feedback-area").innerHTML = "";
    document.getElementById("next-btn").style.display = "none";

    const choices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
    choices.forEach(choice => {
        if (!choice) return;
        const button = document.createElement("button");
        button.innerText = choice;
        button.className = "choice-btn";
        button.onclick = () => checkAnswer(choice);
        document.getElementById("choices-container").appendChild(button);
    });
}

function checkAnswer(selectedChoice) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const feedbackArea = document.getElementById("feedback-area");
    const buttons = document.querySelectorAll(".choice-btn");
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = String(selectedChoice).trim() === String(currentQuestion.answer).trim();

    const levelStr = currentQuestion.level ? String(currentQuestion.level) : "";
    const parts = levelStr.split(/[〜-]/);
    const maxStr = parts.concat().pop();
    const maxScore = parseInt(maxStr, 10) || 600;
    
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
    
    let htmlContent = "";

    // ★修正：問題文の空欄「-----」を正解の単語に置き換えて英文を完成させる
    const rawQuestion = currentQuestion.question;
    const correctAnswer = currentQuestion.answer;
    
    // 連続するハイフン（--以上）を正解単語に置換する（太字・下線で強調）
    let completedSentence = rawQuestion.replace(/-{2,}/g, `<u><b>${correctAnswer}</b></u>`);
    
    // （念のため）アンダーバーやカッコの書き方にも対応できるように残す
    completedSentence = completedSentence.replace(/_{2,}/g, `<u><b>${correctAnswer}</b></u>`);
    completedSentence = completedSentence.replace(/\(\s*\)/g, `<u><b>${correctAnswer}</b></u>`);
    
    // もし置換されなかった場合はお尻に正解を添える
    if (completedSentence === rawQuestion) {
        completedSentence = `${rawQuestion} <br>→ <b>正解単語: ${correctAnswer}</b>`;
    }

    // 和訳の上に「完成した英文」を表示するボックス
    htmlContent += `
        <div style="background: #fff; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 1.05rem; line-height: 1.4; word-spacing: 0.15em;"> <!-- ★ここに word-spacing: 0.15em; を追加 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; word-spacing: normal;"> <!-- 見出しやボタンは通常の間隔に戻す -->
                <b>【英文全文】</b>
                <button onclick="speakSentence('${correctAnswer ? rawQuestion.replace(/-{2,}/g, correctAnswer).replace(/_{2,}/g, correctAnswer).replace(/\(\s*\)/g, correctAnswer).replace(/'/g, "\\'") : ""}')" 
                        style="background: #e9ecef; border: 1px solid #ced4da; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    🔊 音読する
                </button>
            </div>
            <span style="color: #007bff;">${completedSentence}</span>
        </div>
    `;

    // 従来の和訳表示
    if (currentQuestion.translation) {
        htmlContent += `<div class="translation-box"><b>【和訳】</b><br>${currentQuestion.translation}</div>`;
    }

    htmlContent += `<div class="explanation-section"><div class="exp-title">【解説】</div>`;
    const rawChoices = [currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4];
    let wrongCount = 1;

    rawChoices.forEach((choice, index) => {
        if (!choice) return;
        const labels = ["(A)", "(B)", "(C)", "(D)"];
        const label = labels[index];
        let itemExp = "";
        
        if (String(choice).trim() === String(currentQuestion.answer).trim()) {
            itemExp = currentQuestion.exp_correct ? currentQuestion.exp_correct : "正解の選択肢です。";
            const formattedExp = String(itemExp).replace(/:|：/g, '：<br>');
            htmlContent += `
                <div class="exp-item" style="color:#155724; font-weight:bold;">
                    <span class="exp-label">${label} ${choice}</span>
                    <span class="exp-content">${formattedExp}</span>
                </div>`;
        } else {
            const wrongKey = "exp_wrong" + wrongCount;
            itemExp = currentQuestion[wrongKey] ? currentQuestion[wrongKey] : "不正解の選択肢です。";
            const formattedExp = String(itemExp).replace(/:|：/g, '：<br>');
            htmlContent += `
                <div class="exp-item">
                    <span class="exp-label">${label} ${choice}</span>
                    <span class="exp-content">${formattedExp}</span>
                </div>`;
            wrongCount++;
        }
    });

    htmlContent += `</div>`;
    feedbackArea.innerHTML += htmlContent;
    
    setTimeout(() => {
        feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    document.getElementById("next-btn").style.display = "block";
}

// ★新しく追加：英文をネイティブ音声で音読する機能
function speakSentence(text) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0; 

    // ★追加：ブラウザが持っている音声リストから、一番高音質な英語の声を探す
    const voices = window.speechSynthesis.getVoices();
    // 'Google' や 'Microsoft'、'Apple' などの高クオリティな音声、または 'natural' という名前が入った声を探す
    const premiumVoice = voices.find(v => v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft') || v.name.includes('Samantha')));
    
    if (premiumVoice) {
        utterance.voice = premiumVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}
// ★新しく追加：途中でクイズを終わらせて採点画面へ進む機能
function finishQuizEarly() {
    // 現在までに実際に解いた問題数を計算
    // （まだ解答ボタンを押していない状態なら現在のインデックス、すでに解答済みならインデックス+1）
    const isAnswered = document.getElementById("next-btn").style.display === "block";
    const answeredCount = isAnswered ? currentQuestionIndex + 1 : currentQuestionIndex;

    // まだ1問も解いていない場合は終われないようにガード
    if (answeredCount === 0) {
        alert("まだ1問も解答していません。少なくとも1問以上解答してから終了してください。");
        return;
    }

    if (!confirm(`現在 ${answeredCount} 問まで解いています。ここで終了して採点しますか？`)) {
        return; // キャンセルされたら何もしない
    }

    // 読み上げ音声が流れていたら止める
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    // ★重要：出題リスト（shuffledQuestions）を、今解き終わった問題までの長さに強制的に縮小する
    // これにより、scoreCalculator.js側が「この問題数で全行程が終了した」と誤認して正しく計算してくれます
    shuffledQuestions = shuffledQuestions.slice(0, answeredCount);
    currentQuestionIndex = answeredCount; 

    // scoreCalculator.jsの終了処理を直接呼び出す
    // インデックスが配列の長さと同じになっているため、自動的に採点画面へ移行します
    nextQuestion();
}
// ★修正：1問からでも途中で終わらせて採点画面へ進めるように調整
function finishQuizEarly() {
    const isAnswered = document.getElementById("next-btn").style.display === "block";
    const answeredCount = isAnswered ? currentQuestionIndex + 1 : currentQuestionIndex;

    if (answeredCount === 0) {
        alert("まだ1問も解答していません。少なくとも1問以上解答してから終了してください。");
        return;
    }

    if (!confirm(`現在 ${answeredCount} 問まで解いています。ここで終了して採点しますか？\n（※合計6問未満の場合はTOEIC換算スコアは表示されません）`)) {
        return; 
    }

    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    shuffledQuestions = shuffledQuestions.slice(0, answeredCount);
    currentQuestionIndex = answeredCount; 

    nextQuestion();
}