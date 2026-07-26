function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        showQuestion(); // quizEngine.jsの関数
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        document.getElementById("quiz-container").style.display = "none";
        const scoreBoard = document.getElementById("score-container");
        scoreBoard.style.display = "block";

        const totalQuestions = shuffledQuestions.length;
        
        let totalWeight = 0;
        shuffledQuestions.forEach(q => {
            const levelStr = q.level ? String(q.level) : "";
            const parts = levelStr.split(/[〜-]/);
            const maxStr = parts.concat().pop();
            const maxScore = parseInt(maxStr, 10) || 600;
            if (maxScore >= 800) totalWeight += 1.2;
            else if (maxScore >= 700) totalWeight += 1.1;
            else totalWeight += 1.0;
        });

        let calculatedScore = 0;
        if (correctCount > 0) {
            calculatedScore = (totalToeicScore / totalQuestions) * 495;
            if (correctCount === totalQuestions) {
                calculatedScore = 495;
            }
        }

        let finalToeicScore = Math.round(calculatedScore / 5) * 5;

        if (finalToeicScore < 10 && correctCount > 0) finalToeicScore = 10;
        if (finalToeicScore === 0 && correctCount === 0) finalToeicScore = 5;
        if (finalToeicScore > 495) finalToeicScore = 495;

        let evaluation = "";
        if (finalToeicScore >= 400) evaluation = "素晴らしい！TOEIC 800点〜900点レベルの実力です。";
        else if (finalToeicScore >= 250) evaluation = "ナイス！TOEIC 600点〜700点レベルの実力です。";
        else evaluation = "伸びしろ十分！基礎を固めてさらにスコアアップを目指しましょう。";

        let scoreHtmlArea = "";
        if (totalQuestions >= 6) {
            scoreHtmlArea = `
                <p>あなたの想定Part5換算スコアは...</p>
                <div class="toeic-score">${finalToeicScore} 点 / 495点</div>
                <p style="font-weight:bold; color:#495057;">${evaluation}</p>
            `;
        } else {
            scoreHtmlArea = `
                <p style="color:#6c757d; padding:15px; background:#f1f3f5; border-radius:6px;">
                    ※問題数が少ない（5問以下）ため、TOEIC換算スコアの算出はスキップされました。正確な実力を測るには6問以上で挑戦してください。
                </p>
            `;
        }

        scoreBoard.innerHTML = `
            <h2>結果発表</h2>
            <p>${totalQuestions}問中、${correctCount}問正解</p>
            ${scoreHtmlArea}
            <button class="next-btn" onclick="location.reload()">別のファイルを読み込む</button>
            <button class="next-btn" style="background:#28a745;" onclick="startApp()">同じ問題に再挑戦</button>
        `;
    }
}