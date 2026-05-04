<template>
  <div class="scan-page">
    <v-row>
      <v-spacer />

      <v-col cols="12" md="3" class="scan-settings mb-6 mb-md-0" order="2" order-md="1">
        <div class="d-flex">
          <v-select v-if="context.devices.length > 0"
            v-model="device"
            style="min-width: 0px;"
            :label="$t('scan.device')"
            :items="context.devices" return-object item-title="name" @update:model-value="clear" />
          <v-btn small class="ml-2 mt-4 pl-1 pr-1" min-width="32" @click="deviceRefresh"><v-icon :icon="mdiRefresh" /></v-btn>
        </div>

        <v-select v-if="'--source' in device.features"
          v-model="request.params.source"
          :no-data-text="$t('global.no-data-text')" :label="$t('scan.source')"
          :items="sources" item-value="value" item-title="text" />

        <v-select v-if="'--adf-mode' in device.features"
          v-model="request.params.adfMode"
          :no-data-text="$t('global.no-data-text')" :label="$t('scan.adf-mode')"
          :items="adfModes" item-value="value" item-title="text" />

        <v-select
          v-model="request.params.resolution"
          :no-data-text="$t('global.no-data-text')" :label="$t('scan.resolution')"
          :items="device.features['--resolution']['options']" />

        <v-select v-if="'--mode' in device.features"
          v-model="request.params.mode"
          :no-data-text="$t('global.no-data-text')" :label="$t('scan.mode')"
          :items="modes" item-value="value" item-title="text" />

        <v-select v-if="'--disable-dynamic-lineart' in device.features"
          v-model="request.params.mode"
          :label="$t('scan.dynamic-lineart')"
          :items="[
            { value: false, text: $t('scan.dynamic-lineart:disabled') },
            { value: true, text: $t('scan.dynamic-lineart:enabled') }]"
          item-value="value" item-title="text" />

        <v-select v-model="request.batch" :label="$t('scan.batch')"
          :no-data-text="$t('global.no-data-text')"
          :items="batchModes" item-value="value" item-title="text" />

        <v-select
          v-model="request.filters"
          :no-data-text="$t('global.no-data-text')"
          :items="filters"
          item-title="text"
          item-value="value"
          :label="$t('scan.filters')"
          multiple
          @update:model-value="readPreview" />

        <v-select
          v-model="request.pipeline"
          :no-data-text="$t('global.no-data-text')"
          :label="$t('scan.format')"
          :items="pipelines"
          item-title="text"
          item-value="value" />

        <div v-if="!smAndDown" class="d-flex flex-row-reverse flex-wrap">
          <v-btn color="blue" class="ml-1 mb-1" size="large" @click="scan(1)">{{ $t('scan.btn-scan') }} <v-icon class="ml-2" :icon="mdiCamera" /></v-btn>
          <v-btn v-if="geometry" color="green" class="ml-1 mb-1" @click="createPreview">{{ $t('scan.btn-preview') }} <v-icon class="ml-2" :icon="mdiMagnify" /></v-btn>
          <v-btn color="amber" class="ml-1 mb-1" variant="tonal" @click="deletePreview">{{ $t('scan.btn-clear') }} <v-icon class="ml-2" :icon="mdiDelete" /></v-btn>
        </div>
      </v-col>

      <v-col cols="12" md="auto" class="scan-preview mb-6 mb-md-0" order="1" order-md="2" :style="previewStyle">
        <cropper v-if="geometry" ref="cropper" :key="preview.key" class="cropper" :transition-time="10" :wheel-resize="false"
            :default-position="cropperDefaultPosition" :default-size="cropperDefaultSize"
            :src="img" @change="onCropperChange" />
        <v-img v-if="!geometry" :src="img" />
      </v-col>

      <v-col cols="12" md="3" class="scan-adjustments mb-6 mb-md-0" order="3" order-md="3">
        <template v-if="geometry">
          <div class="scan-coordinate-grid">
            <v-text-field v-model="request.params.top" :label="$t('scan.top')" type="number" step="any" @blur="onCoordinatesChange" />
            <v-text-field v-model="request.params.left" :label="$t('scan.left')" type="number" step="any" @blur="onCoordinatesChange" />
            <v-text-field v-model="request.params.width" :label="$t('scan.width')" type="number" step="any" @blur="onCoordinatesChange" />
            <v-text-field v-model="request.params.height" :label="$t('scan.height')" type="number" step="any" @blur="onCoordinatesChange" />
          </div>

          <v-menu offset-y>
            <template #activator="{ props }">
              <v-btn color="primary" class="mb-4" v-bind="props">{{ $t('scan.paperSize') }}</v-btn>
            </template>
            <v-list dense>
              <v-list-item
                v-for="(item, index) in paperSizes"
                :key="index"
                @click="updatePaperSize(item)">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <template v-if="'--brightness' in device.features">
          <v-slider v-model="request.params.brightness" class="align-center ml-0"
            :step="device.features['--brightness']['interval']"
            :min="device.features['--brightness']['limits'][0]"
            :max="device.features['--brightness']['limits'][1]">
            <template #prepend>
              <v-text-field v-model="request.params.brightness" 
                :label="$t('scan.brightness')" style="width: 60px" type="number" />
            </template>
          </v-slider>
        </template>

        <div v-if="'--contrast' in device.features">
          <v-slider v-model="request.params.contrast" class="align-center ml-0"
            :step="device.features['--contrast']['interval']"
            :min="device.features['--contrast']['limits'][0]"
            :max="device.features['--contrast']['limits'][1]">
            <template #prepend>
              <v-text-field v-model="request.params.contrast" 
                :label="$t('scan.contrast')" style="width: 60px" type="number" />
            </template>
          </v-slider>
        </div>
      </v-col>
      
      <v-spacer />
    </v-row>

    <div v-if="smAndDown" class="scan-mobile-actions">
      <v-btn color="blue" size="large" class="scan-mobile-primary" @click="scan(1)">
        {{ $t('scan.btn-scan') }} <v-icon class="ml-2" :icon="mdiCamera" />
      </v-btn>
      <v-btn v-if="geometry" color="green" @click="createPreview">
        {{ $t('scan.btn-preview') }} <v-icon class="ml-2" :icon="mdiMagnify" />
      </v-btn>
      <v-btn color="amber" variant="tonal" @click="deletePreview">
        {{ $t('scan.btn-clear') }} <v-icon class="ml-2" :icon="mdiDelete" />
      </v-btn>
    </div>

    <batch-dialog ref="batchDialog" />
  </div>
