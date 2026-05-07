<template>
  <v-dialog v-model="show" aria-role="dialog" max-width="920" :fullscreen="smAndDown" persistent aria-modal @keydown.stop="_onKeys">
    <v-card class="batch-dialog-card">
      <div class="batch-dialog-header">
        <span class="batch-dialog-kicker">{{ $t('scan.batch') }}</span>
        <v-card-title class="batch-dialog-title">
          {{ message }}
        </v-card-title>
      </div>
      <v-card-text class="batch-dialog-content">
        <div v-if="image" class="batch-dialog-preview-frame">
          <v-img class="batch-dialog-preview" :src="'data:image/jpeg;base64,' + image" contain />
        </div>
        <div v-if="!image" class="batch-dialog-empty">
          {{ $t('scan.message:turn-documents') }}
        </div>
      </v-card-text>
      <v-card-actions class="batch-dialog-actions">
        <div class="batch-dialog-secondary-actions">
          <v-btn class="batch-dialog-cancel" color="warning" variant="tonal" @click.prevent="cancel">{{ $t('batch-dialog.btn-cancel') }}</v-btn>
          <v-btn v-if="onRescan" class="batch-dialog-rescan" variant="tonal" @click.prevent="rescan">{{ $t('batch-dialog.btn-rescan') }}</v-btn>
        </div>
        <div class="batch-dialog-primary-actions">
          <v-btn v-if="onFinish" class="batch-dialog-finish" color="success" variant="tonal" @click.prevent="finish">{{ $t('batch-dialog.btn-finish') }}</v-btn>
          <v-btn class="batch-dialog-next" color="primary" size="large" @click.prevent="next">{{ $t('batch-dialog.btn-next') }}</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Constants from '../classes/constants';
import { useDisplay } from 'vuetify';

export default {
  name: 'BatchDialog',
  setup() {
    const { smAndDown } = useDisplay();
    return {
      smAndDown
    };
  },

  data() {
    return {
      message: null,
      image: null,
      show: false,
      onFinish: null,
      onNext: null,
      onRescan: null,
      onCancel: null,
    };
  },

  methods: {
    _onKeys(event) {
      if (event.keyCode === Constants.Keys.enter) {
        if (event.target?.closest('button, a, input, select, textarea, [role="button"], [tabindex]')) {
          return;
        }
        this.next();
      }
    },

    finish() {
      this.show = false;
      if (this.onFinish) {
        this.onFinish();
      }
    },

    rescan() {
      this.show = false;
      if (this.onRescan) {
        this.onRescan();
      }
    },

    next() {
      this.show = false;
      if (this.onNext) {
        this.onNext();
      }
    },

    cancel() {
      this.show = false;
      if (this.onCancel) {
        this.onCancel();
      }
    },

    open(options) {
      this.message = options.message;
      this.image = options.image;
      this.onFinish = options.onFinish;
      this.onRescan = options.onRescan;
      this.onNext = options.onNext;
      this.onCancel = options.onCancel;
      this.show = true;
    }
  }
};
</script>

<style scoped>
.batch-dialog-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;
}

.batch-dialog-header {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  padding: 20px 24px 16px;
}

.batch-dialog-kicker {
  color: rgba(var(--v-theme-on-surface), 0.62);
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.batch-dialog-title {
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.2;
  padding: 4px 0 0;
  white-space: normal;
}

.batch-dialog-content {
  background:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.025) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.025) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.025) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.025) 75%);
  background-color: rgba(var(--v-theme-on-surface), 0.018);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  flex: 1 1 auto;
  overflow: auto;
  padding: 22px;
}

.batch-dialog-preview-frame {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.16);
  margin: 0 auto;
  max-width: min(100%, 720px);
  overflow: hidden;
}

.batch-dialog-preview {
  max-height: 66vh;
}

.batch-dialog-empty {
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.9);
  border: 1px dashed rgba(var(--v-border-color), 0.32);
  border-radius: 16px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex;
  justify-content: center;
  min-height: 320px;
  padding: 32px;
  text-align: center;
}

.batch-dialog-actions {
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 20px;
}

.batch-dialog-secondary-actions,
.batch-dialog-primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 959px) {
  .batch-dialog-card {
    border-radius: 0;
    height: 100%;
  }

  .batch-dialog-header {
    padding: 18px 18px 14px;
  }

  .batch-dialog-content {
    padding: 14px;
  }

  .batch-dialog-preview {
    max-height: calc(100vh - 250px);
  }

  .batch-dialog-actions {
    box-shadow: 0 -12px 30px rgba(15, 23, 42, 0.08);
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  }

  .batch-dialog-secondary-actions,
  .batch-dialog-primary-actions {
    display: contents;
  }

  .batch-dialog-actions .v-btn {
    min-width: 0;
  }

  .batch-dialog-rescan {
    order: 1;
  }

  .batch-dialog-next {
    order: 2;
  }

  .batch-dialog-finish {
    order: 3;
  }

  .batch-dialog-cancel {
    order: 4;
  }

  .batch-dialog-next {
    grid-column: 1 / -1;
  }
}
</style>
