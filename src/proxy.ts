
export const proxyImage = (image: string): string => {
  const b64Url = btoa(image).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
  return `https://itglxlolghqb6pboiyhguhbmtm0tsqli.lambda-url.us-east-1.on.aws/?url=${b64Url}`
}

export default {
  proxyImage
}