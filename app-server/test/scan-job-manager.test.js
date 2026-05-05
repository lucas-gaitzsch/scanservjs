/* eslint-env mocha */
const assert = require('assert');
const fs = require('fs');

const ScanController = require('../src/scan-controller');
const ScanJobManager = require('../src/classes/scan-job-manager');

describe('ScanJobManager', () => {
  const jobsDirectory = '/tmp/scanservjs-job-manager-test';
  const config = {
    jobsDirectory,
    jobsGcInterval: 1000,
    jobsActiveMaxAge: 1000,
    jobsCompletedMaxAge: 1000,
    jobsFailedMaxAge: 1000
  };

  const request = {
    batch: 'manual',
    params: {
      deviceId: 'test',
      resolution: 100
    }
  };

  beforeEach(() => {
    fs.rmSync(jobsDirectory, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(jobsDirectory, { recursive: true, force: true });
  });

  it('Creates a waiting manual job and blocks another active job', () => {
    const manager = new ScanJobManager(config);
    const job = manager.create(request);

    assert.strictEqual(job.status, 'waiting');
    assert.strictEqual(manager.listActive().length, 1);
    assert.throws(() => manager.create(request), /already active/);
  });

  it('Recovers running automatic jobs as failed', () => {
    let manager = new ScanJobManager(config);
    const job = manager.store.create(Object.assign({}, request, { batch: 'auto' }));
    job.status = 'scanning';
    manager.store.save(job);

    manager = new ScanJobManager(config);
    const recovered = manager.get(job.id);
    assert.strictEqual(recovered.status, 'failed');
    assert.strictEqual(recovered.error.includes('Server restarted'), true);
  });

  it('Recovers running manual jobs as waiting', () => {
    let manager = new ScanJobManager(config);
    const job = manager.store.create(request);
    job.status = 'scanning';
    job.error = 'in progress';
    manager.store.save(job);

    manager = new ScanJobManager(config);
    const recovered = manager.get(job.id);
    assert.strictEqual(recovered.status, 'waiting');
    assert.strictEqual(recovered.error, null);
    assert.strictEqual(manager.listActive().some(active => active.id === job.id), true);
  });

  it('Scans and rescans manual pages through ScanController', async () => {
    const run = ScanController.run;
    const manager = new ScanJobManager(config);
    const job = manager.create(request);
    let scanned = [];

    ScanController.run = async (req) => {
      scanned.push(req.index);
      return {
        index: req.index,
        image: `image-${req.index}`
      };
    };

    try {
      let updated = await manager.scanPage(job.id);
      assert.strictEqual(updated.status, 'waiting');
      assert.strictEqual(updated.currentIndex, 2);
      assert.strictEqual(updated.pages[0].image, 'image-1');

      updated = await manager.rescanPage(job.id, 1);
      assert.strictEqual(updated.currentIndex, 2);
      assert.deepStrictEqual(scanned, [1, 1]);
      assert.strictEqual(updated.pages.length, 1);
    } finally {
      ScanController.run = run;
    }
  });

  it('Rejects rescan before mutating invalid jobs', async () => {
    const manager = new ScanJobManager(config);
    const job = manager.store.create(Object.assign({}, request, { batch: 'auto' }));
    job.status = 'completed';
    job.currentIndex = 2;
    job.pages = [{
      index: 1,
      status: 'completed',
      image: 'image-1'
    }];
    manager.store.save(job);

    await assert.rejects(
      () => manager.rescanPage(job.id, 1),
      /manual batch jobs/
    );

    const unchanged = manager.get(job.id);
    assert.strictEqual(unchanged.status, 'completed');
    assert.strictEqual(unchanged.currentIndex, 2);
    assert.strictEqual(unchanged.pages.length, 1);
  });

  it('Rejects finishing manual jobs that are not ready', async () => {
    const manager = new ScanJobManager(config);
    const empty = manager.create(request);
    const completed = manager.store.create(request);
    completed.status = 'completed';
    completed.pages = [{
      index: 1,
      status: 'completed',
      image: 'image-1'
    }];
    manager.store.save(completed);

    await assert.rejects(
      () => manager.finish(empty.id),
      /no scanned pages/
    );
    await assert.rejects(
      () => manager.finish(completed.id),
      /status completed/
    );

    assert.strictEqual(manager.get(empty.id).status, 'waiting');
    assert.strictEqual(manager.get(completed.id).status, 'completed');
  });

  it('Expires idle created and waiting jobs', () => {
    const manager = new ScanJobManager(config);
    const created = manager.store.create(request);
    const waiting = manager.store.create(request);
    const expiredAt = new Date(Date.now() - 2000).toISOString();

    created.updatedAt = expiredAt;
    waiting.status = 'waiting';
    waiting.updatedAt = expiredAt;
    fs.writeFileSync(manager.store.metadataPath(created.id), JSON.stringify(created, null, 2));
    fs.writeFileSync(manager.store.metadataPath(waiting.id), JSON.stringify(waiting, null, 2));

    manager.gc();

    assert.strictEqual(manager.get(created.id).status, 'expired');
    assert.strictEqual(manager.get(waiting.id).status, 'expired');
  });
});
