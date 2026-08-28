import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../../app/App';
import { reviewResetService, trendDiscoveryService } from '../../../app/services';
import styles from '../../../styles.css?raw';

async function resetReviewData() {
  await reviewResetService.reset();
}

function renderRoute(path:string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

describe('RC2熱門精選使用性', () => {
  beforeEach(async () => { await resetReviewData(); });

  it('預設顯示綜合分數最高的5個高潛力主題', async () => {
    const { container } = renderRoute('/trends');
    await screen.findByRole('heading', { name: '爆紅熱門精選' });
    await waitFor(()=>expect(container.querySelectorAll('.trend-topic-card')).toHaveLength(5));
    const expected = trendDiscoveryService.listAll().filter((topic)=>topic.status==='high_potential').sort((a,b)=>b.totalScore-a.totalScore).slice(0,5).map((topic)=>topic.title);
    const actual = [...container.querySelectorAll('.trend-topic-card h2')].map((heading)=>heading.textContent);
    expect(actual).toEqual(expected);
  });

  it('可展開全部22題並收合回前5題', async () => {
    const { container } = renderRoute('/trends');
    const expand = await screen.findByRole('button', { name: '查看全部 22 個主題' });
    fireEvent.click(expand);
    expect(container.querySelectorAll('.trend-topic-card')).toHaveLength(22);
    fireEvent.click(screen.getByRole('button', { name: '收合為前 5 名' }));
    expect(container.querySelectorAll('.trend-topic-card')).toHaveLength(5);
  });

  it('今日白話摘要使用實際高潛力數量與最高分', async () => {
    renderRoute('/trends');
    const topics=trendDiscoveryService.listAll();
    const count=topics.filter((topic)=>topic.status==='high_potential').length;
    const highest=Math.max(...topics.map((topic)=>topic.totalScore));
    expect(await screen.findByText(`今天有 ${count} 個話題正在快速爆紅，最高潛力 ${highest} 分。`)).toBeInTheDocument();
  });
});

describe('RC2搜尋篩選使用性', () => {
  beforeEach(async () => { await resetReviewData(); });

  it('基本篩選顯示且進階篩選預設收合並可鍵盤語意展開', async () => {
    renderRoute('/trends/search');
    expect(await screen.findByLabelText('關鍵字搜尋')).toBeInTheDocument();
    expect(screen.getByText('分類')).toBeInTheDocument();
    expect(screen.getByText('時間範圍')).toBeInTheDocument();
    expect(screen.getByText('排序方式')).toBeInTheDocument();
    const summary=screen.getByText('進階篩選');
    const details=summary.closest('details');
    expect(details).not.toHaveAttribute('open');
    expect(summary).toHaveAttribute('aria-expanded','false');
    fireEvent.click(summary);
    expect(details).toHaveAttribute('open');
    await waitFor(()=>expect(summary).toHaveAttribute('aria-expanded','true'));
    fireEvent.click(summary);
    await waitFor(()=>expect(details).not.toHaveAttribute('open'));
  });

  it('顯示啟用的進階條件數、結果數及有效條件摘要', async () => {
    renderRoute('/trends/search');
    fireEvent.click(await screen.findByText('進階篩選'));
    fireEvent.change(screen.getByLabelText('資料來源'), { target:{value:'youtube'} });
    fireEvent.change(screen.getByLabelText('最低熱度'), { target:{value:'70'} });
    fireEvent.click(screen.getByLabelText('只看跨平台'));
    expect(screen.getByText('進階篩選（已啟用 3 項）')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'套用篩選'}));
    expect(screen.getByText(/目前結果：\d+ 筆/)).toBeInTheDocument();
    expect(screen.getByText('來源：YouTube')).toBeInTheDocument();
    expect(screen.getByText('熱度至少 70')).toBeInTheDocument();
    expect(screen.getAllByText('只看跨平台')).toHaveLength(2);
  });

  it('清除條件後回到預設狀態', async () => {
    renderRoute('/trends/search');
    fireEvent.change(await screen.findByLabelText('關鍵字搜尋'),{target:{value:'AI'}});
    fireEvent.click(screen.getByText('進階篩選'));
    fireEvent.change(screen.getByLabelText('最低總分'),{target:{value:'80'}});
    fireEvent.click(screen.getByRole('button',{name:'清除條件'}));
    expect(screen.getByLabelText('關鍵字搜尋')).toHaveValue('');
    expect(screen.getByLabelText('最低總分')).toHaveValue(0);
    expect(screen.getByText('進階篩選')).toHaveAttribute('aria-expanded','false');
  });
});

describe('RC2清單、排除與公開文案', () => {
  beforeEach(async () => { await resetReviewData(); });

  it.each([
    ['/trends/watchlist','尚未加入觀察',['前往爆紅熱門精選','前往主題搜尋']],
    ['/trends/excluded','尚未排除任何主題',['前往爆紅熱門精選','前往主題搜尋']],
    ['/trends/rules','尚未儲存篩選規則',['前往主題搜尋']],
  ] as const)('%s空狀態具有可用CTA', async (path,heading,links) => {
    renderRoute(path);
    expect(await screen.findByRole('heading',{name:heading})).toBeInTheDocument();
    for (const link of links) expect(screen.getByRole('link',{name:link})).toBeInTheDocument();
  });

  it('排除原因未選時不可確認，選擇後可排除並撤銷', async () => {
    renderRoute('/trends');
    const topic=trendDiscoveryService.listAll().filter((item)=>item.status==='high_potential').sort((a,b)=>b.totalScore-a.totalScore)[0];
    await screen.findByRole('heading',{name:topic.title});
    const card=screen.getByRole('heading',{name:topic.title}).closest('article')!;
    fireEvent.click(card.querySelector('.exclude-control summary')!);
    const confirm=card.querySelector<HTMLButtonElement>('.exclude-control button')!;
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(`${topic.title} 排除原因`),{target:{value:'無品牌價值'}});
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(await screen.findByText(`✓ 已排除「${topic.title}」。`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'撤銷'}));
    expect(await screen.findByRole('heading',{name:topic.title})).toBeInTheDocument();
    expect(trendDiscoveryService.getExcluded()).toHaveLength(0);
  });

  it.each(['/review','/trends','/trends/search','/trends/watchlist','/trends/excluded','/trends/sources','/trends/rules'])('%s公開畫面不顯示工程術語', async (path) => {
    const { container }=renderRoute(path);
    await screen.findByText('● Mock審核資料｜非即時熱門情報');
    expect(container.textContent).not.toMatch(/MockTrendSourceProvider|TrendScoreCalculator|Repository|工作包\s*002|infrastructure|application|domain/);
  });

  it('22個議題與61筆來源訊號維持不變', () => {
    const topics=trendDiscoveryService.listAll();
    expect(topics).toHaveLength(22);
    expect(topics.reduce((sum,topic)=>sum+topic.sourceItems.length,0)).toBe(61);
  });

  it('提供prefers-reduced-motion減少動畫設定', () => {
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toMatch(/animation:\s*none\s*!important/);
    expect(styles).toMatch(/transition:\s*none\s*!important/);
  });
});
