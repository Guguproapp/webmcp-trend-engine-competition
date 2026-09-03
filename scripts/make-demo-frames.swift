import AppKit
import Foundation

let fm = FileManager.default
let root = fm.currentDirectoryPath
let outputDirectory = root + "/docs/competition/webmcp-2026/submission/assets/frames"
try fm.createDirectory(atPath: outputDirectory, withIntermediateDirectories: true)

let heroPath = root + "/evidence/webmcp-radar-tools/2026-09-03-english/english-desktop-1440x900.png"
let resultsPath = root + "/evidence/webmcp-radar-tools/2026-09-03-english-deployment/english-results-1440x900.png"
let tabletPath = root + "/evidence/webmcp-radar-tools/2026-09-03-english-deployment/english-tablet-768x1024.png"
let mobilePath = root + "/evidence/webmcp-radar-tools/2026-09-03-english-deployment/english-mobile-390x844.png"
let safariPath = root + "/evidence/webmcp-radar-tools/07-safari-private-search-20260903.jpeg"
let thumbnailPath = root + "/docs/competition/webmcp-2026/submission/assets/devpost-thumbnail-1200x800.png"

let navy = NSColor(calibratedRed: 20 / 255, green: 33 / 255, blue: 61 / 255, alpha: 1)
let deepNavy = NSColor(calibratedRed: 11 / 255, green: 22 / 255, blue: 43 / 255, alpha: 1)
let coral = NSColor(calibratedRed: 241 / 255, green: 116 / 255, blue: 97 / 255, alpha: 1)
let muted = NSColor(calibratedRed: 191 / 255, green: 201 / 255, blue: 217 / 255, alpha: 1)

func image(_ path: String) -> NSImage {
  guard let value = NSImage(contentsOfFile: path) else {
    fputs("Unable to read image: \(path)\n", stderr)
    exit(1)
  }
  return value
}

func drawText(_ text: String, rect: NSRect, size: CGFloat, color: NSColor, weight: NSFont.Weight = .regular, alignment: NSTextAlignment = .left) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.lineBreakMode = .byWordWrapping
  paragraph.alignment = alignment
  paragraph.lineSpacing = 3
  let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: color,
    .paragraphStyle: paragraph
  ]
  NSAttributedString(string: text, attributes: attributes).draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func aspectFit(_ source: NSImage, in target: NSRect) -> NSRect {
  let ratio = min(target.width / source.size.width, target.height / source.size.height)
  let width = source.size.width * ratio
  let height = source.size.height * ratio
  return NSRect(x: target.midX - width / 2, y: target.midY - height / 2, width: width, height: height)
}

func drawScreenshot(_ source: NSImage, in target: NSRect) {
  let fitted = aspectFit(source, in: target)
  source.draw(in: fitted, from: NSRect(origin: .zero, size: source.size), operation: .sourceOver, fraction: 1)
  NSColor(calibratedWhite: 1, alpha: 0.18).setStroke()
  let border = NSBezierPath(roundedRect: fitted, xRadius: 16, yRadius: 16)
  border.lineWidth = 2
  border.stroke()
}

func drawCaption(english: String, chinese: String) {
  NSColor(calibratedRed: 8 / 255, green: 17 / 255, blue: 34 / 255, alpha: 0.94).setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: 1920, height: 205)).fill()
  drawText(english, rect: NSRect(x: 115, y: 118, width: 1690, height: 65), size: 33, color: .white, weight: .semibold, alignment: .center)
  drawText(chinese, rect: NSRect(x: 115, y: 42, width: 1690, height: 65), size: 31, color: muted, weight: .medium, alignment: .center)
}

func drawEvidencePanel(title: String, lines: [String]) {
  let rect = NSRect(x: 1230, y: 255, width: 610, height: 680)
  NSColor(calibratedRed: 10 / 255, green: 24 / 255, blue: 48 / 255, alpha: 0.94).setFill()
  NSBezierPath(roundedRect: rect, xRadius: 28, yRadius: 28).fill()
  drawText(title, rect: NSRect(x: 1280, y: 820, width: 510, height: 70), size: 34, color: coral, weight: .bold)
  var y: CGFloat = 735
  for line in lines {
    drawText("• " + line, rect: NSRect(x: 1280, y: y, width: 500, height: 80), size: 28, color: .white, weight: .medium)
    y -= 82
  }
}

