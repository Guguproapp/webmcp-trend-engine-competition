export const formatDateTime = (value: string) => new Intl.DateTimeFormat('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(value));
export const formatNumber = (value: number) => new Intl.NumberFormat('zh-TW', { notation:value >= 10000 ? 'compact' : 'standard', maximumFractionDigits:1 }).format(value);
