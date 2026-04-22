const https = require("https")
const loginData = JSON.stringify({ email: "admin@deveway.com", password: "Admin123!" })
const req = https.request({
  hostname: "deve-way.onrender.com",
  path: "/api/auth/login", method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginData) }
}, res => {
  let b = ""
  res.on("data", c => b += c)
  res.on("end", () => {
    const token = JSON.parse(b)?.data?.accessToken
    if (!token) return console.log("NO TOKEN")
    
    // Replace with real courseId from your DB
    const courseId = "cmnnyt7pj000k9340czlsobtf"
    const body = JSON.stringify({})
    const r = https.request({
      hostname: "deve-way.onrender.com",
      path: `/api/certificates/generate/${courseId}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "Content-Length": Buffer.byteLength(body) }
    }, res2 => {
      let b2 = ""
      res2.on("data", c => b2 += c)
      res2.on("end", () => console.log("CERT:", res2.statusCode, b2.slice(0,300)))
    })
    r.write(body)
    r.end()
  })
})
req.write(loginData)
req.end()
