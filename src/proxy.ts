
const proxies = [
  "d16oqhcwx61zqh.cloudfront.net",
  "d18oynqa97z70b.cloudfront.net",
  "d1j7g7lrvvlssb.cloudfront.net",
]

const randomDNS = (): string => {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

export const proxyImage = (url: string): string => {
  const parsed = URL.parse(url)
  if (!parsed) throw Error("failed to parse URL")
  parsed.host = randomDNS()
  return parsed.toString()
}
