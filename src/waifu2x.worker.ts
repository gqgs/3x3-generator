import waifu2x from './waifu2x'

// eslint-disable-next-line
const ctx: Worker = self as any

onmessage = async (event: MessageEvent) => {
  const width = event.data.width * 2
  const height = event.data.height * 2
  const image_data = event.data.image_data

  const progress = (value: number) => {
    ctx.postMessage({
      type: 'progress',
      value
    })
  }

  const result = await waifu2x.enlarge(image_data, progress)
  ctx.postMessage({
    type: 'done',
    result,
    width,
    height
  })
}
