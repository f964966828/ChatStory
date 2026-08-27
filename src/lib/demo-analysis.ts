import type { ChatAnalysis } from "@/lib/analyze";

function pad(value: number) {
  return `${value}`.padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${pad(month)}`;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function demoDayCount(year: number, month: number, day: number) {
  const weekday = new Date(year, month - 1, day).getDay();
  if (month === 6 && day === 15) return randInt(220, 320);
  if (Math.random() < 0.05) return 0;

  let count = randInt(1, 28);
  if (Math.random() < 0.1) count = randInt(36, 88);
  if (weekday === 0) count = Math.round(count * 0.4);
  else if (weekday === 6) count = Math.round(count * 0.55);
  else if (weekday === 5) count = Math.round(count * 1.2);

  return Math.max(1, count);
}

export function buildDemoAnalysis(now = new Date()): ChatAnalysis {
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 2);
  startDate.setMonth(startDate.getMonth() - 5);

  const start = {
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1,
    day: startDate.getDate(),
  };
  const end = {
    year: endDate.getFullYear(),
    month: endDate.getMonth() + 1,
    day: endDate.getDate(),
  };
  const daily: ChatAnalysis["daily"] = [];
  const monthlyMap = new Map<string, number>();
  const weekday = Array.from({ length: 7 }, () => 0);
  let totalMessages = 0;
  let totalCharacters = 0;

  for (let year = start.year; year <= end.year; year += 1) {
    const monthFrom = year === start.year ? start.month : 1;
    const monthTo = year === end.year ? end.month : 12;
    for (let month = monthFrom; month <= monthTo; month += 1) {
      const lastDay = new Date(year, month, 0).getDate();
      const dayFrom = year === start.year && month === start.month ? start.day : 1;
      const dayTo = year === end.year && month === end.month ? end.day : lastDay;
      let monthCount = 0;
      for (let day = dayFrom; day <= dayTo; day += 1) {
        const count = demoDayCount(year, month, day);
        if (!count) continue;
        daily.push({
          date: dateKey(year, month, day),
          count,
          a: 0,
          b: 0,
        });
        monthCount += count;
        totalMessages += count;
        totalCharacters += Math.round(count * rand(8, 22));
        weekday[(new Date(year, month - 1, day).getDay() + 6) % 7] += count;
      }
      monthlyMap.set(monthKey(year, month), monthCount);
    }
  }

  const aRatio = rand(0.46, 0.62);
  for (const day of daily) {
    const share = Math.min(
      day.count,
      Math.max(0, Math.round(day.count * aRatio * rand(0.75, 1.25))),
    );
    day.a = share;
    day.b = day.count - share;
  }
  const monthly = [...monthlyMap.entries()].map(([key, count]) => {
    const share = Math.min(
      count,
      Math.max(0, Math.round(count * aRatio * rand(0.82, 1.18))),
    );
    return { key, a: share, b: count - share };
  });
  const hourWeights = [
    8, 4, 2, 2, 2, 3, 8, 22, 36, 30, 26, 32,
    38, 34, 30, 28, 32, 48, 70, 86, 78, 52, 28, 14,
  ];
  const weightSum = hourWeights.reduce((sum, weight) => sum + weight, 0);
  const hourly = hourWeights.map((weight) =>
    Math.max(
      0,
      Math.round((totalMessages * weight * rand(0.88, 1.12)) / weightSum),
    ),
  );
  const activeDays = daily.length;
  const startMs = new Date(start.year, start.month - 1, start.day).getTime();
  const endMs = new Date(end.year, end.month - 1, end.day).getTime();
  const aMessages = Math.round(totalMessages * aRatio);
  const bMessages = totalMessages - aMessages;
  const aStickers = Math.min(aMessages, randInt(80, 520));
  const aPhotos = Math.min(Math.max(0, aMessages - aStickers), randInt(20, 140));
  const aVideos = Math.min(
    Math.max(0, aMessages - aStickers - aPhotos),
    randInt(8, 70),
  );
  const bStickers = Math.min(bMessages, randInt(60, 380));
  const bPhotos = Math.min(Math.max(0, bMessages - bStickers), randInt(12, 110));
  const bVideos = Math.min(
    Math.max(0, bMessages - bStickers - bPhotos),
    randInt(5, 55),
  );
  const peakMessageDay = daily.reduce<{ date: string; count: number } | null>(
    (best, item) =>
      !best || item.count > best.count
        ? { date: item.date, count: item.count }
        : best,
    null,
  );
  const peakCallDay = daily.length
    ? {
        date: daily[randInt(0, daily.length - 1)].date,
        durationMs: randInt(25, 160) * 60 * 1000,
      }
    : null;

  return {
    totalMessages,
    totalCharacters,
    activeDays,
    durationMs: Math.max(0, endMs - startMs),
    callDurationMs: randInt(40, 280) * 60 * 1000,
    callCount: randInt(12, 96),
    avgPerDay: activeDays ? totalMessages / activeDays : 0,
    hourly,
    weekday,
    daily,
    monthly,
    senders: [
      {
        name: "A",
        messages: aMessages,
        texts: Math.max(0, aMessages - aStickers - aPhotos - aVideos),
        stickers: aStickers,
        photos: aPhotos,
        videos: aVideos,
        ratio: totalMessages ? aMessages / totalMessages : 0,
        initiated: Math.max(40, Math.round(activeDays * 0.62)),
        avgChars: rand(12, 22),
        avgReplyMs: randInt(8, 28) * 60 * 1000,
        words: [
          { word: "哈哈", count: randInt(180, 360) },
          { word: "好啊", count: randInt(90, 170) },
          { word: "要不要", count: randInt(70, 130) },
          { word: "在嗎", count: randInt(50, 100) },
          { word: "吃飯", count: randInt(40, 90) },
          { word: "今天", count: randInt(35, 80) },
          { word: "出門", count: randInt(28, 60) },
          { word: "ok", count: randInt(22, 48) },
          { word: "等等", count: randInt(18, 40) },
          { word: "到了", count: randInt(16, 36) },
          { word: "先這樣", count: randInt(12, 28) },
          { word: "haha", count: randInt(10, 24) },
          { word: "可以", count: randInt(9, 20) },
          { word: "好喔", count: randInt(8, 18) },
          { word: "明天", count: randInt(8, 16) },
          { word: "晚點", count: randInt(7, 15) },
          { word: "到家", count: randInt(7, 14) },
          { word: "沒問題", count: randInt(6, 13) },
          { word: "等我", count: randInt(6, 12) },
          { word: "週末", count: randInt(5, 11) },
          { word: "電影", count: randInt(5, 10) },
          { word: "咖啡", count: randInt(5, 10) },
          { word: "加班", count: randInt(4, 9) },
          { word: "捷運", count: randInt(4, 9) },
          { word: "下雨", count: randInt(4, 8) },
          { word: "早安", count: randInt(4, 8) },
          { word: "睡了", count: randInt(3, 7) },
          { word: "記得", count: randInt(3, 7) },
          { word: "對啊", count: randInt(3, 6) },
          { word: "還好", count: randInt(3, 6) },
          { word: "不然", count: randInt(2, 5) },
          { word: "超扯", count: randInt(2, 5) },
          { word: "算了", count: randInt(2, 4) },
          { word: "先走", count: randInt(2, 4) },
          { word: "好的", count: randInt(2, 4) },
          { word: "謝謝", count: randInt(2, 4) },
          { word: "晚安", count: randInt(2, 3) },
          { word: "幾點", count: randInt(2, 3) },
          { word: "在家", count: randInt(2, 3) },
          { word: "笑死", count: randInt(2, 3) },
          { word: "好啦", count: randInt(2, 3) },
          { word: "沒啊", count: randInt(1, 3) },
          { word: "有喔", count: randInt(1, 3) },
          { word: "超累", count: randInt(1, 3) },
          { word: "等一下", count: randInt(1, 3) },
          { word: "要吃", count: randInt(1, 2) },
          { word: "靠北", count: randInt(1, 2) },
          { word: "真的", count: randInt(1, 2) },
          { word: "收到", count: randInt(1, 2) },
          { word: "可以啊", count: randInt(1, 2) },
        ].sort((a, b) => b.count - a.count),
      },
      {
        name: "B",
        messages: bMessages,
        texts: Math.max(0, bMessages - bStickers - bPhotos - bVideos),
        stickers: bStickers,
        photos: bPhotos,
        videos: bVideos,
        ratio: totalMessages ? bMessages / totalMessages : 0,
        initiated: Math.max(28, Math.round(activeDays * 0.38)),
        avgChars: rand(24, 42),
        avgReplyMs: randInt(18, 55) * 60 * 1000,
        words: [
          { word: "真的", count: randInt(160, 320) },
          { word: "謝謝", count: randInt(80, 160) },
          { word: "晚安", count: randInt(70, 140) },
          { word: "明天", count: randInt(45, 90) },
          { word: "收到", count: randInt(36, 72) },
          { word: "怎麼了", count: randInt(28, 58) },
          { word: "想你", count: randInt(22, 48) },
          { word: "wait", count: randInt(16, 36) },
          { word: "好啊", count: randInt(14, 32) },
          { word: "哈哈", count: randInt(12, 28) },
          { word: "先這樣", count: randInt(10, 22) },
          { word: "吃飯", count: randInt(8, 18) },
          { word: "今天", count: randInt(8, 16) },
          { word: "可以", count: randInt(7, 15) },
          { word: "好喔", count: randInt(7, 14) },
          { word: "晚點", count: randInt(6, 13) },
          { word: "到了", count: randInt(6, 12) },
          { word: "沒關係", count: randInt(5, 11) },
          { word: "在忙", count: randInt(5, 10) },
          { word: "週末", count: randInt(5, 10) },
          { word: "電影", count: randInt(4, 9) },
          { word: "咖啡", count: randInt(4, 9) },
          { word: "下雨", count: randInt(4, 8) },
          { word: "早安", count: randInt(4, 8) },
          { word: "小心", count: randInt(3, 7) },
          { word: "記得", count: randInt(3, 7) },
          { word: "對啊", count: randInt(3, 6) },
          { word: "還好", count: randInt(3, 6) },
          { word: "不然", count: randInt(2, 5) },
          { word: "超好", count: randInt(2, 5) },
          { word: "先走", count: randInt(2, 4) },
          { word: "到家", count: randInt(2, 4) },
          { word: "好的", count: randInt(2, 4) },
          { word: "幾點", count: randInt(2, 3) },
          { word: "在家", count: randInt(2, 3) },
          { word: "笑死", count: randInt(2, 3) },
          { word: "好啦", count: randInt(2, 3) },
          { word: "沒啊", count: randInt(1, 3) },
          { word: "有喔", count: randInt(1, 3) },
          { word: "超累", count: randInt(1, 3) },
          { word: "等一下", count: randInt(1, 3) },
          { word: "加班", count: randInt(1, 2) },
          { word: "捷運", count: randInt(1, 2) },
          { word: "睡了", count: randInt(1, 2) },
          { word: "出門", count: randInt(1, 2) },
          { word: "ok", count: randInt(1, 2) },
          { word: "沒問題", count: randInt(1, 2) },
          { word: "等等", count: randInt(1, 2) },
        ].sort((a, b) => b.count - a.count),
      },
    ],
    emojis: [
      { emoji: "😂", count: randInt(180, 420) },
      { emoji: "🤣", count: randInt(90, 240) },
      { emoji: "❤️", count: randInt(60, 180) },
      { emoji: "😭", count: randInt(40, 130) },
      { emoji: "👍", count: randInt(20, 90) },
    ].sort((a, b) => b.count - a.count),
    peakMessageDay,
    peakCallDay,
  };
}
