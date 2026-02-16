
export const proxyImage = (url: string): string => {
  const parsed = URL.parse(url)
  if (!parsed) throw Error("failed to parse URL")
  parsed.host = "d16oqhcwx61zqh.cloudfront.net"
  return parsed.toString()
}
