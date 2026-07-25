// ==========================================
// 【セキュリティシステム：1行ずつ確実に実行する版】
// ==========================================
let rawQuizData = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let totalToeicScore = 0;

// 起動時に一番最初に実行されるサブルーチン
window.addEventListener('DOMContentLoaded', async function() {
    // 1. まずパスワード入力を求め、正解するまで絶対に次に進ませない
    const isAuthorized = await checkSecurity();
    if (!isAuthorized) {
        denyAccess();
        return; // プログラムをここで完全に終了（STOP）
    }

    // 2. パスワードが完全一致した後に、初めてCSVファイルの読み込みを開始する
    fetch('questions.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('問題ファイル（questions.csv）が見つからないか、読み込めませんでした。');
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            const decoder = new TextDecoder('utf-8'); 
            const text = decoder.decode(buffer).trim();
            loadCsvData(text);
        })
        .catch(error => {
            alert('アプリ初期化エラー: ' + error.message);
        });
});

// パスワードを暗号化してチェックする専用関数
async function checkSecurity() {
    let inputPass = prompt("パスワードを入力してください：");
    if (!inputPass) return false;

    // 全角数字を半角数字に自動変換
    inputPass = inputPass.trim().replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // 入力された文字（6230）をその場で暗号化
    const msgBuffer = new TextEncoder().encode(inputPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 「6230」の正しいハッシュ値
    const correctHash = "bc8b3fa73f309fa49673cc8e7fa56a297e685f0ef3d11c7fa98897f267c7e53f"; 

    // 暗号が完全に一致していれば true、違っていれば false を返す
    return (inputHash === correctHash);
}

function denyAccess() {
    alert("パスワードが違います。アクセス権がありません。");
    document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px; color:#dc3545;'>Access Denied</h1>";
}

// ==========================================
// 【メインクイズ処理プログラム】
// ==========================================
function loadCsvData(text) {
    const lines = text.split(/\r?\n/);
    const firstLine = lines.concat().shift() || "";
    
    let delimiter = "\t"; 
    if (firstLine.includes(",") && !firstLine.includes("\t")) {
        delimiter = ","; 
    }

    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

    rawQuizData = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(delimiter);
        const rowData = {};
        headers.forEach((header, index) => {
            let val = columns[index] !== undefined ? columns[index].trim() : "";
            val = val.replace(/^"|"$/g, '').replace(/""/g, '"');
            rowData[header] = val;
        });
        rawQuizData.push(rowData);
    }

    startApp();
}

function startApp() {
    shuffledQuestions = [...rawQuizData].sort(() => Math.random() - 0.5);
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

    if (isCorrect) {
        correctCount++;
        const levelStr = currentQuestion.level ? String(currentQuestion.level) : "";
        const parts = levelStr.split(/[〜-]/);
        const maxStr = parts.concat().pop();
        const maxScore = parseInt(maxStr, 10) || 0;

        if (maxScore >= 800) totalToeicScore += 15;
        else if (maxScore >= 700) totalToeicScore += 10;
        else totalToeicScore += 5;

        feedbackArea.innerHTML = `<div class="result correct">正解！</div>`;
    } else {
        feedbackArea.innerHTML = `<div class="result incorrect">不正解...（正解: ${currentQuestion.answer}）</div>`;
    }
    
    let htmlContent = "";
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

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        showQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        document.getElementById("quiz-container").style.display = "none";
        const scoreBoard = document.getElementById("score-container");
        scoreBoard.style.display = "block";

        if (totalToeicScore < 10) totalToeicScore = 10;
        if (totalToeicScore > 495) totalToeicScore = 495;

        let evaluation = "";
        if (totalToeicScore >= 400) evaluation = "素晴らしい！TOEIC 800点〜900点レベルの実力です。";
        else if (totalToeicScore >= 250) evaluation = "ナイス！TOEIC 600点〜700点レベルの実力です。";
        else evaluation = "伸びしろ十分！基礎を固めてさらにスコアアップを目指しましょう。";

        scoreBoard.innerHTML = `
            <h2>結果発表</h2>
            <p>${shuffledQuestions.length}問中, ${correctCount}問正解</p>
            <p>あなたの想定Part5換算スコアは...</p>
            <div class="toeic-score">${totalToeicScore} 点 / 495点</div>
            <p style="font-weight:bold; color:#495057;">${evaluation}</p>
            <button class="next-btn" onclick="location.reload()">もう一度挑戦する</button>
        `;
    }
}