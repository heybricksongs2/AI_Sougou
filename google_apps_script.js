/**
 * =========================================================================
 * LOCK LOCKER LOCKEST - オンラインリーダーボード バックエンド (Google Apps Script)
 * =========================================================================
 * 
 * 【設定手順】
 * 1. Google スプレッドシートを新規作成します（シート名は任意）。
 * 2. メニューの「拡張機能」>「Apps Script」を開きます。
 * 3. 既存のコード（myFunctionなど）を全て消去し、このスクリプトを貼り付けて保存します。
 * 4. 画面右上の「デプロイ」>「新しいデプロイ」をクリックします。
 * 5. 歯車アイコンをクリックし「ウェブアプリ」を選択します。
 *    - 次のユーザーとして実行: 「自分」
 *    - アクセスできるユーザー: 「全員」（Anyone）※必ず「全員」を選択してください
 * 6. 「デプロイ」ボタンを押し、承認を完了すると「ウェブアプリの URL」が発行されます。
 * 7. 発行された URL を main.js の LEADERBOARD_API_URL に貼り付ければ完了です！
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // 同時アクセス時の競合を防ぐためロック（最大10秒待機）
  lock.tryLock(10000);

  try {
    var params = (e && e.parameter) ? e.parameter : {};
    
    // POSTでJSON本文が送られた場合のパース
    if (e && e.postData && e.postData.contents) {
      try {
        var postJson = JSON.parse(e.postData.contents);
        for (var key in postJson) {
          if (!params[key]) params[key] = postJson[key];
        }
      } catch (err) {}
    }

    var action = params.action || 'get_scores';
    var sheet = getOrCreateSheet();

    if (action === 'submit') {
      var playerId = String(params.id || '').trim();
      var playerName = String(params.name || 'Anonymous').trim().substring(0, 10);
      var score = parseInt(params.score || '0', 10);
      var locks = parseInt(params.locks || '0', 10);

      if (playerId && playerName) {
        saveOrUpdateRecord(sheet, playerId, playerName, score, locks);
      }
    }

    // 最新ランキング（上位100件）を取得して返却
    var records = getLeaderboardRecords(sheet, 100);
    var callback = params.callback || '';
    return createJsonResponse({ status: 'ok', records: records }, callback);

  } catch (err) {
    var callback = (e && e.parameter && e.parameter.callback) || '';
    return createJsonResponse({ status: 'error', message: err.toString() }, callback);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leaderboard');
  if (!sheet) {
    sheet = ss.getActiveSheet();
    sheet.setName('Leaderboard');
  }

  // 1行目が未設定の場合はヘッダーを作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['PlayerID', 'Name', 'Score', 'Unlocked', 'Updated_At']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveOrUpdateRecord(sheet, playerId, playerName, score, locks) {
  var lastRow = sheet.getLastRow();
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  if (lastRow <= 1) {
    sheet.appendRow([playerId, playerName, score, locks, nowStr]);
    return;
  }

  var range = sheet.getRange(2, 1, lastRow - 1, 5);
  var values = range.getValues();
  var foundIndex = -1;

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === playerId) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex >= 0) {
    var rowNumber = foundIndex + 2;
    // 送信された最新のスコア・解錠数・名前で確実に更新
    sheet.getRange(rowNumber, 2).setValue(playerName);
    sheet.getRange(rowNumber, 3).setValue(score);
    sheet.getRange(rowNumber, 4).setValue(locks);
    sheet.getRange(rowNumber, 5).setValue(nowStr);
  } else {
    sheet.appendRow([playerId, playerName, score, locks, nowStr]);
  }
}

function getLeaderboardRecords(sheet, limit) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var records = [];

  for (var i = 0; i < data.length; i++) {
    var id = String(data[i][0]);
    var name = String(data[i][1]);
    var score = parseInt(data[i][2] || '0', 10);
    var locks = parseInt(data[i][3] || '0', 10);
    if (id && name) {
      records.push({ id: id, name: name, score: score, locks: locks });
    }
  }

  // スコア降順（同スコア時は解錠数降順）
  records.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return b.locks - a.locks;
  });

  return records.slice(0, limit || 100);
}

function createJsonResponse(data, callback) {
  var jsonStr = JSON.stringify(data);
  if (callback) {
    var output = ContentService.createTextOutput(callback + '(' + jsonStr + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  }
  var output = ContentService.createTextOutput(jsonStr);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
