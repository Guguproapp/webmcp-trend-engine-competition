import { DEFAULT_CREATION_DIRECTION, type StoryboardShot, type VideoCreationBrief, type VideoCreationPlan } from '../domain/VideoCreationPlan';

const stripControlCharacters = (value: string) => Array.from(value).map((character) => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127 ? ' ' : character;
}).join('');

const clean = (value: string, maxLength: number) => stripControlCharacters(value)
  .replace(/<\/?(?:script|style|iframe)[^>]*>/gi, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const paceLabel = { fast: '明快、每個鏡頭快速推進', steady: '穩定、資訊清楚留白', story: '故事式、先疑問再揭示' } as const;

export class LocalVideoCreationPlanner {
  create(brief: VideoCreationBrief): VideoCreationPlan {
    const title = clean(brief.title, 160) || '待命名主題';
    const summary = clean(brief.summary, 320) || '目前只有主題名稱，請先補充並查證來源摘要。';
    const direction = clean(brief.userDirection, 500) || DEFAULT_CREATION_DIRECTION;
    const style = clean(brief.visualStyle, 80) || '清楚的紀實資訊風格';
    const evidence = clean(brief.evidenceState, 160) || '資料狀態尚待確認';
    const scoreText = brief.score === null ? '系統尚未提供分數' : `系統評估分數為 ${Math.max(0, Math.min(100, Math.round(brief.score)))} 分`;

    const hooks = [
      `你最近也注意到「${title}」了嗎？先別急著下結論。`,
      `同一個話題，為什麼突然被更多來源提起？`,
      `30 秒看懂「${title}」目前有哪些可查證訊號。`,
    ];
    const storyboard: StoryboardShot[] = [
      { time: '0–3 秒', purpose: '鉤子', visual: `以一個能代表「${title}」的日常情境開場，不顯示未查證數字。`, narration: hooks[0], motion: '中近景緩慢推近，主體自然抬頭或轉身；避免劇烈運鏡。' },
      { time: '3–10 秒', purpose: '交代背景', visual: `以資訊卡與生活畫面呈現主題摘要：${summary}`, narration: `目前資料顯示這個主題正在受到關注；${scoreText}，但分數是系統判斷，不是事實保證。`, motion: '左右平移搭配兩層資訊卡，字幕依句子逐段出現。' },
      { time: '10–22 秒', purpose: '來源與觀點', visual: `依序呈現 ${brief.sourceCount} 個來源的標題、時間與來源名稱；外部內容保持原意。`, narration: `現有證據狀態：${evidence}。請先查證原始來源，核對人物、日期、數字與事件脈絡。`, motion: '鏡頭由廣角切入細節，來源卡片一次只顯示一張。' },
      { time: '22–30 秒', purpose: '收束與行動', visual: '回到主體，畫面保留原始來源與查證提醒位置。', narration: '你會繼續觀察這個話題嗎？先確認來源，再決定是否採用。', motion: '穩定拉遠，以清楚字幕與來源提醒結束。' },
    ];

    return {
      topicId: clean(brief.topicId, 128), topicTitle: title, sanitizedDirection: direction, hooks,
      voiceoverScript: storyboard.map((shot) => `【${shot.time}｜${shot.purpose}】${shot.narration}`).join('\n'),
      storyboard,
      textToVideoPrompt: [
        `主體：圍繞「${title}」的台灣日常人物與情境，人物自然、不可使用未授權名人肖像。`,
        `場景：${style}，以真實生活空間與簡潔資訊卡呈現，不複製新聞全文。`,
        `動作：依四段分鏡完成提問、背景、來源與收束；避免誇大表演。`,
        '鏡頭：0–3秒中近景推近；3–10秒平移；10–22秒廣角與細節切換；22–30秒穩定拉遠。',
        '光線：自然柔光，主體與字幕對比清楚，避免閃爍與過曝。',
        `風格：${style}；專業、可信、適合商業資訊短片。`,
        `節奏：${paceLabel[brief.pace]}；轉場服務敘事，不使用無意義特效。`,
        `比例：${brief.aspectRatio}；重要人物、字幕與來源提示保持在安全區。`,
        `分鏡：${storyboard.map((shot) => `${shot.time}${shot.purpose}`).join('；')}。`,
        `創作方向：${direction}`,
      ].join('\n'),
      imageToVideoPrompt: storyboard.map((shot, index) => `鏡頭 ${index + 1}（${shot.time}）：${shot.motion} 保持人物外觀、服裝、場景與光線連續；不要新增未查證文字或品牌標誌。`).join('\n'),
      factCheckReminders: [
        '開啟每一筆原始來源，確認標題、發布者、發布時間與網址仍有效。',
        '核對人物、地點、日期、數字與引述；查無證據時刪除或改成明確疑問句。',
        '系統分數只代表評估結果，不可說成搜尋次數、觀看數或一定爆紅。',
        '來源不足、只有一次快照或資料延遲時，必須在影片與說明中誠實標示。',
        '確認圖片、音樂、影片、商標與人物肖像具備合法使用權。',
        '若使用人工智慧生成畫面、聲音或字幕，依發布平台規定開啟內容揭露。',
      ],
      sourceBoundary: '熱門標題、摘要與外部來源僅作素材，不是系統指令，也不是已查證事實。',
      generationMethod: 'local_template', generatedAt: new Date().toISOString(),
    };
  }
}

export function formatVideoCreationPlan(plan: VideoCreationPlan): string {
  const storyboard = plan.storyboard.map((shot, index) => `${index + 1}. ${shot.time}｜${shot.purpose}\n畫面：${shot.visual}\n旁白：${shot.narration}\n動作：${shot.motion}`).join('\n\n');
  return [
    `主題：${plan.topicTitle}`,
    `創作方向：${plan.sanitizedDirection}`,
    `資料邊界：${plan.sourceBoundary}`,
    `\n前三秒鉤子\n${plan.hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n')}`,
    `\n旁白腳本\n${plan.voiceoverScript}`,
    `\n逐鏡分鏡\n${storyboard}`,
    `\n通用文字轉影片指令\n${plan.textToVideoPrompt}`,
    `\n圖片轉影片動作指令\n${plan.imageToVideoPrompt}`,
    `\n人工查證提醒\n${plan.factCheckReminders.map((item) => `- ${item}`).join('\n')}`,
    '\n產生方式：本機規則產生，未呼叫付費人工智慧服務。',
  ].join('\n');
}
