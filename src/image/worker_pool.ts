interface Job {
  bitmap?: ImageData
  denoiseModel: string
  resolve: (upscaled: ImageBitmap) => void
}

class WorkerPool {
  private jobs: Job[] = []
  private workers: Worker[] = []
  public async start(max_workers: number) {
    const Worker = await import("worker-loader!./upscale.worker")
    for (let i = 0; i < max_workers; i++) {
      this.workers.push(new Worker.default())
    }
  }

  public terminate() {
    this.workers.map(worker => worker.terminate())
    this.workers = []
  }

  public execute(job: Job) {
    let id = 0
    const worker = this.workers.shift()
    const resolvers = new Map<number, (upscaled: ImageBitmap) => void>()
    if (worker) {
      const { bitmap, denoiseModel, resolve } = job
      resolvers.set(id, resolve)

      worker.onmessage = (event: MessageEvent) => {
        const { upscaled, id: resolver_id } = event.data
        resolvers.get(resolver_id)?.call(this, upscaled)
        const new_job = this.jobs.shift()
        if (new_job) {
          resolvers.set(id, new_job.resolve)
          worker.postMessage({
            id: id++,
            bitmap: new_job.bitmap,
            denoiseModel: new_job.denoiseModel,

          })
        } else {
          this.workers.push(worker)
        }
      }
      worker.postMessage({
        id: id++,
        bitmap,
        denoiseModel,
      })
      return
    }
    this.jobs.push(job)
  }
}

let worker_pool: WorkerPool | null

export const workerStart = async (max_workers: number) => {
  worker_pool = new WorkerPool()
  return worker_pool.start(max_workers)
}

export const workerExecute = (job: Job) => {
  worker_pool?.execute(job)
}

export const workerTerminate = () => {
  worker_pool?.terminate()
}

export default {
  workerStart,
  workerTerminate,
  workerExecute,
}