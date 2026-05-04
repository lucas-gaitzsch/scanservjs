const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const FileInfo = require('./file-info');

function now() {
  return new Date().toISOString();
}

function assertJobId(id) {
  if (!/^[0-9a-f-]+$/i.test(id)) {
    throw new Error(`Invalid job id: ${id}`);
  }
}

module.exports = class ScanJobStore {
  /**
   * @param {Configuration} config
   */
  constructor(config) {
    this.config = config;
    fs.mkdirSync(this.config.jobsDirectory, { recursive: true });
  }

  /**
   * @returns {string}
   */
  createId() {
    return crypto.randomUUID();
  }

  /**
   * @param {string} id
   * @returns {string}
   */
  jobDirectory(id) {
    assertJobId(id);
    return path.join(this.config.jobsDirectory, id);
  }

  /**
   * @param {string} id
   * @returns {string}
   */
  tempDirectory(id) {
    return path.join(this.jobDirectory(id), 'temp');
  }

  /**
   * @param {string} id
   * @returns {string}
   */
  metadataPath(id) {
    return path.join(this.jobDirectory(id), 'job.json');
  }

  /**
   * @param {ScanRequest} request
   * @returns {ScanJob}
   */
  create(request) {
    const id = this.createId();
    const job = {
      id,
      createdAt: now(),
      updatedAt: now(),
      status: 'created',
      request,
      batch: request.batch,
      currentIndex: 1,
      pages: [],
      file: null,
      error: null
    };
    this.save(job);
    return job;
  }

  /**
   * @param {ScanJob} job
   * @returns {ScanJob}
   */
  save(job) {
    assertJobId(job.id);
    job.updatedAt = now();
    fs.mkdirSync(this.tempDirectory(job.id), { recursive: true });
    FileInfo.create(this.metadataPath(job.id)).save(JSON.stringify(job, null, 2));
    return job;
  }

  /**
   * @param {string} id
   * @returns {ScanJob}
   */
  get(id) {
    assertJobId(id);
    const file = FileInfo.create(this.metadataPath(id));
    if (!file.exists()) {
      throw new Error(`Scan job not found: ${id}`);
    }
    return file.parseJson();
  }

  /**
   * @returns {ScanJob[]}
   */
  list() {
    const dir = FileInfo.create(this.config.jobsDirectory);
    if (!dir.exists()) {
      return [];
    }

    return fs.readdirSync(this.config.jobsDirectory)
      .map(id => {
        try {
          return this.get(id);
        } catch (error) {
          return null;
        }
      })
      .filter(job => job !== null)
      .sort((j1, j2) => j2.updatedAt.localeCompare(j1.updatedAt));
  }

  /**
   * @param {string} id
   * @returns {void}
   */
  delete(id) {
    fs.rmSync(this.jobDirectory(id), { recursive: true, force: true });
  }
};
