// ==========================================
// 【確定版：scoreCalculator.js】
// ==========================================

window.nextQuestion = function() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        showQuestion(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        clearInterval(quizTimerInterval); 
        document.getElementById("quiz-container").style.display = "none";
        const scoreBoard = document.getElementById("score-container");
        scoreBoard.style.display = "block";

        let totalQuestionsCount = 0; 
        let maxPossibleCeiling = 250; 
        let totalWeight = 0;         
        let correctWeightSum = 0;

        let reviewListHtml = `<div style="text-align:left; margin-top:30px; border-top:2px solid #dee2e6; padding-top:20px;"><h3>📝 模試の解答一覧と復習解説</h3>`;

        shuffledQuestions.forEach((q, index) => {
            const qPart = String(q.part || "5").trim();
            const levelStr = q.level ? String(q.level) : "";
            const parts = levelStr.split(/[〜-]/);
            const maxStr = parts.concat().pop();
            const maxScore = parseInt(maxStr, 10) || 600;

            if (maxScore >= 800) {
                if (maxPossibleCeiling < 495) maxPossibleCeiling = 495;
            } else if (maxScore >= 700) {
                if (maxPossibleCeiling < 380) maxPossibleCeiling = 380;
            }

            let weight = 1.0;
            if (maxScore >= 800) weight = 2.5;
            else if (maxScore >= 700) weight = 1.6;

            const uniqueId = `review-item-${index}`;

            if (qPart === "5") {
                totalQuestionsCount += 1;
                totalWeight += weight;
                
                const userAns = q.selectedAnswer || "未選択";
                const correctAns = String(q.answer).trim();
                const isCorrect = userAns.replace(/[\s\u3000]/g, "").toLowerCase() === correctAns.replace(/[\s\u3000]/g, "").toLowerCase();

                if (isCorrect) {
                    correctWeightSum += weight;
                }

                reviewListHtml += `
                    <div style="background:#fff; border:1px solid #dee2e6; border-radius:6px; padding:12px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span><b>大問 ${index + 1}</b> (Part 5) - あなたの答: <span style="color:${isCorrect?'green':'red'}; font-weight:bold;">${userAns}</span> / 正解: <span style="color:green; font-weight:bold;">${correctAns}</span></span>
                            <button onclick="document.getElementById('${uniqueId}').style.display = document.getElementById('${uniqueId}').style.display==='none'?'block':'none'" style="padding:4px 8px; font-size:0.85rem; cursor:pointer; background:#6c757d; color:white; border:none; border-radius:4px;">🔍 解説を見る</button>
                        </div>
                        <div id="${uniqueId}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #ccc; font-size:0.95rem;">
                            <p><b>【問題文】</b><br>${q.question ? q.question.replace(/\|/g, '<br>') : ""}</p>
                            <p><b>【選択肢】</b><br>(A) ${q.choice1} / (B) ${q.choice2} / (C) ${q.choice3} / (D) ${q.choice4}</p>
                            <p style="color:green; font-weight:bold;"><b>【正解の解説】</b><br>${q.exp_correct || "正解の選択肢です。"}</p>
                            ${q.translation ? `<p style="background:#e8f4fd; padding:8px; border-radius:4px;"><b>【和訳】</b><br>${q.translation.replace(/\|/g, '<br>')}</p>` : ""}
                        </div>
                    </div>`;

            } else if (qPart === "6" || qPart === "7") {
                let subQuestionsHtml = "";
                let hasAnyQuestion = false;

                if (!q.userAnswers) q.userAnswers = {};

                for (let i = 1; i <= 5; i++) {
                    if (q[`q${i}_choice1`]) {
                        hasAnyQuestion = true;
                        totalQuestionsCount += 1;
                        totalWeight += weight;

                        const userAns = q.userAnswers[i] || "未選択";
                        const correctAns = String(q[`q${i}_answer`]).trim();
                        const isCorrect = userAns === correctAns;

                        if (isCorrect) {
                            correctWeightSum += weight;
                        }

                        subQuestionsHtml += `
                            <div style="margin-bottom:10px; border-bottom:1px dashed #eee; padding-bottom:5px;">
                                <div><b>問 ${i}</b> - あなたの答: <span style="color:${isCorrect?'green':'red'}; font-weight:bold;">${userAns}</span> / 正解: <span style="color:green; font-weight:bold;">${correctAns}</span></div>
                                <p style="color:green; font-size:0.9rem; margin:3px 0;"><b>解説:</b> ${q[`q${i}_exp_correct`] || "正解の選択肢です。"}</p>
                            </div>`;
                    }
                }

                if (hasAnyQuestion) {
                    reviewListHtml += `
                        <div style="background:#fff; border:1px solid #dee2e6; border-radius:6px; padding:12px; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span><b>大問 ${index + 1}</b> (Part ${qPart} 長文)</span>
                                <button onclick="document.getElementById('${uniqueId}').style.display = document.getElementById('${uniqueId}').style.display==='none'?'block':'none'" style="padding:4px 8px; font-size:0.85rem; cursor:pointer; background:#17a2b8; color:white; border:none; border-radius:4px;">📖 解説を開く</button>
                            </div>
                            <div id="${uniqueId}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #ccc; font-size:0.95rem;">
                                <p style="background:#f8f9fa; padding:10px; border-radius:6px; max-height:180px; overflow-y:auto; line-height:1.5;"><b>【長文本文】</b><br>${(q.passage || q.question || "").replace(/\|/g, '<br>')}</p>
                                ${q.translation ? `<p style="background:#e8f4fd; padding:10px; border-radius:6px;"><b>【長文和訳】</b><br>${q.translation.replace(/\|/g, '<br>')}</p>` : ""}
                                <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                                    ${subQuestionsHtml}
                                </div>
                            </div>
                        </div>`;
                }
            }
        });

        reviewListHtml += `</div>`;

        let calculatedScore = 0;
        if (totalWeight > 0) {
            calculatedScore = (correctWeightSum / totalWeight) * 495;
        }
        if (calculatedScore > maxPossibleCeiling) {
            calculatedScore = maxPossibleCeiling;
        }
        if (correctCount === totalQuestionsCount && maxPossibleCeiling === 495) {
            calculatedScore = 495;
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
        if (totalQuestionsCount >= 6) {
            scoreHtmlArea = `
                <p>あなたの想定リーディング換算スコアは...</p>
                <div class="toeic-score">${finalToeicScore} 点 / 495点</div>
                <p style="font-weight:bold; color:#495057;">${evaluation}</p>
            `;
        } else {
            scoreHtmlArea = `
                <p style="color:#6c757d; padding:15px; background:#f1f3f5; border-radius:6px;">
                    ※小問数が少ないため、TOEIC換算スコアの算出はスキップされました。
                </p>
            `;
        }

        scoreBoard.innerHTML = `
            <h2>結果発表</h2>
            <p>計 ${totalQuestionsCount} 問中、${correctCount} 問正解</p>
            ${scoreHtmlArea}
            <button class="next-btn" onclick="location.reload()">別のファイルを読み込む</button>
            <button class="next-btn" style="background:#28a745;" onclick="startApp()">同じ問題に再挑戦</button>
            ${reviewListHtml} 
        `;
    }
}