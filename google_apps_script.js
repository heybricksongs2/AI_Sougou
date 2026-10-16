/**
 * POP LOCK / LOCK LOCKER LOCKEST リーダーボード サーバーサイドスクリプト
 * 
 * 4つのモード（通常 / 1分固定 / 1ミス終了 / 5000pt TA）を別々のシート（タブ）に自動仕分けして記録します。
 * 初回実行時に、既存の元シートから各モードのシートへ全過去データを安全に自動移行します。
 */

const SHEET_NAMES = {
  normal: '通常モード',
  fixed_1min: '1分固定',
  sudden_death: '1ミス終了',
  time_attack_5000: '5000ptTA'
};

const SPREADSHEET_ID = '1Omu3KOKGxkeTqJ2cbCS2C4ponLp0Fy72ctzzqANfyvY';

function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'get_scores';
  const callback = params.callback;
  const rawMode = params.mode || 'normal';
  const mode = SHEET_NAMES[rawMode] ? rawMode : 'normal';

  // 初回アクセス時に既存データを安全に自動移行
  try {
    ensureMigrationFromLegacySheet();
  } catch (migErr) {
    console.error('Migration error in doGet:', migErr);
  }

  let result = {};

  try {
    if (action === 'migrate') {
      ensureMigrationFromLegacySheet();
      result = { status: 'ok', message: 'Migration completed successfully' };
    } else if (action === 'submit') {
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

// 安全な日付文字列化（例外を絶対に投げない）
function formatSafeDate(raw) {
  if (!raw) {
    return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  }
  if (raw instanceof Date) {
    try {
      return Utilities.formatDate(raw, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    } catch (e) {}
  }
  const str = String(raw).trim();
  if (str.length >= 8) return str;
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
}

// 既存の「Leaderboard」または「シート1」から4つのモード別シートへ過去データを安全にマージ
function ensureMigrationFromLegacySheet() {
  const ss = getSpreadsheet();
  const legacySheet = ss.getSheetByName('Leaderboard') || ss.getSheetByName('シート1');
  if (!legacySheet) return;

  const legacyLastRow = legacySheet.getLastRow();
  if (legacyLastRow <= 1) return;

  const legacyData = legacySheet.getRange(2, 1, legacyLastRow - 1, Math.min(5, legacySheet.getLastColumn())).getValues();

  for (const m in SHEET_NAMES) {
    const sheet = getOrCreateSheetForMode(m);
    const lastRow = sheet.getLastRow();
    const existingMap = new Map();

    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, Math.min(5, sheet.getLastColumn())).getValues();
      for (let i = 0; i < data.length; i++) {
        const id = String(data[i][0] || '').trim();
        if (id) existingMap.set(id, { row: i + 2, score: Number(data[i][2]) });
      }
    }

    const isTA = (m === 'time_attack_5000');
    const newRows = [];

    for (let i = 0; i < legacyData.length; i++) {
      const id = String(legacyData[i][0] || '').trim();
      const name = String(legacyData[i][1] || '').trim();
      const scoreVal = Number(legacyData[i][2]);
      const locks = Number(legacyData[i][3]) || 0;
      const dateStr = formatSafeDate(legacyData[i][4]);

      if (!id || !name || isNaN(scoreVal)) continue;

      let targetMode = 'normal';
      if (id.endsWith('__time_attack_5000')) targetMode = 'time_attack_5000';
      else if (id.endsWith('__fixed_1min')) targetMode = 'fixed_1min';
      else if (id.endsWith('__sudden_death')) targetMode = 'sudden_death';

      if (targetMode !== m) continue;

      if (existingMap.has(id)) {
        const exist = existingMap.get(id);
        const isBetter = isTA ? (scoreVal < exist.score) : (scoreVal > exist.score);
        if (isBetter) {
          sheet.getRange(exist.row, 2, 1, 4).setValues([[name, scoreVal, locks, dateStr]]);
        }
      } else {
        newRows.push([id, name, scoreVal, locks, dateStr]);
        existingMap.set(id, { row: -1, score: scoreVal });
      }
    }

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 5).setValues(newRows);
    }

    const updatedLastRow = sheet.getLastRow();
    if (updatedLastRow > 1) {
      sheet.getRange(2, 1, updatedLastRow - 1, 5).sort({ column: 3, ascending: isTA });
    }
  }
}

// モードごとの専用シートを取得（なければ自動作成＆ヘッダー付与）
function getOrCreateSheetForMode(mode) {
  const ss = getSpreadsheet();
  const targetSheetName = SHEET_NAMES[mode] || SHEET_NAMES.normal;
  let sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
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
  let sheet = getOrCreateSheetForMode(mode);
  let lastRow = sheet.getLastRow();

  // 通常モードで専用シートがまだ空の場合、旧シート（Leaderboard/シート1）から自動復旧・取得
  if (mode === 'normal' && lastRow <= 1) {
    const ss = getSpreadsheet();
    const fallbackSheet = ss.getSheetByName('Leaderboard') || ss.getSheetByName('シート1');
    if (fallbackSheet && fallbackSheet.getLastRow() > 1) {
      // 一度移行を試みる
      try {
        ensureMigrationFromLegacySheet();
        sheet = getOrCreateSheetForMode(mode);
        lastRow = sheet.getLastRow();
      } catch (e) {}

      // それでも空ならフォールバックシートから直接読む
      if (lastRow <= 1) {
        sheet = fallbackSheet;
        lastRow = sheet.getLastRow();
      }
    }
  }

  if (lastRow <= 1) {
    return { status: 'ok', mode: mode, records: [] };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, Math.min(5, sheet.getLastColumn())).getValues();
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
    records.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.locks - a.locks;
    });
  }

  return { status: 'ok', mode: mode, records: records.slice(0, 100) };
}

// スコア・タイムの登録または更新
function handleSubmit(params, mode) {
  const id = (params.id || '').trim();
  const name = (params.name || '').trim().substring(0, 10);
  const scoreVal = Number(params.score);
  const locks = Number(params.locks) || 0;

  if (!id || !name || isNaN(scoreVal)) {
    return { status: 'error', message: 'Missing parameters (id, name, score required)' };
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

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

    const nowStr = formatSafeDate(new Date());

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
