const log = require('loglevel').getLogger('ScanJobManager');

const Constants = require('../constants');
const ScanController = require('../scan-controller');
const ScanJobStore = require('./scan-job-store');

const ACTIVE_STATUSES = ['created', 'waiting', 'scanning', 'processing'];

function age(job) {
  return Date.now() - new Date(job.updatedAt).getTime();
}

module.exports = class ScanJobManager {
  /**
   * @param {Configuration} config
   */
  constructor(config) {
    this.config = config;
    this.store = new ScanJobStore(config);
    this.active = null;
    this.gcTimer = null;
    this.recover();
  }

  recover() {
    this.store.list().forEach(job => {
      if (['scanning', 'processing'].includes(job.status)) {
        if (job.batch === Constants.BATCH_MANUAL) {
          job.status = 'waiting';
          job.error = null;
        } else {
          job.status = 'failed';
          job.error = 'Server restarted while the scan job was running';
        }
        this.store.save(job);
      }
    });
  }

  startGc() {
    if (this.gcTimer === null) {
      this.gcTimer = setInterval(() => this.gc(), this.config.jobsGcInterval);
      this.gcTimer.unref();
      this.gc();
    }
  }

  gc() {
    this.store.list().forEach(job => {
      const maxAge = {
        created: this.config.jobsActiveMaxAge,
        waiting: this.config.jobsActiveMaxAge,
        completed: this.config.jobsCompletedMaxAge,
        failed: this.config.jobsFailedMaxAge,
        cancelled: this.config.jobsFailedMaxAge,
        expired: this.config.jobsFailedMaxAge
      }[job.status];

      if (['created', 'waiting'].includes(job.status) && age(job) > maxAge) {
        job.status = 'expired';
        this.store.save(job);
      } else if (maxAge !== undefined && age(job) > maxAge) {
        this.store.delete(job.id);
      }
    });
  }

  list() {
    return this.store.list();
  }

  listActive() {
    return this.list().filter(job => ACTIVE_STATUSES.includes(job.status));
  }

  get(id) {
    return this.store.get(id);
  }

  assertNoRunningJob(id) {
    const running = this.list().filter(job => ['scanning', 'processing'].includes(job.status) && job.id !== id)[0];
    if (running) {
      const error = new Error(`Scanner is busy with job ${running.id}`);
      error.code = 409;
      throw error;
    }
  }

  create(request) {
    const active = this.listActive()[0];
    if (active) {
      const error = new Error(`A scan job is already active: ${active.id}`);
      error.code = 409;
      error.job = active;
      throw error;
    }

    const job = this.store.create(request);
    if (request.batch === Constants.BATCH_MANUAL) {
      job.status = 'waiting';
      return this.store.save(job);
    }

    this.runJob(job.id);
    return this.get(job.id);
  }

  async runJob(id) {
    this.assertNoRunningJob(id);
    this.active = { id, proc: null };
    let job = this.get(id);
    job.status = 'scanning';
    job.error = null;
    this.store.save(job);

    try {
      const response = await ScanController.run(job.request, {
        tempDirectory: this.store.tempDirectory(job.id),
        onProcess: proc => {
          this.active.proc = proc;
        }
      });
      job = this.get(id);
      job.status = 'completed';
      job.file = response.file;
      this.store.save(job);
    } catch (error) {
      log.error(error);
      job = this.get(id);
      if (job.status !== 'cancelled') {
        job.status = 'failed';
        job.error = error.message;
        this.store.save(job);
      }
    } finally {
      this.active = null;
    }
  }

  async scanPage(id) {
    this.assertNoRunningJob(id);
    let job = this.get(id);
    if (job.batch !== Constants.BATCH_MANUAL) {
      throw new Error('Pages can only be scanned manually for manual batch jobs');
    }
    if (!['created', 'waiting'].includes(job.status)) {
      throw new Error(`Cannot scan page for job in status ${job.status}`);
    }

    job.status = 'scanning';
    job.error = null;
    this.store.save(job);
    this.active = { id, proc: null };

    try {
      const request = Object.assign({}, job.request, { index: job.currentIndex });
      const response = await ScanController.run(request, {
        tempDirectory: this.store.tempDirectory(job.id),
        onProcess: proc => {
          this.active.proc = proc;
        }
      });
      job = this.get(id);
      job.pages = job.pages.filter(page => page.index !== response.index);
      job.pages.push({
        index: response.index,
        status: 'completed',
        image: response.image
      });
      job.pages.sort((p1, p2) => p1.index - p2.index);
      job.currentIndex = Math.max(...job.pages.map(page => page.index + 1));
      job.status = 'waiting';
      return this.store.save(job);
    } catch (error) {
      log.error(error);
      job = this.get(id);
      if (job.status !== 'cancelled') {
        job.status = 'failed';
        job.error = error.message;
      }
      return this.store.save(job);
    } finally {
      this.active = null;
    }
  }

  async rescanPage(id, index) {
    let job = this.get(id);
    const currentIndex = Number(index);
    if (job.batch !== Constants.BATCH_MANUAL) {
      throw new Error('Pages can only be scanned manually for manual batch jobs');
    }
    if (!['created', 'waiting'].includes(job.status)) {
      throw new Error(`Cannot scan page for job in status ${job.status}`);
    }
    if (!job.pages.some(page => page.index === currentIndex)) {
      throw new Error(`Cannot rescan missing page ${currentIndex}`);
    }

    job.currentIndex = currentIndex;
    job.pages = job.pages.filter(page => page.index !== job.currentIndex);
    job.status = 'waiting';
    this.store.save(job);
    return await this.scanPage(id);
  }

  async finish(id) {
    this.assertNoRunningJob(id);
    let job = this.get(id);
    if (job.batch !== Constants.BATCH_MANUAL) {
      throw new Error('Only manual batch jobs can be finished explicitly');
    }
    if (job.status !== 'waiting') {
      throw new Error(`Cannot finish job in status ${job.status}`);
    }
    if (job.pages.length === 0) {
      throw new Error('Cannot finish manual batch job with no scanned pages');
    }

    job.status = 'processing';
    this.store.save(job);
    this.active = { id, proc: null };
    try {
      const request = Object.assign({}, job.request, { index: -1 });
      const response = await ScanController.run(request, {
        tempDirectory: this.store.tempDirectory(job.id),
        onProcess: proc => {
          this.active.proc = proc;
        }
      });
      job = this.get(id);
      job.status = 'completed';
      job.file = response.file;
      return this.store.save(job);
    } catch (error) {
      log.error(error);
      job = this.get(id);
      if (job.status !== 'cancelled') {
        job.status = 'failed';
        job.error = error.message;
      }
      return this.store.save(job);
    } finally {
      this.active = null;
    }
  }

  cancel(id) {
    const job = this.get(id);
    job.status = 'cancelled';
    this.store.save(job);
    if (this.active && this.active.id === id && this.active.proc) {
      this.active.proc.kill('SIGTERM');
    }
    return job;
  }
};
