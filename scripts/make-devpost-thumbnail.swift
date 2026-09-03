import AppKit
import Foundation

let fileManager = FileManager.default
let root = fileManager.currentDirectoryPath
let sourcePath = root + "/evidence/webmcp-radar-tools/2026-09-03-english-deployment/english-tablet-768x1024.png"
let outputPath = root + "/docs/competition/webmcp-2026/submission/assets/devpost-thumbnail-1200x800.png"

guard let source = NSImage(contentsOfFile: sourcePath) else {
  fputs("Unable to read the approved product screenshot.\n", stderr)
  exit(1)
}

let canvasSize = NSSize(width: 1200, height: 800)
let canvas = NSImage(size: canvasSize)
canvas.lockFocus()

NSColor(calibratedRed: 20 / 255, green: 33 / 255, blue: 61 / 255, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: canvasSize)).fill()

let paragraph = NSMutableParagraphStyle()
paragraph.lineBreakMode = .byWordWrapping

func drawText(_ text: String, x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat = 180, size: CGFloat, color: NSColor, weight: NSFont.Weight = .regular) {
  let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: color,
    .paragraphStyle: paragraph
  ]
  let string = NSAttributedString(string: text, attributes: attributes)
  string.draw(with: NSRect(x: x, y: y, width: width, height: height), options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func drawBadge(_ text: String, x: CGFloat, y: CGFloat, width: CGFloat, fill: NSColor, textColor: NSColor) {
  let rect = NSRect(x: x, y: y, width: width, height: 52)
  fill.setFill()
  NSBezierPath(roundedRect: rect, xRadius: 14, yRadius: 14).fill()
  drawText(text, x: x + 19, y: y + 11, width: width - 38, height: 30, size: 22, color: textColor, weight: .semibold)
}

let coral = NSColor(calibratedRed: 241 / 255, green: 116 / 255, blue: 97 / 255, alpha: 1)
let white = NSColor.white
let muted = NSColor(calibratedRed: 191 / 255, green: 201 / 255, blue: 217 / 255, alpha: 1)

drawText("THE WEBMCP CHALLENGE", x: 56, y: 700, width: 520, height: 30, size: 22, color: coral, weight: .semibold)
drawText("Asia Trend\nRadar Tools", x: 56, y: 495, width: 540, height: 180, size: 66, color: white, weight: .bold)
drawText("6 read-only WebMCP tools\nfor real, source-backed\ntrend discovery", x: 56, y: 305, width: 520, height: 150, size: 28, color: muted)
drawBadge("Native WebMCP", x: 56, y: 208, width: 220, fill: coral, textColor: NSColor(calibratedRed: 20 / 255, green: 33 / 255, blue: 61 / 255, alpha: 1))
drawBadge("Website fallback", x: 56, y: 138, width: 220, fill: NSColor(calibratedRed: 52 / 255, green: 70 / 255, blue: 107 / 255, alpha: 1), textColor: white)
drawText("Actual product UI", x: 56, y: 50, width: 300, height: 30, size: 20, color: NSColor(calibratedWhite: 0.68, alpha: 1))

let targetHeight: CGFloat = 720
let scale = targetHeight / source.size.height
let targetWidth = source.size.width * scale
let screenshotRect = NSRect(x: 620, y: 40, width: targetWidth, height: targetHeight)

NSGraphicsContext.saveGraphicsState()
let clip = NSBezierPath(roundedRect: screenshotRect, xRadius: 24, yRadius: 24)
clip.addClip()
source.draw(in: screenshotRect, from: NSRect(origin: .zero, size: source.size), operation: .sourceOver, fraction: 1)
NSGraphicsContext.restoreGraphicsState()

NSColor(calibratedWhite: 1, alpha: 0.2).setStroke()
let border = NSBezierPath(roundedRect: screenshotRect, xRadius: 24, yRadius: 24)
border.lineWidth = 2
border.stroke()

canvas.unlockFocus()

guard let tiff = canvas.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Unable to encode the Devpost thumbnail.\n", stderr)
  exit(1)
}

try fileManager.createDirectory(atPath: (outputPath as NSString).deletingLastPathComponent, withIntermediateDirectories: true)
try png.write(to: URL(fileURLWithPath: outputPath), options: .atomic)
print(outputPath)
