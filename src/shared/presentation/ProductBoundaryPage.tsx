import { Link } from 'react-router-dom';

export function ProductBoundaryPage() {
  return <section className="product-boundary" role="alert">
    <span aria-hidden="true">◇</span>
    <h1>此功能不屬於目前產品</h1>
    <p>熱門引擎目前專注於爆紅流量蒐集、評分、證據與篩選。</p>
    <Link className="button trend-primary" to="/trends">返回爆紅熱門精選</Link>
  </section>;
}
