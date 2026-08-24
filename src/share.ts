const UPLOAD_URL = "https://tempfile.org/api/upload/local"

interface UploadResponse {
  success: boolean
  files?: Array<{
    id: string
    url: string
  }>
  error?: string
}

export const uploadImage = async (blob: Blob, filename: string): Promise<string> => {
  const form = new FormData()
  form.append("files", blob, filename)
  form.append("expiryHours", "48")

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: form
  })

  let result: UploadResponse
  try {
    result = await response.json() as UploadResponse
  } catch {
    throw new Error(`Image host returned an invalid response (${response.status}).`)
  }

  const file = result.files?.[0]
  if (!response.ok || !result.success || !file?.id) {
    throw new Error(result.error || `Image upload failed (${response.status}).`)
  }

  return `https://tempfile.org/${encodeURIComponent(file.id)}/preview`
}

export const copyShareUrl = async (url: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return
    } catch {
      // The transient clipboard permission can expire during a slow upload.
    }
  }

  const input = document.createElement("textarea")
  input.value = url
  input.setAttribute("readonly", "")
  input.style.position = "fixed"
  input.style.opacity = "0"
  document.body.appendChild(input)
  input.select()

  const copied = document.execCommand("copy")
  input.remove()
  if (!copied) throw new Error("Could not copy the share link to the clipboard.")
}
