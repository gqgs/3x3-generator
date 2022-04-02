interface Job {
  bitmap?: ImageData
  denoiseModel: string
  resolve: (upscaled: ImageBitmap) => void
}

class WorkerPool {
  private created_workers = 0
  private _max_workers = 1
  private jobs: Job[] = []
  private workers: Worker[] = []

  public get max_workers(): number {
    return this._max_workers
  }

  public set max_workers(workers: number) {
    this._max_workers = workers
  }

  public terminate() {
    this.workers.map(worker => worker.terminate())
    this.workers = []
    this.created_workers = 0
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

class WorkerManager {
  private worker_pool = new WorkerPool()

  public update(max_workers: number) {
    this.worker_pool.max_workers = max_workers
  }
  public execute(job: Job) {
    this.worker_pool.execute(job)
  }
  public terminate() {
    this.worker_pool.terminate()
  }
}

export const workerPool = new WorkerManager()

export default {
  workerPool
}