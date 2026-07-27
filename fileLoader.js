// ==========================================
// 【ファイル読み込み・CSVデータ処理：Part5/6両対応版】
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

            // 列名の存在チェックをPart5/Part6共通で通るように柔軟に変更
            const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim().toLowerCase());
            
            // 最低限「part」列だけは必須とする（これで5か6かを判定する）
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
                    let val = columns[index] !== undefined ? columns[index].trim() : "";
                    rowData[header] = val;
                });
                rawQuizData.push(rowData);
            }

            if (rawQuizData.length < 1) {
                alert("CSVファイル内に問題データが見つかりません。問題が入ったファイルを用意してください。");
                return;
            }

            document.getElementById("setup-container").style.display = "none";
            askQuestionCount();
        };
    });
}

// ★CSVパース関数（ロジックはそのまま維持）
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

// ユーザーに問題数（または長文セット数）を尋ねる関数
function askQuestionCount() {
    const maxCount = rawQuizData.length;
    
    // 読み込んだ最初のデータのpartをチェックして案内文字を変える
    const firstItemPart = rawQuizData[0].part;
    const unitText = (firstItemPart === "6") ? "長文セット" : "問";

    let inputCount = prompt(`全 ${maxCount} ${unitText}見つかりました。\n何${unitText}解答しますか？（1 〜 ${maxCount} の数値を半角で入力）`, maxCount);
    
    if (inputCount === null) {
        document.getElementById("setup-container").style.display = "block";
        document.getElementById('file-input').value = "";
        return;
    }

    inputCount = inputCount.trim().replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    const count = parseInt(inputCount, 10);

    if (isNaN(count) || count < 1 || count > maxCount) {
        alert(`無効な数値です。1 から ${maxCount} までの数値を入力してください。`);
        askQuestionCount(); 
        return;
    }

    targetQuestionCount = count;
    startApp(); 
}