interface Job {
  bitmap?: ImageData
  denoiseModel: string
  resolve: (upscaled: ImageBitmap) => void
}

class WorkerPool {
  private created_workers = 0
  private max_workers: number
  private jobs: Job[] = []
  private workers: Worker[] = []

  public constructor(max_workers: number) {
    this.max_workers = max_workers
  }

  public terminate() {
    this.workers.map(worker => worker.terminate())
    this.workers = []
  }

  public async execute(job: Job) {
    if (this.created_workers < this.max_workers) {
      this.created_workers++
      const Worker = await import("worker-loader!./upscale.worker")
      this.workers.push(new Worker.default())
    }

    const worker = this.workers.shift()
    const resolvers = new Map<number, (upscaled: ImageBitmap) => void>()
    if (worker) {
      let id = 0
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

export const workerStart = (max_workers: number) => {
  worker_pool = new WorkerPool(max_workers)
}

export const workerExecute = (job: Job) => {
  worker_pool?.execute(job)
}

export const workerTerminate = () => {
  worker_pool?.terminate()
  worker_pool = null
}

export default {
  workerStart,
  workerTerminate,
  workerExecute,
}