</template>

<script>
import { mdiCamera, mdiDelete, mdiMagnify, mdiRefresh } from '@mdi/js';
import { Cropper } from 'vue-advanced-cropper';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import BatchDialog from './BatchDialog.vue';

import Common from '../classes/common';
import Device from '../classes/device';
import Request from '../classes/request';
import Storage from '../classes/storage';

import 'vue-advanced-cropper/dist/style.css';

const storage = Storage.instance();

function round(n, dp) {
  const f = Math.pow(10, dp || 0);
  return Math.round(n * f) / f;
}

function sanitiseLocaleKey(s) {
  return s.toLowerCase().replace(/\[/g, '(').replace(/\]/g, ')');
}

export default {

  name: 'Scan',

  components: {
    Cropper,
    BatchDialog
  },

  emits: ['mask', 'notify'],

  setup() {
    const { te } = useI18n();
    const { smAndDown } = useDisplay();
    return {
      mdiCamera,
      mdiDelete,
      mdiMagnify,
      mdiRefresh,
      smAndDown,
      te
    };
  },

  data() {
    const device = Device.default();
    device.name = this.$t('global.no-data-text');
    const request = Request.create(null, device);

    return {
      context: {
        devices: [
          device
        ],
        paperSizes: [],
        version: '0'
      },
      device: device,
      img: null,
      request: request,
      preview: {
        timer: 0,
        width: 400,
        key: 0
      },
      job: {
        pollTimer: 0,
        status: null
      }
    };
  },

  computed: {
    geometry() {
      return ['-x', '-y', '-l', '-t'].every(s => s in this.device.features);
    },

    previewStyle() {
      return this.smAndDown
        ? undefined
        : { width: `${this.preview.width}px` };
    },

    deviceSize() {
      return !this.geometry ? undefined : {
        width: this.device.features['-x'].limits[1],
        height: this.device.features['-y'].limits[1]
      };
    },

    batchModes() {
      return this.device.settings.batchMode.options.map(mode => {
        const key = `batch-mode.${sanitiseLocaleKey(mode)}`;
        let translation = this.$t(key);
        return {
          text: translation === key ? mode : translation,
          value: mode
        };
      });
    },

    filters() {
      return this.device.settings.filters.options.map(f => {
        return {
          text: this.$t(f),
          value: f
        };
      });
    },

    modes() {
      return '--mode' in this.device.features
        ? this.device.features['--mode'].options.map(mode => {
          const key = `mode.${sanitiseLocaleKey(mode)}`;
          return {
            text: this.te(key) ? this.$t(key) : mode,
            value: mode
          };
        })
        : undefined;
    },

    adfModes() {
      return '--adf-mode' in this.device.features
        ? this.device.features['--adf-mode'].options.map(adfMode => {
          const key = `adf-mode.${sanitiseLocaleKey(adfMode)}`;
          return {
            text: this.te(key) ? this.$t(key) : adfMode,
            value: adfMode
          };
        })
        : undefined;
    },

    paperSizes() {
      if (!this.geometry) {
        return undefined;
      }

      const deviceSize = {
        x: this.device.features['-x'].limits[1],
        y: this.device.features['-y'].limits[1]
      };

      return this.context.paperSizes
        .filter(paper => paper.dimensions.x <= deviceSize.x && paper.dimensions.y <= deviceSize.y)
        .map(paper => {
          const variables = (paper.name.match(/@:[a-z-.]+/ig) || []).map(s => s.substr(2));
          variables.forEach(v => {
            paper.name = paper.name.replaceAll(`@:${v}`, this.$t(v));
          });
          return paper;
        });
    },

    pipelines() {
      return this.device.settings.pipeline.options.map(p => {
        const variables = (p.match(/@:[a-z-.]+/ig) || []).map(s => s.substr(2));
        let text = p;
        variables.forEach(v => {
          text = text.replaceAll(`@:${v}`, this.$t(v));
        });

        return {
          text: text,
          value: p
        };
      });
    },

    sources() {
      return '--source' in this.device.features
        ? this.device.features['--source'].options.map(source => {
          const key = `source.${sanitiseLocaleKey(source)}`;
          const x =  {
            text: this.te(key) ? this.$t(key) : source,
            value: source
          };
          return x;
        })
        : undefined;
    }
  },

  watch: {
    request: {
      handler(request) {
        storage.request = request;
      },
      deep: true
    }
  },

  mounted() {
    this._resizePreview();
    this.readContext().then(() => {
      this.readPreview();
      this.reconnectJob();
    });
    window.addEventListener('resize', () => {
      clearTimeout(this.preview.timer);
      this.preview.timer = setTimeout(this._resizePreview, 100);
    });
    window.addEventListener('pageshow', this.reconnectJob);
  },

  beforeUnmount() {
    this.stopPollingJob();
    window.removeEventListener('pageshow', this.reconnectJob);
  },

  methods: {
    _resizePreview() {
      const paperRatio = this.geometry
        ? this.deviceSize.width / this.deviceSize.height
        : 210 / 297;

      // This only makes a difference when the col-width="auto" - so md+
      const mdBreakpoint = 960;
      if (window.innerWidth >= mdBreakpoint) {
        const appbarHeight = 80;
        const availableWidth = window.innerWidth - 30;
        const availableHeight = window.innerHeight - appbarHeight;
        const desiredWidth = availableHeight * paperRatio;
        this.preview.width = Math.min(availableWidth / 2, desiredWidth);
        this.preview.key += 1;
      } else {
        this.preview.width = window.innerWidth - 32;
        this.preview.key += 1;
      }
    },

    _fetch(url, options) {
      this.mask(1);
      return Common.fetch(url, options)
        .then(data => {
          this.mask(-1);
          return data;
        })
        .catch(error => {
          this.notify({ type: 'e', message: error });
          this.mask(-1);
          return error;
        });
    },

    createPreview() {
      this.mask(1);

      // Keep reloading the preview image
      const timer = window.setInterval(this.readPreview, 1000);

      let data = Common.clone(this.request);

      this._fetch('api/v1/preview', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(() => {
        window.clearInterval(timer);

        // Some scanners don't create the preview until after the scan has finished.
        // Run preview one last time
        window.setTimeout(this.readPreview, 1000);
        this.mask(-1);
      }).catch(() => {
        this.mask(-1);
      });
    },

    deletePreview() {
      this.mask(1);
      Common.fetch('api/v1/preview', {
        method: 'DELETE'
      }).then(() => {
        this.notify({ type: 'i', message: this.$t('scan.message:deleted-preview') });
        this.readPreview();
        this.mask(-1);
      }).catch(error => {
        this.notify({ type: 'e', message: error });
        this.mask(-1);
      });
    },

    pixelsPerMm() {
      const scanner = this.deviceSize;

      // The preview image may not have perfectly scaled dimensions
      // because pixel counts are integers. So we report a horizontal
      // and vertical resolution
      const image = this.$refs.cropper.imageSize;
      return {
        x: image.width / scanner.width,
        y: image.height / scanner.height
      };
    },

    scaleCoordinates(coordinates, xScale, yScale) {
      return {
        width: round(coordinates.width * xScale, 1),
        height: round(coordinates.height * yScale, 1),
        left: round(coordinates.left * xScale, 1),
        top: round(coordinates.top * yScale, 1)
      };
    },

    cropperDefaultPosition() {
      const adjusted = this.scaleCoordinates(
        this.request.params,
        this.pixelsPerMm().x,
        this.pixelsPerMm().y);

      return {
        left: adjusted.left,
        top: adjusted.top
      };
    },

    cropperDefaultSize() {
      const adjusted = this.scaleCoordinates(
        this.request.params,
        this.pixelsPerMm().x,
        this.pixelsPerMm().y);

      return {
        width: adjusted.width,
        height: adjusted.height
      };
    },

    mask(add) {
      this.$emit('mask', add);
    },

    notify(notification) {
      this.$emit('notify', notification);
    },

    clearActiveJob() {
      storage.activeJobId = null;
      this.job.status = null;
      this.stopPollingJob();
    },

    startPollingJob() {
      if (!this.job.pollTimer) {
        this.job.pollTimer = window.setInterval(this.pollJob, 2000);
      }
    },

    stopPollingJob() {
      if (this.job.pollTimer) {
        window.clearInterval(this.job.pollTimer);
        this.job.pollTimer = 0;
      }
    },

    async fetchJob(id) {
      return await Common.fetch(`api/v1/scan/jobs/${id}`, {
        cache: 'no-store',
        method: 'GET'
      });
    },

    async pollJob() {
      if (!storage.activeJobId) {
        this.stopPollingJob();
        return;
      }

      try {
        const job = await this.fetchJob(storage.activeJobId);
        this.handleJob(job, false);
      } catch (error) {
        this.notify({ type: 'e', message: error });
        this.clearActiveJob();
      }
    },

    async reconnectJob() {
      if (storage.activeJobId) {
        try {
          const job = await this.fetchJob(storage.activeJobId);
          if (['created', 'waiting', 'scanning', 'processing'].includes(job.status)) {
            if (window.confirm(`${this.$t('scan.btn-scan')}: continue active scan job?`)) {
              this.handleJob(job, true);
            } else {
              this.cancelJob(job.id);
            }
          } else if (['completed', 'failed', 'cancelled', 'expired'].includes(job.status)) {
            this.handleJob(job, true);
          }
        } catch (error) {
          storage.activeJobId = null;
        }
        return;
      }

      try {
        const jobs = await Common.fetch('api/v1/scan/jobs?active=true', {
          cache: 'no-store',
          method: 'GET'
        });
        if (jobs.length === 1
          && window.confirm(`${this.$t('scan.btn-scan')}: continue active scan job?`)) {
          storage.activeJobId = jobs[0].id;
          this.handleJob(jobs[0], true);
        } else if (jobs.length === 1) {
          this.cancelJob(jobs[0].id);
        }
      } catch (error) {
        // Reconnect is best-effort and must not block normal scanning.
      }
    },

    handleJob(job, fromReconnect) {
      this.job.status = job.status;
      if (['scanning', 'processing', 'created'].includes(job.status)) {
        this.startPollingJob();
        return;
      }

      this.stopPollingJob();
      if (job.status === 'waiting') {
        if (job.batch === 'manual') {
          this.openManualJobDialog(job, fromReconnect);
        }
        return;
      }

      this.clearActiveJob();
      if (job.status === 'completed') {
        if (storage.settings.showFilesAfterScan) {
          this.$router.push('/files');
        } else {
          this.readPreview();
        }
      } else if (['failed', 'cancelled', 'expired'].includes(job.status)) {
        this.notify({ type: 'e', message: job.error || `Scan job ${job.status}` });
      }
    },

    openManualJobDialog(job, fromReconnect) {
      const page = job.pages[job.pages.length - 1];
      const options = {
        message: page
          ? `${this.$t('scan.message:preview-of-page')} ${page.index}`
          : this.$t('scan.message:turn-documents'),
        image: page ? page.image : null,
        onFinish: () => {
          this.finishJob(job.id);
        },
        onNext: () => {
          this.scanNextPage(job.id);
        },
        onCancel: () => {
          this.cancelJob(job.id);
        }
      };
      if (page) {
        options.onRescan = () => {
          this.rescanPage(job.id, page.index);
        };
      }
      if (fromReconnect || page) {
        this.$refs.batchDialog.open(options);
      }
    },

    async scanNextPage(id) {
      this.mask(1);
      try {
        const job = await Common.fetch(`api/v1/scan/jobs/${id}/pages`, {
          method: 'POST'
        });
        this.handleJob(job, false);
      } catch (error) {
        this.notify({ type: 'e', message: error });
        this.clearActiveJob();
      }
      this.mask(-1);
    },

    async rescanPage(id, index) {
      this.mask(1);
      try {
        const job = await Common.fetch(`api/v1/scan/jobs/${id}/pages/${index}/rescan`, {
          method: 'POST'
        });
        this.handleJob(job, false);
      } catch (error) {
        this.notify({ type: 'e', message: error });
        this.clearActiveJob();
      }
      this.mask(-1);
    },

    async finishJob(id) {
      this.mask(1);
      try {
        const job = await Common.fetch(`api/v1/scan/jobs/${id}/finish`, {
          method: 'POST'
        });
        this.handleJob(job, false);
      } catch (error) {
        this.notify({ type: 'e', message: error });
        this.clearActiveJob();
      }
      this.mask(-1);
    },

    async cancelJob(id) {
      this.mask(1);
      try {
        const job = await Common.fetch(`api/v1/scan/jobs/${id}`, {
          method: 'DELETE'
        });
        this.handleJob(job, false);
      } catch (error) {
        this.notify({ type: 'e', message: error });
        this.clearActiveJob();
      }
      this.mask(-1);
    },

    onCoordinatesChange() {
      const adjusted = this.scaleCoordinates(
        this.request.params,
        this.pixelsPerMm().x,
        this.pixelsPerMm().y);

      this.$refs.cropper.setCoordinates(adjusted);
    },

    onCropperChange({ coordinates }) {
      const adjusted = this.scaleCoordinates(
        coordinates,
        1 / this.pixelsPerMm().x,
        1 / this.pixelsPerMm().y);

      // The cropper changes even when coordinates are set manually. This will
      // result in manually set values being overwritten because of rounding.
      // If someone is taking the trouble to set values manually then they
      // should be preserved. We should only update the values if they breach
      // a threshold or the scanner dimensions
      const scanner = this.deviceSize;
      const params = this.request.params;
      const threshold = 0.4;
      const boundAndRound = (n, min, max) => round(Math.min(Math.max(min, n), max), 1);
      const bestValue = (current, crop, min, max) => Math.abs(current - crop) < threshold
        ? boundAndRound(current, min, max)
        : boundAndRound(crop, min, max);

      params.width = bestValue(params.width, adjusted.width, 0, scanner.width);
      params.height = bestValue(params.height, adjusted.height, 0, scanner.height);
      params.left = bestValue(params.left, adjusted.left, 0, scanner.width);
      params.top = bestValue(params.top, adjusted.top, 0, scanner.height);
    },

    readContext() {
      // Only show notification if things are slow (first time / force)
      const timer = window.setTimeout(() => {
        this.notify({ type: 'i', message: this.$t('scan.message:loading-devices') });
      }, 250);

      return this._fetch('api/v1/context').then(context => {
        window.clearTimeout(timer);

        if (context.devices && context.devices.length > 0) {
          this.context = context;
          this.device = context.devices[0];
          this.request = this.buildRequest();
          for (let test of context.diagnostics) {
            if (!test.success) {
              this.notify({ type: 'e', message: test.message });
            }
          }
        } else {
          this.notify({ type: 'e', message: this.$t('scan.message:no-devices') });
        }
      });
    },

    deviceRefresh() {
      this._fetch('api/v1/context', {
        method: 'DELETE'
      }).then(() => {
        this.readContext();
      });
    },

    readPreview() {
      // Gets the preview image as a base64 encoded jpg and updates the UI
      const uri = 'api/v1/preview?' + new URLSearchParams(
        this.request.filters.map(e => ['filter', e]));

      this._fetch(uri, {
        cache: 'no-store',
        method: 'GET'
      }).then(data => {
        this.img = 'data:image/jpeg;base64,' + data.content;
        this._resizePreview();
      });
    },

    buildRequest() {
      let request = storage.request;
      if (request && request.params) {
        this.device = this.context.devices.filter(d => d.id === request.params.deviceId)[0]
          || this.context.devices[0];
      }

      request = Request.create(request, this.device);
      return request;
    },

    clear() {
      storage.request = null;
      this.request = this.buildRequest();
    },

    scan() {
      const data = Common.clone(this.request);
      this._fetch('api/v1/scan/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then((job) => {
        if (job && job.id) {
          storage.activeJobId = job.id;
          if (job.batch === 'manual') {
            this.scanNextPage(job.id);
          } else {
            this.handleJob(job, false);
          }
        } else {
          this.notify({ type: 'e', message: 'Invalid scan job response' });
        }
      });
    },

    updatePaperSize(value) {
      if (value.dimensions) {
        this.request.params.width = value.dimensions.x;
        this.request.params.height = value.dimensions.y;
        this.onCoordinatesChange();
      }
    }
  }
};
</script>

<style scoped>
#mask {
  position: fixed;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,.4);
  top: 0;
  left: 0;
  z-index: 10;
}

.scan-preview {
  min-width: 0;
}

.scan-coordinate-grid {
  display: grid;
  gap: 0 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.scan-mobile-actions {
  align-items: stretch;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  bottom: 56px;
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
  left: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  position: fixed;
  right: 0;
  z-index: 1000;
}

.scan-mobile-primary {
  grid-column: 1 / -1;
}

@media (max-width: 959px) {
  .scan-page {
    padding-bottom: 136px;
  }

  .scan-settings,
  .scan-adjustments {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 12px;
    padding: 16px;
  }

  .cropper,
  .scan-preview :deep(.v-img) {
    max-height: calc(100vh - 248px);
  }
}

@media (min-width: 960px) {
  .scan-mobile-actions {
    display: none;
  }
}
</style>
