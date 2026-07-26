// ==========================================
// 【セキュリティシステム：算術暗号判定】
// ==========================================
window.addEventListener('DOMContentLoaded', function() {
    let inputPass = prompt("パスワードを入力してください：");
    if (!inputPass) {
        denyAccess();
        return;
    }

    inputPass = inputPass.trim().replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    const num = Number(inputPass);
    const cipherCheck = (num * 3 + 124) / 2;

    if (isNaN(num) || cipherCheck !== 9407) {
        denyAccess();
        return; 
    }

    // パスワードOKならファイル選択機能を初期化（fileLoader.jsの関数）
    initFileInput();
});

function denyAccess() {
    alert("パスワードが違います。アクセス権がありません。");
    document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px; color:#dc3545;'>Access Denied</h1>";
}