func saveFrame(index: Int, source: NSImage?, title: String?, panelTitle: String? = nil, panelLines: [String] = [], english: String, chinese: String, collage: Bool = false) throws {
  let canvas = NSImage(size: NSSize(width: 1920, height: 1080))
  canvas.lockFocus()
  deepNavy.setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: 1920, height: 1080)).fill()

  if collage {
    drawScreenshot(image(tabletPath), in: NSRect(x: 60, y: 235, width: 780, height: 700))
    drawScreenshot(image(mobilePath), in: NSRect(x: 860, y: 235, width: 340, height: 700))
  } else if let source {
    let width: CGFloat = panelTitle == nil ? 1800 : 1160
    drawScreenshot(source, in: NSRect(x: 60, y: 235, width: width, height: 700))
  }

  if let title {
    drawText(title, rect: NSRect(x: 70, y: 955, width: 1760, height: 70), size: 38, color: coral, weight: .bold)
  }
  if let panelTitle {
    drawEvidencePanel(title: panelTitle, lines: panelLines)
  }
  drawCaption(english: english, chinese: chinese)
  canvas.unlockFocus()

  guard let tiff = canvas.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let png = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "DemoFrames", code: 1)
  }
  let path = String(format: "%@/frame-%02d.png", outputDirectory, index)
  try png.write(to: URL(fileURLWithPath: path), options: .atomic)
}

let hero = image(heroPath)
let results = image(resultsPath)
let safari = image(safariPath)
let thumbnail = image(thumbnailPath)

try saveFrame(index: 1, source: thumbnail, title: nil,
  english: "Meet Asia Trend Radar, built around six safe, read-only WebMCP tools.",
  chinese: "認識 Asia Trend Radar：以六個安全、唯讀的 WebMCP 工具為核心。")
try saveFrame(index: 2, source: hero, title: "ACTUAL PRODUCT UI",
  english: "Trend research is fragmented. Agents often lack source, freshness, and supporting evidence.",
  chinese: "趨勢研究通常很零散，代理往往缺少來源、時效與佐證資料。")
try saveFrame(index: 3, source: hero, title: "NATIVE WEBMCP DISCOVERY", panelTitle: "6 read-only tools", panelLines: [
  "search_radar_trends", "get_radar_trend", "search_radar_videos", "list_radar_sources", "list_radar_markets", "list_radar_categories"
], english: "WebMCP provides structured retrieval without scraping the interface or granting write access.",
  chinese: "WebMCP 提供結構化查詢，不必擷取介面，也不授予寫入權限。")
try saveFrame(index: 4, source: results, title: "LIVE TAIWAN RISING SEARCHES",
  english: "The agent finds Taiwan's top five rising searches from the previous 24 hours using typed inputs.",
  chinese: "代理使用明確參數，找出台灣過去 24 小時排名前五的上升熱搜。")
try saveFrame(index: 5, source: results, title: "SOURCE-BACKED DETAIL", panelTitle: "Actual validation", panelLines: [
  "5 live Taiwan records", "Chinese topic ID passed", "Source and freshness kept", "External text is untrusted"
], english: "These are live radar records, not demo data. A Chinese topic ID opens its source evidence.",
  chinese: "這些是真實雷達紀錄，不是展示資料；中文主題識別碼也能查閱來源證據。")
try saveFrame(index: 6, source: nil, title: "ONE CONTRACT, RESPONSIVE UI", panelTitle: "Actual validation", panelLines: [
  "14 sources", "16 markets", "16 categories", "Videos: honest 0 result"
], english: "Three tools list sources, markets, and categories. The video tool may return an honest empty result.",
  chinese: "三個工具列出來源、市場與分類；影音工具可以誠實回傳空資料。", collage: true)
try saveFrame(index: 7, source: hero, title: "READ-ONLY BY DESIGN", panelTitle: "Safety boundary", panelLines: [
  "Strict input schemas", "limit=500 rejected", "No management tools", "Credentials stay server-side"
], english: "Every tool is read-only. Strict schemas reject limit=500, and no management tool is exposed.",
  chinese: "所有工具都是唯讀；嚴格結構會拒絕 limit=500，而且沒有暴露管理工具。")
try saveFrame(index: 8, source: safari, title: "WEBSITE FALLBACK — NOT NATIVE WEBMCP", panelTitle: "Safari", panelLines: [
  "Normal website search", "Same read-only data path", "5 live results", "Native WebMCP: NOT RUN"
], english: "Credentials stay on the server. Safari uses the website fallback, not native WebMCP.",
  chinese: "憑證只留在伺服器；Safari 使用網站備援，不宣稱支援原生 WebMCP。")
try saveFrame(index: 9, source: hero, title: "CHALLENGE-PERIOD WORK", panelTitle: "Added after Aug 25", panelLines: [
  "Isolated competition edition", "Six WebMCP tools", "Safety contracts", "Read-only adapter", "Localized topic handling", "English judging UI"
], english: "After August 25, we added the isolated competition edition, six tools, safety contracts, and evidence.",
  chinese: "8 月 25 日後，我們新增獨立比賽版、六個工具、安全契約與驗證證據。")
try saveFrame(index: 10, source: thumbnail, title: nil,
  english: "The human keeps every interpretation and publishing decision. Real signals. Read-only tools. Honest fallbacks.",
  chinese: "所有解讀與發布決策仍由人決定。真實訊號、唯讀工具、誠實備援。")

print(outputDirectory)
