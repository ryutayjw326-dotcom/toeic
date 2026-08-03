// ==========================================
// 【新・画面一体型設定システム（fileLoader.js）】
// ==========================================

function initFileInput() {
    document.getElementById('file-input').addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files.item(0);

        const reader = new FileReader();
        reader.readAsText(file, "UTF-8"); 
        
        reader.onload = function(e) {
            const text = e.target.result.trim();
            if (!text) {
                alert("ファイルが空です。");
                return;
            }

            const lines = text.split(/\r?\n/);
            const firstLine = lines.concat().shift() || "";
            
            let delimiter = "\t"; 
            if (firstLine.includes(",") && !firstLine.includes("\t")) {
                delimiter = ","; 
            }

            const headers = parseCSVLine(firstLine, delimiter).map(h => {
                return h.replace(/^"|"$/g, '').trim().toLowerCase();
            });
            
            if (!headers.includes("part")) {
                alert("エラー: 1行目に 'part' の列名が見つかりません。");
                return;
            }

            rawQuizData = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const columns = parseCSVLine(lines[i], delimiter);
                const rowData = {};
                
                headers.forEach((header, index) => {
                    let val = columns[index] !== undefined ? columns[index] : "";
                    val = val.replace(/\r/g, ""); 
                    val = val.replace(/^"|"$/g, ""); 
                    val = val.trim(); 
                    rowData[header] = val;
                });
                rawQuizData.push(rowData);
            }

            if (rawQuizData.length < 1) {
                alert("CSVファイル内に問題データが見つかりません。問題が入ったファイルを用意してください。");
                return;
            }

            // ファイル読み込み成功後、設定画面エリアをパッと表示
            document.getElementById("config-area").style.display = "block";
            // 最大出題数のヒントテキストと初期入力値を自動セット
            updateMaxCountHint();
        };
    });
}

// CSVパース関数（ロジック維持）
function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ✨【新設】選択されたモードに応じて「最大何問（何セット）解けるか」を計算して画面に表示する関数
function updateMaxCountHint() {
    const selectedMode = document.querySelector('input[name="play-mode"]:checked').value;
    let filtered = [];

    if (selectedMode === 'all') {
        filtered = [...rawQuizData];
    } else {
        const partNum = selectedMode.replace('part', '');
        filtered = rawQuizData.filter(q => String(q.part).trim() === partNum);
    }

    const countInput = document.getElementById("quiz-count-input");
    const hintSpan = document.getElementById("max-count-hint");

    if (filtered.length === 0) {
        hintSpan.innerText = `（該当する問題がありません）`;
        hintSpan.style.color = "#dc3545";
        countInput.value = 0;
        countInput.max = 0;
        return;
    }

    hintSpan.style.color = "#6c757d";
    // 最初の問題のPartを見て「問」か「長文セット」かを賢く切り替える
    const unitText = (String(filtered[0].part).trim() === "6" || String(filtered[0].part).trim() === "7") ? "長文セット" : "問";
    
    hintSpan.innerText = ` / 最大 ${filtered.length} ${unitText} 出題可能`;
    countInput.max = filtered.length;
    countInput.value = filtered.length; // デフォルトで最大数を自動入力
}

// ✨【新設】スタートボタンが押されたときに数値をチェックしてクイズを開始する関数
function validateAndStartQuiz() {
    const selectedMode = document.querySelector('input[name="play-mode"]:checked').value;
    let filtered = [];

    // モードに基づいてデータをフィルタリング
    if (selectedMode === 'all') {
        filtered = [...rawQuizData];
    } else {
        const partNum = selectedMode.replace('part', '');
        filtered = rawQuizData.filter(q => String(q.part).trim() === partNum);
    }

    if (filtered.length === 0) {
        alert("選択されたモードに対応する問題データがありません。別のモードを選んでください。");
        return;
    }

    // 入力された問題数を取得
    const countInput = document.getElementById("quiz-count-input");
    const count = parseInt(countInput.value, 10);

    if (isNaN(count) || count < 1 || count > filtered.length) {
        alert(`出題数は 1 から ${filtered.length} までの数値を入力してください。`);
        return;
    }

    // 確定した設定をグローバル変数に代入
    targetQuestionCount = count;
    rawQuizData = filtered; // クイズエンジンに渡すデータを差し替え

    // 設定ボックス全体を非表示にしてゲームスタート！
    document.getElementById("setup-container").style.display = "none";
    startApp();
}

