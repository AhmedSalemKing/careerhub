const { createCanvas, Image, loadImage } = require("@napi-rs/canvas")
const fs = require("fs")
const path = require("path")
async function main() {
  const templatePath = path.join(__dirname, "src/modules/certificates/template.png")
  console.log("Loading:", templatePath)
  const buffer = fs.readFileSync(templatePath)
  const blob = new Blob([buffer])
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
  console.log("Width:", img.width, "Height:", img.height)
  console.log("Ratio:", (img.width / img.height).toFixed(3))
  
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)
  
  const pixel1 = ctx.getImageData(Math.floor(img.width/2), Math.floor(img.height * 0.44), 1, 1).data
  const pixel2 = ctx.getImageData(Math.floor(img.width/2), Math.floor(img.height * 0.58), 1, 1).data
  console.log("Pixel at name area (R,G,B,A):", pixel1[0], pixel1[1], pixel1[2], pixel1[3])
  console.log("Pixel at course area (R,G,B,A):", pixel2[0], pixel2[1], pixel2[2], pixel2[3])
  
  const bgPixel = ctx.getImageData(Math.floor(img.width * 0.1), Math.floor(img.height * 0.1), 1, 1).data
  console.log("Pixel at top-left (R,G,B,A):", bgPixel[0], bgPixel[1], bgPixel[2], bgPixel[3])
  
  URL.revokeObjectURL(img.src)
}
main().catch(console.error)