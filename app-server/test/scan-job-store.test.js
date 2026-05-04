/* eslint-env mocha */
const assert = require('assert');
const fs = require('fs');

const ScanJobStore = require('../src/classes/scan-job-store');

describe('ScanJobStore', () => {
  const jobsDirectory = '/tmp/scanservjs-job-store-test';
  const config = { jobsDirectory };

  beforeEach(() => {
    fs.rmSync(jobsDirectory, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(jobsDirectory, { recursive: true, force: true });
  });

  it('Creates, reads, lists and deletes jobs', () => {
    const store = new ScanJobStore(config);
    const request = {
      batch: 'manual',
      params: {
        deviceId: 'test',
        resolution: 100
      }
    };

    const created = store.create(request);
    assert.strictEqual(created.status, 'created');
    assert.strictEqual(created.currentIndex, 1);
    assert.strictEqual(fs.existsSync(store.metadataPath(created.id)), true);

    created.status = 'waiting';
    store.save(created);

    const read = store.get(created.id);
    assert.strictEqual(read.status, 'waiting');
    assert.strictEqual(read.request.params.deviceId, 'test');
    assert.strictEqual(store.list().length, 1);

    store.delete(created.id);
    assert.strictEqual(store.list().length, 0);
  });

  it('Rejects unsafe job ids', () => {
    const store = new ScanJobStore(config);
    assert.throws(() => store.get('../package.json'), /Invalid job id/);
  });
});