// ==========================================
// 🏆 【新設】TOEIC本番サンプリングモード制御ロジック
// ==========================================

function startMockExamMode() {
    // 本番モードの規定値（Part 5: 30問, Part 6: 4セット, Part 7: 15セット）
    const targetConfig = [
        { part: "5", required: 30, type: "問" },
        { part: "6", required: 4,  type: "セット" },
        { part: "7", required: 15, type: "セット" }
    ];

    let finalMockSelectedQuestions = [];
    let alertMessages = [];

    // 各パートごとに「レベルをまんべんなく」抽出するループ処理
    targetConfig.forEach(config => {
        // 1. そのPartのデータをすべて集める
        const partPool = rawQuizData.filter(q => String(q.part).trim() === config.part);
        
        if (partPool.length < config.required) {
            alertMessages.push(`【警告】Part ${config.part} のデータが足りません（必要: ${config.required}${config.type} / 実際のCSV内: ${partPool.length}${config.type}）`);
            // データが足りない場合はある分だけすべて入れる
            finalMockSelectedQuestions = finalMockSelectedQuestions.concat(partPool);
            return;
        }

        // 2. レベル（難易度）ごとにグループ分けする
        const levelGroups = {};
        partPool.forEach(q => {
            const lv = q.level ? String(q.level).trim() : "未設定";
            if (!levelGroups[lv]) levelGroups[lv] = [];
            levelGroups[lv].push(q);
        });

        // 3. 各レベルのグループ内をあらかじめランダムシャッフルしておく
        const levels = Object.keys(levelGroups);
        levels.forEach(lv => {
            levelGroups[lv].sort(() => Math.random() - 0.5);
        });

        // 4. 各レベルから1問ずつ順番に、規定数に達するまで「まんべんなく」引っこ抜いていく
        let selectedFromPart = [];
        let levelIndex = 0;
        
        while (selectedFromPart.length < config.required && levels.length > 0) {
            const currentLevel = levels[levelIndex % levels.length];
            const currentGroup = levelGroups[currentLevel];

            if (currentGroup.length > 0) {
                // シャッフル済みの先頭から1つ抽出して追加
                selectedFromPart.push(currentGroup.shift());
            } else {
                // このレベルのデータが尽きたら選択肢から除外
                levels.splice(levelIndex % levels.length, 1);
                if (levels.length === 0) break;
                // インデックスのズレを調整
                levelIndex--;
            }
            levelIndex++;
        }

        // 抽出したデータを合体
        finalMockSelectedQuestions = finalMockSelectedQuestions.concat(selectedFromPart);
    });

    // CSV内の問題数が足りなくて100問（49レコード）未満になってしまう場合の親切な警告
    if (alertMessages.length > 0) {
        alert("一部のデータが不足しているため、あるだけの問題数で模試を生成します：\n\n" + alertMessages.join("\n"));
    }

    // 5. 最終的にできあがった本番セット（全49レコード）を、実際のテスト順（Part5 -> Part6 -> Part7）に綺麗に並び替える
    // ※これをしないとパートがバラバラに出題されてしまうため、本番同様の順序にソートします
    finalMockSelectedQuestions.sort((a, b) => {
        return parseInt(a.part, 10) - parseInt(b.part, 10);
    });

    // クイズエンジンへデータを引き渡す
    targetQuestionCount = finalMockSelectedQuestions.length;
    rawQuizData = finalMockSelectedQuestions;

    // 設定画面を閉じて、本番モードでアプリを起動！
    document.getElementById("setup-container").style.display = "none";
    startApp();
}