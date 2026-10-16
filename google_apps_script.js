/**
 * POP LOCK / LOCK LOCKER LOCKEST リーダーボード サーバーサイドスクリプト
 * 
 * 4つのモード（通常 / 1分固定 / 1ミス終了 / 5000pt TA）を別々のシート（タブ）に自動仕分けして記録します。
 * - normal: スコア降順（大きい順）
 * - fixed_1min: スコア降順（大きい順）
 * - sudden_death: スコア降順（大きい順）
 * - time_attack_5000: タイム昇順（小さい＝速い順）
 */

const SHEET_NAMES = {
  normal: '通常モード',
  fixed_1min: '1分固定',
  sudden_death: '1ミス終了',
  time_attack_5000: '5000ptTA'
};

function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'get_scores';
  const callback = params.callback;
  const rawMode = params.mode || 'normal';
  const mode = SHEET_NAMES[rawMode] ? rawMode : 'normal';

  let result = {};

  try {
    if (action === 'submit') {
      result = handleSubmit(params, mode);
    } else {
      result = handleGetScores(mode);
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  const jsonString = JSON.stringify(result);

  if (callback) {
    return ContentService.createTextOutput(callback + '(' + jsonString + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e);
}

// モードごとの専用シートを取得（なければ自動作成＆ヘッダー付与）
function getOrCreateSheetForMode(mode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheetName = SHEET_NAMES[mode] || SHEET_NAMES.normal;
  let sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) {
    // 既存の「シート1」等の1枚目をリネームまたは新規作成
    const sheets = ss.getSheets();
    if (mode === 'normal' && sheets.length > 0 && sheets[0].getName().match(/^(シート1|Sheet1)$/)) {
      sheet = sheets[0];
      sheet.setName(targetSheetName);
    } else {
      sheet = ss.insertSheet(targetSheetName);
    }
  }

  // 1行目にヘッダーがない場合はセット
  if (sheet.getLastRow() === 0) {
    const scoreHeader = (mode === 'time_attack_5000') ? 'クリアタイム(ms)' : 'スコア';
    sheet.appendRow(['ID', 'プレイヤー名', scoreHeader, '解錠数', '更新日時']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#dfe4ea');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// スコア・タイムの取得
function handleGetScores(mode) {
  const sheet = getOrCreateSheetForMode(mode);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { status: 'ok', mode: mode, records: [] };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const records = [];

  for (let i = 0; i < data.length; i++) {
    const id = String(data[i][0] || '').trim();
    const name = String(data[i][1] || '').trim();
    const scoreVal = Number(data[i][2]);
    const locks = Number(data[i][3]) || 0;

    if (id && name && !isNaN(scoreVal)) {
      records.push({
        id: id,
        name: name,
        score: scoreVal,
        locks: locks,
        mode: mode
      });
    }
  }

  // ソート: タイムアタックは小さい順（昇順）、それ以外は大きい順（降順）
  if (mode === 'time_attack_5000') {
    records.sort((a, b) => a.score - b.score);
  } else {
    records.sort((a, b) => b.score - a.score);
  }

  return { status: 'ok', mode: mode, records: records.slice(0, 100) };
}

// スコア・タイムの登録または更新
function handleSubmit(params, mode) {
  const id = (params.id || '').trim();
  const name = (params.name || '').trim().substring(0, 10);
  const scoreVal = Number(params.score);
  const locks = Number(params.locks) || 0;

  if (!id || !name || isNaN(scoreVal) || scoreVal <= 0) {
    return { status: 'error', message: 'Invalid parameters' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrCreateSheetForMode(mode);
    const lastRow = sheet.getLastRow();
    const isTimeAttack = (mode === 'time_attack_5000');
    let foundRow = -1;

    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) {
          foundRow = i + 2;
          break;
        }
      }
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    if (foundRow > 0) {
      const existingScore = Number(sheet.getRange(foundRow, 3).getValue());
      // タイムアタックは数値が小さいほうが速い（より良い記録）
      // スコアモードは数値が大きいほうが良い記録
      const isBetter = isTimeAttack 
        ? (scoreVal < existingScore || isNaN(existingScore) || existingScore <= 0)
        : (scoreVal > existingScore || isNaN(existingScore));

      if (isBetter) {
        sheet.getRange(foundRow, 2, 1, 4).setValues([[name, scoreVal, locks, nowStr]]);
      } else {
        // 名前だけ更新
        sheet.getRange(foundRow, 2).setValue(name);
      }
    } else {
      sheet.appendRow([id, name, scoreVal, locks, nowStr]);
    }

    // 更新後にシート全体をソート
    const newLastRow = sheet.getLastRow();
    if (newLastRow > 1) {
      sheet.getRange(2, 1, newLastRow - 1, 5).sort({ column: 3, ascending: isTimeAttack });
    }

    return { status: 'ok', mode: mode, message: 'Saved successfully' };
  } finally {
    lock.releaseLock();
  }
}
