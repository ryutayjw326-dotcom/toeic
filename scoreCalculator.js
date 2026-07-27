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
        
        // ★新ロジック：難易度ごとの「配点」と「上限値」をベースに計算
        let maxPossibleCeiling = 250; // 基本のスコア上限（解いた問題の最高難易度によって変動）
        let earnedPoints = 0;        // 獲得した実質ポイント
        let totalWeight = 0;         // 出題された問題の総ウエイト

        shuffledQuestions.forEach(q => {
            const levelStr = q.level ? String(q.level) : "";
            const parts = levelStr.split(/[〜-]/);
            const maxStr = parts.concat().pop();
            const maxScore = parseInt(maxStr, 10) || 600;

            // ① 出題された問題に応じて、このテスト全体の「スコア上限（天井）」を引き上げる
            if (maxScore >= 800) {
                if (maxPossibleCeiling < 495) maxPossibleCeiling = 495;
            } else if (maxScore >= 700) {
                if (maxPossibleCeiling < 380) maxPossibleCeiling = 380; // 700点レベルまでなら上限は380点付近
            }

            // ② 問題の難易度に応じた配点のウエイト（難しいほど配点が高い）
            let weight = 1.0;  // 600点以下
            if (maxScore >= 800) weight = 2.5;     // 800点以上は配点を2.5倍に高くする
            else if (maxScore >= 700) weight = 1.6; // 700点レベルは1.6倍

            totalWeight += weight;

            // ③ 正解していたら、その問題の配点（ウエイト）をボーナスとして獲得
            // （checkAnswer側ではなく、ここで一括して正誤判定からポイント化します）
            const isCorrect = String(q.userAnswer).trim() === String(q.answer).trim(); 
            // ※注意：既存の「正解数」とは別に、各問題の正誤を判定するために
            // quizEngine.js側でユーザーの解答を保存する処理を補う必要があります（後述）
        });

        // 💡 上記のウエイト計算を安全に行うため、以前の totalToeicScore の蓄積方法ではなく、
        // 最終的な「正解した問題の難易度ウエイトの合計」をここで再計算します。
        let correctWeightSum = 0;
        shuffledQuestions.forEach(q => {
            const levelStr = q.level ? String(q.level) : "";
            const parts = levelStr.split(/[〜-]/);
            const maxStr = parts.concat().pop();
            const maxScore = parseInt(maxStr, 10) || 600;

            // 各問題が正解だったかチェック
            // （quizEngine.jsのcheckAnswerで、選択された答えを記録するように後ほど1行追加します）
            if (q.selectedAnswer === q.answer) {
                if (maxScore >= 800) correctWeightSum += 2.5;
                else if (maxScore >= 700) correctWeightSum += 1.6;
                else correctWeightSum += 1.0;
            }
        });

        // 【計算】獲得したウエイト割合 × 495点
        let calculatedScore = 0;
        if (totalWeight > 0) {
            calculatedScore = (correctWeightSum / totalWeight) * 495;
        }

        // ★最重要：簡単な問題ばかり解いた場合は、いくら全問正解でも設定した天井スコアを超えないようにする
        if (calculatedScore > maxPossibleCeiling) {
            calculatedScore = maxPossibleCeiling;
        }

        // 全問正解の場合は、出題に高難易度が含まれていれば強制的に495点満点にする
        if (correctCount === totalQuestions && maxPossibleCeiling === 495) {
            calculatedScore = 495;
        }

        // 5点刻みに丸める
        let finalToeicScore = Math.round(calculatedScore / 5) * 5;

        // スコアの最低・最高ガード
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